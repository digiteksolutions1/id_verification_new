const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/idcards")); // ✅ Save in /uploads/idcards
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = file.fieldname + "-" + timestamp + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).fields([
  { name: "frontImage", maxCount: 1 },
  { name: "backImage", maxCount: 1 },
]);

const uploadIDImages = (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.error("Upload error:", err);
      return res
        .status(400)
        .json({ message: "Image upload failed", error: err.message });
    }

    if (!req.files.frontImage || !req.files.backImage) {
      return res.status(400).json({ message: "Both images are required." });
    }

    const frontImagePath = req.files.frontImage[0].filename;
    const backImagePath = req.files.backImage[0].filename;

    // Optional: save file names to DB here

    return res.status(200).json({
      message: "ID images uploaded successfully",
      data: {
        frontImage: frontImagePath,
        backImage: backImagePath,
      },
    });
  });
};

module.exports = {
  uploadIDImages,
};
