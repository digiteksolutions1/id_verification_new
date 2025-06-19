const mongoose = require("mongoose");

const APIResponse = require("../utils/APIResponse");
const user = require("../models/UserModel");
const otp = require("../models/OTPModel");
const client = require("../models/ClientModel");
const hash = require("../utils/hash");
const {
  generateToken,
  generateTokenForClient,
  verifyToken,
} = require("../auth/jwt");
const OTPModel = require("../models/OTPModel");

const AuthController = {
  async authVerify(req, res) {
    try {
      const { otp } = req.body;
      const token = req.cookies.token;
      if (!token) {
        return APIResponse.error(res, null, "Invalid Session", 401);
      }
      const decoded = verifyToken(token);
      req.user = decoded;
      if (!otp) {
        return APIResponse.error(res, null, "Bad Request", 400);
      }
      const session = await mongoose.startSession(); // Start a session transaction
      session.startTransaction();
      const result = await OTPModel.aggregate([
        {
          $match: {
            otp_random: otp,
          },
        },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "otp_id",
            as: "client",
          },
        },
        {
          $unwind: "$client",
        },
        {
          $project: {
            // From otps collection
            isValid: 1,
            expires_at: 1,
            idDoc: 1,
            addressDoc: 1,
            images: 1,
            dob: 1,

            // From users collection
            "client.clientName": 1,
            _id: 0,
          },
        },
      ]);
      const otpData = result[0];
      if (result.length === 0) {
        return APIResponse.error(
          res,
          null,
          "This Verification Code doesn't exist",
          404
        );
      }
      if (!otpData.isValid) {
        return APIResponse.error(
          res,
          null,
          "The Verification Code has already been used",
          400
        );
      }
      if (new Date(otpData.expires_at) < new Date()) {
        return APIResponse.error(
          res,
          null,
          "The Verification Code has expired",
          400
        );
      }
      await session.commitTransaction(); // Commit transaction
      session.endSession();
      const responseData = {
        idDoc: otpData.idDoc,
        addressDoc: otpData.addressDoc,
        images: otpData.images,
        dob: otpData.dob,
        clientName: otpData.client.clientName,
        token: token,
      };
      return APIResponse.suceess(
        res,
        responseData,
        "Authentication Successful",
        200
      );
    } catch (err) {
      console.log("Error in authentication", err);
      return APIResponse.error(res, null, "Internal Server Error", 500);
    }
  },
};

module.exports = AuthController;
