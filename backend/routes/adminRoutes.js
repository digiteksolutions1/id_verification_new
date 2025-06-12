const otpController = require("../controllers/otpController");
const auth = require("../auth/auth");

const router = require("express").Router();

router.post("/generateToken", otpController.generateTokenForAdmin);
router.post("/generateOTP", auth, otpController.generateOTP);

module.exports = router;
