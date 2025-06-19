const mongoose = require("mongoose");

const APIResponse = require("../utils/APIResponse");
const user = require("../models/UserModel");
const otp = require("../models/OTPModel");
const client = require("../models/ClientModel");

const DataUploadController = {
  async personalInformation(req, res) {
    try {
      const { otp_id, dob, phoneNo, NIN } = req.body;
      if (!dob || !phoneNo) {
        return APIResponse.error(res, null, "Bad Request", 400);
      }
      console.log(otp_id, dob, phoneNo, NIN);

      const session = await mongoose.startSession(); // Start a session transaction
      session.startTransaction();
      const insertRecord = await client.updateOne(
        { otp_id: otp_id },
        {
          $set: {
            dob: dob,
            phoneNo: phoneNo,
            NIN: NIN,
          },
        },
        {
          upsert: true,
        }
      );
      await session.commitTransaction(); // Commit transaction
      session.endSession();
      return APIResponse.suceess(res, insertRecord, "Success", 200);
    } catch (err) {
      console.log("Error in saving information", err);
      return APIResponse.error(res, null, "Internal Server Error", 500);
    }
  },
};

module.exports = DataUploadController;
