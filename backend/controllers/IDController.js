const path = require("path");
const multer = require("multer");

// 🧼 Storage configuration: don't use req.body here!
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/idcards"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const name = `${file.fieldname}-${timestamp}${ext}`; // temporary filename
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).fields([
  { name: "frontImage", maxCount: 1 },
  { name: "backImage", maxCount: 1 },
]);

const fs = require("fs");
const uploadIDImages = (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.error("Upload error:", err);
      return res
        .status(400)
        .json({ message: "Image upload failed", error: err.message });
    }

    const client =
      req.body.client?.replace(/[^a-zA-Z0-9_-]/g, "_") || "unknown";

    if (!req.files.frontImage || !req.files.backImage) {
      return res.status(400).json({ message: "Both images are required." });
    }

    // ✅ Rename files to include client name now (after multer processes them)
    const renameWithClient = (file) => {
      const ext = path.extname(file.filename);
      const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const field =
        file.fieldname === "frontImage" ? "frontIDimage" : "backIDimage";
      const newFilename = `${field}_${client}_${timestamp}${ext}`;
      const oldPath = file.path;
      const newPath = path.join(path.dirname(oldPath), newFilename);
      fs.renameSync(oldPath, newPath);
      return newFilename;
    };

    const frontImagePath = renameWithClient(req.files.frontImage[0]);
    const backImagePath = renameWithClient(req.files.backImage[0]);

    return res.status(200).json({
      message: "ID images uploaded successfully",
      data: {
        client,
        frontImage: frontImagePath,
        backImage: backImagePath,
      },
    });
  });
};

module.exports = {
  uploadIDImages,
};
