const mongoose = require("mongoose");
const { updateSubmissionStatusInSheet } = require("../google/sheetsService");

const APIResponse = require("../utils/APIResponse");
const otp = require("../models/OTPModel");

const Thankyou = {
  async changeStatus(req, res) {
    const session = await mongoose.startSession(); // Start a session transaction
    session.startTransaction();
    try {
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
      await updateSubmissionStatusInSheet(req.body.id);
      return APIResponse.suceess(res, result, "Success", 200);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.log("Error", err);
      return APIResponse.error(res, null, "Internal Server Error", 500);
    }
  },
};

module.exports = Thankyou;
