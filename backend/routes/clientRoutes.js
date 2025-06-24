const otpController = require("../controllers/otpController");
const auth = require("../auth/auth");
// const { uploadIDImages } = require("../controllers/IDController");
const { uploadIDImages } = require("../controllers/IDControllerUpdated");
const AuthController = require("../controllers/AuthController");
const DataUploadController = require("../controllers/DataUploadController");
const { Router } = require("express");
const {
  uploadAddressProof,
} = require("../controllers/AddressControllerUpdated");
const {
  uploadVerificationFiles,
} = require("../controllers/VideoControllerUpdated");
const Thankyou = require("../controllers/Thankyou");

const router = require("express").Router();

router.post("/auth", AuthController.authVerify);
router.post("/authenticateOTP", otpController.authenticateOTP);
router.post(
  "/save-personal-info",
  auth,
  DataUploadController.personalInformation
);
// router.post("/upload-id", auth, uploadIDImages);
router.post("/upload-id", auth, uploadIDImages);
router.post("/upload-address", auth, uploadAddressProof);
router.post("/upload-verification", auth, uploadVerificationFiles);
router.post("/thankyou", auth, Thankyou.changeStatus);

module.exports = router;
