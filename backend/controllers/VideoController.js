const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, "../uploads/images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const tempName = `${file.fieldname}_temp_${Date.now()}${ext}`;
    cb(null, tempName);
  },
});

// Supported file types
const SUPPORTED_IMAGE_TYPES = [
  ".jpeg",
  ".jpg",
  ".png",
  ".heic",
  ".heif", // Apple formats
  ".webp", // WebP format
  ".tiff",
  ".tif", // TIFF formats
];

const SUPPORTED_VIDEO_TYPES = [
  ".webm",
  ".mp4",
  ".mov", // Apple QuickTime
  ".avi", // AVI format
  ".mkv", // Matroska format
  ".3gp", // Mobile format
  ".m4v", // Apple video format
];

// File filter with extended support
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isImage = SUPPORTED_IMAGE_TYPES.includes(ext);
  const isVideo = SUPPORTED_VIDEO_TYPES.includes(ext);

  if (isImage || isVideo) {
    return cb(null, true);
  }

  const supportedTypes = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES];
  cb(
    new Error(
      `Unsupported file type. Supported types: ${supportedTypes.join(", ")}`
    )
  );
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 25MB max per file
    files: 4, // Max 4 files (3 images + 1 video)
  },
}).fields([
  { name: "front_pose", maxCount: 1 },
  { name: "left_pose", maxCount: 1 },
  { name: "right_pose", maxCount: 1 },
  { name: "verification_video", maxCount: 1 },
]);

// Enhanced controller with better error handling
const uploadVerificationFiles = (req, res) => {
  upload(req, res, async (err) => {
    try {
      // Handle upload errors
      if (err) {
        console.log(err);

        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            message: "File size too large. Max 25MB per file.",
          });
        }
        return res.status(400).json({
          success: false,
          message: "Upload failed",
          error: err.message,
        });
      }

      // Validate all required files
      const requiredFiles = [
        "front_pose",
        "left_pose",
        "right_pose",
        "verification_video",
      ];
      const missingFiles = requiredFiles.filter((field) => !req.files?.[field]);

      if (missingFiles.length > 0) {
        // Clean up any uploaded files
        if (req.files) {
          Object.values(req.files).forEach((files) => {
            files.forEach((file) => fs.unlinkSync(file.path));
          });
        }
        return res.status(400).json({
          success: false,
          message: `Missing required files: ${missingFiles.join(", ")}`,
          required: requiredFiles,
        });
      }

      // Process files
      const client = (req.body.client || "unknown")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 50); // Limit client name length
      const timestamp = Date.now();

      const fileMappings = {
        front_pose: `${client}_frontpose_${timestamp}`,
        left_pose: `${client}_leftpose_${timestamp}`,
        right_pose: `${client}_rightpose_${timestamp}`,
        verification_video: `verification_${timestamp}`,
      };

      const results = {};
      const cleanupFiles = [];

      try {
        // Process each file
        for (const [field, filename] of Object.entries(fileMappings)) {
          const file = req.files[field][0];
          const ext = path.extname(file.originalname).toLowerCase();
          const newFilename = `${filename}${ext}`;
          const newPath = path.join(path.dirname(file.path), newFilename);

          fs.renameSync(file.path, newPath);
          results[field] = newFilename;
          cleanupFiles.push(newPath); // Track for potential cleanup
        }

        return res.status(200).json({
          success: true,
          message: "Verified successfully",
          data: {
            client,
            files: results,
            timestamp: new Date(timestamp).toISOString(),
          },
        });
      } catch (processError) {
        // Clean up any renamed files
        cleanupFiles.forEach((file) => {
          try {
            fs.unlinkSync(file);
          } catch (e) {
            console.error("Cleanup failed:", e);
          }
        });
        throw processError;
      }
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during file processing",
        error: error.message,
      });
    }
  });
};

module.exports = {
  uploadVerificationFiles,
};
