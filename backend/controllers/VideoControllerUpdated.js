const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { google, getAuthClient } = require("../google/googleClient");

// Supported types
const SUPPORTED_IMAGE_TYPES = [
  ".jpeg",
  ".jpg",
  ".png",
  ".heic",
  ".heif",
  ".webp",
  ".tiff",
  ".tif",
];
const SUPPORTED_VIDEO_TYPES = [
  ".webm",
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".3gp",
  ".m4v",
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if ([...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}`));
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/tmp");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}_temp_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 4 },
}).fields([
  { name: "front_pose", maxCount: 1 },
  { name: "left_pose", maxCount: 1 },
  { name: "right_pose", maxCount: 1 },
  { name: "verification_video", maxCount: 1 },
]);

// 📂 Extract Google Drive folder ID
const extractFolderId = (link) => {
  const match = link.match(/[-\w]{25,}/);
  return match ? match[0] : null;
};

// 📁 Get or create "Face ID Proof" subfolder
const getOrCreateFaceIDFolder = async (drive, parentId) => {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name='Face ID Proof' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });
  if (res.data.files.length > 0) return res.data.files[0].id;

  const created = await drive.files.create({
    requestBody: {
      name: "Face ID Proof",
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return created.data.id;
};

// ☁️ Upload file to Drive
const uploadToDrive = async (drive, filePath, fileName, folderId) => {
  const media = {
    mimeType: "application/octet-stream",
    body: fs.createReadStream(filePath),
  };
  const meta = { name: fileName, parents: [folderId] };
  const uploaded = await drive.files.create({
    requestBody: meta,
    media,
    fields: "id, webViewLink",
  });
  return uploaded.data;
};

// 🚀 Controller
const uploadVerificationFiles = (req, res) => {
  upload(req, res, async (err) => {
    const cleanup = (paths) => {
      paths.forEach((p) => fs.existsSync(p) && fs.unlinkSync(p));
    };

    try {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const requiredFields = [
        "front_pose",
        "left_pose",
        "right_pose",
        "verification_video",
      ];
      const missing = requiredFields.filter((f) => !req.files?.[f]);
      if (missing.length > 0) {
        cleanup(
          Object.values(req.files)
            .flat()
            .map((f) => f.path)
        );
        return res.status(400).json({
          success: false,
          message: `Missing required files: ${missing.join(", ")}`,
        });
      }

      const { client = "unknown", folderLink } = req.body;
      const cleanedClient = client.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
      const timestamp = Date.now();
      const parentFolderId = extractFolderId(folderLink);
      if (!parentFolderId) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid folder link" });
      }

      const auth = await getAuthClient();
      const drive = google.drive({ version: "v3", auth });
      const faceIDFolderId = await getOrCreateFaceIDFolder(
        drive,
        parentFolderId
      );

      const fileNames = {
        front_pose: `${cleanedClient}_frontpose_${timestamp}`,
        left_pose: `${cleanedClient}_leftpose_${timestamp}`,
        right_pose: `${cleanedClient}_rightpose_${timestamp}`,
        verification_video: `verification_${timestamp}`,
      };

      const uploadedFiles = {};
      const tempPaths = [];

      for (const field of requiredFields) {
        const file = req.files[field][0];
        const ext = path.extname(file.originalname).toLowerCase();
        const newFilename = `${fileNames[field]}${ext}`;
        const filePath = file.path;
        const uploaded = await uploadToDrive(
          drive,
          filePath,
          newFilename,
          faceIDFolderId
        );
        uploadedFiles[field] = uploaded.webViewLink;
        tempPaths.push(filePath); // for cleanup
      }

      cleanup(tempPaths);

      return res.status(200).json({
        success: true,
        message: "Verification files uploaded to Google Drive",
        data: {
          client: cleanedClient,
          links: uploadedFiles,
          timestamp: new Date(timestamp).toISOString(),
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during upload",
        error: error.message,
      });
    }
  });
};

module.exports = {
  uploadVerificationFiles,
};
