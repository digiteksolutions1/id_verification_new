const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { google, getAuthClient } = require("../google/googleClient");

// 🧩 Multer setup: Temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/tmp"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `temp_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("addressProof");

// 📦 Extract Google Drive Folder ID from folder link
const extractFolderId = (link) => {
  const match = link.match(/[-\w]{25,}/);
  return match ? match[0] : null;
};

// 🔍 Find or create folder named "address"
const getOrCreateAddressFolder = async (drive, parentId) => {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name='address' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });

  if (res.data.files.length > 0) return res.data.files[0].id;

  const createRes = await drive.files.create({
    requestBody: {
      name: "address",
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  return createRes.data.id;
};

// 🚀 Upload file to Google Drive
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

// 🎯 Main controller
const uploadAddressProof = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res
        .status(400)
        .json({ message: "Upload failed", error: err.message });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Address proof file is required." });
    }

    const { client, folderLink } = req.body;

    if (!client || !folderLink) {
      return res
        .status(400)
        .json({ message: "Client and folder link are required." });
    }

    const cleanedClient = client.replace(/[^a-zA-Z0-9_-]/g, "_");
    const ext = path.extname(req.file.originalname);
    const date = new Date().toISOString().split("T")[0];
    const newFilename = `address_proof_${cleanedClient}_${date}${ext}`;
    const tempFilePath = req.file.path;

    try {
      const auth = await getAuthClient();
      const drive = google.drive({ version: "v3", auth });

      const parentFolderId = extractFolderId(folderLink);
      if (!parentFolderId) {
        return res.status(400).json({ message: "Invalid folder link." });
      }

      const addressFolderId = await getOrCreateAddressFolder(
        drive,
        parentFolderId
      );

      const uploaded = await uploadFileToDrive(
        drive,
        tempFilePath,
        newFilename,
        addressFolderId
      );

      fs.unlinkSync(tempFilePath); // 🧹 Clean up local file

      return res.status(200).json({
        message: "Address proof uploaded successfully",
        data: {
          client: cleanedClient,
          fileLink: uploaded.webViewLink,
        },
      });
    } catch (uploadErr) {
      console.error("Upload error:", uploadErr);
      return res.status(500).json({ message: "Google Drive upload failed." });
    }
  });
};

module.exports = {
  uploadAddressProof,
};
