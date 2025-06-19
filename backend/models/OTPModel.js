const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  otp_random: { type: String, required: true },
  generated_at: { type: Date, default: Date.now },
  generated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: false,
  },
  isValid: { type: Boolean, default: true },
  used_at: { type: Date },
  expires_at: { type: Date, required: true },
  idDoc: { type: Boolean },
  addressDoc: { type: Boolean },
  images: { type: Boolean },
  dob: { type: Boolean },
});

module.exports = mongoose.model("otp", otpSchema);
