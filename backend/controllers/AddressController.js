const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ⚙️ Step 1: Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/address"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const tempName = `temp_${Date.now()}${ext}`;
    cb(null, tempName); // Temporary name
  },
});

// ⚙️ Step 2: Multer middleware
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).single("addressProof");

// 🚀 Step 3: Controller function
const uploadAddressProof = (req, res) => {
  upload(req, res, function (err) {
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

    const client =
      req.body.client?.replace(/[^a-zA-Z0-9_-]/g, "_") || "unknown";
    const ext = path.extname(req.file.originalname);
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const newFilename = `address_proof_${client}_${date}${ext}`;
    const oldPath = req.file.path;
    const newPath = path.join(path.dirname(oldPath), newFilename);

    try {
      fs.renameSync(oldPath, newPath);
    } catch (renameErr) {
      return res
        .status(500)
        .json({ message: "Failed to rename file", error: renameErr.message });
    }

    return res.status(200).json({
      message: "Address proof uploaded successfully",
      data: {
        client,
        filename: newFilename,
      },
    });
  });
};

module.exports = {
  uploadAddressProof,
};
