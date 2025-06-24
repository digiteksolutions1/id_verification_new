const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { google, getAuthClient } = require("../google/googleClient");

// Multer setup: store temporarily
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/tmp"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `${file.fieldname}-${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).fields([
  { name: "frontImage", maxCount: 1 },
  { name: "backImage", maxCount: 1 },
]);

// 🔍 Extract Google Drive folder ID from full URL
const extractFolderId = (folderLink) => {
  const match = folderLink.match(/[-\w]{25,}/);
  return match ? match[0] : null;
};

// 🔍 Get subfolder named "ID" under parent folder
const getOrCreateIDFolder = async (drive, parentFolderId) => {
  const res = await drive.files.list({
    q: `'${parentFolderId}' in parents and name='ID' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  // If not found, create it
  const createRes = await drive.files.create({
    requestBody: {
      name: "ID",
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
  });

  return createRes.data.id;
};

// 🚀 Upload file to Drive
const uploadFileToDrive = async (drive, filePath, fileName, folderId) => {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };
  const media = {
    mimeType: "image/jpeg",
    body: fs.createReadStream(filePath),
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, webViewLink",
  });

  return file.data;
};

// 📦 Main upload handler
const uploadIDImages = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res
        .status(400)
        .json({ message: "Upload error", error: err.message });
    }

    const { client, folderLink } = req.body;
    console.log(folderLink);

    if (!client || !folderLink) {
      return res
        .status(400)
        .json({ message: "Client and folder link are required" });
    }

    const cleanedClient = client.replace(/[^a-zA-Z0-9_-]/g, "_");

    if (!req.files.frontImage || !req.files.backImage) {
      return res
        .status(400)
        .json({ message: "Both front and back images are required" });
    }

    const frontFile = req.files.frontImage[0];
    const backFile = req.files.backImage[0];
    const timestamp = new Date().toISOString().split("T")[0];

    const frontName = `frontIDimage_${cleanedClient}_${timestamp}${path.extname(
      frontFile.filename
    )}`;
    const backName = `backIDimage_${cleanedClient}_${timestamp}${path.extname(
      backFile.filename
    )}`;

    try {
      const auth = await getAuthClient();
      const drive = google.drive({ version: "v3", auth });

      const parentFolderId = extractFolderId(folderLink);
      if (!parentFolderId) {
        return res.status(400).json({ message: "Invalid folder link" });
      }

      const idFolderId = await getOrCreateIDFolder(drive, parentFolderId);

      const uploadedFront = await uploadFileToDrive(
        drive,
        frontFile.path,
        frontName,
        idFolderId
      );
      const uploadedBack = await uploadFileToDrive(
        drive,
        backFile.path,
        backName,
        idFolderId
      );

      // 🧹 Clean up local files
      fs.unlinkSync(frontFile.path);
      fs.unlinkSync(backFile.path);

      return res.status(200).json({
        message: "ID images uploaded to Google Drive successfully",
        data: {
          client,
          frontImage: uploadedFront.webViewLink,
          backImage: uploadedBack.webViewLink,
        },
      });
    } catch (uploadErr) {
      console.error("Drive upload error:", uploadErr);
      return res
        .status(500)
        .json({ message: "Failed to upload to Google Drive" });
    }
  });
};

module.exports = { uploadIDImages };
