const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  clientName: { type: String },
  dob: { type: String },
  phoneNo: { type: String },
  NIN: { type: String },
  otp_id: { type: mongoose.Schema.Types.ObjectId, ref: "otp", required: true },
  idDocument: { type: String, reqired: false },
  addressDocument: { type: String, reqired: false },
  frontPose: { type: String, reqired: false },
  leftPose: { type: String, reqired: false },
  rightPose: { type: String, reqired: false },
  folderLink: { type: String },
});

module.exports = mongoose.model("client", clientSchema);
