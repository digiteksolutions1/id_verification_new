const otpController = require("../controllers/otpController");
const auth = require("../auth/auth");
const { uploadIDImages } = require("../controllers/IDController");

const router = require("express").Router();

router.post("/authenticateOTP", otpController.authenticateOTP);
router.post("/upload-id", uploadIDImages);

module.exports = router;
