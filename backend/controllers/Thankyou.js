const mongoose = require("mongoose");

const APIResponse = require("../utils/APIResponse");
const otp = require("../models/OTPModel");

const Thankyou = {
  async changeStatus(req, res) {
    try {
      const session = await mongoose.startSession(); // Start a session transaction
      session.startTransaction();
      const result = await otp.updateOne(
        { _id: req.body.id },
        {
          $set: {
            isValid: false,
          },
        }
      );
      await session.commitTransaction(); // Commit transaction
      session.endSession();
      return APIResponse.suceess(res, result, "Success", 200);
    } catch (err) {
      console.log("Error", err);
      return APIResponse.error(res, null, "Internal Server Error", 500);
    }
  },
};

module.exports = Thankyou;
