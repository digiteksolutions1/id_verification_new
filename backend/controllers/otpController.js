const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const crypto = require("crypto");

const APIResponse = require("../utils/APIResponse");
const user = require("../models/UserModel");
const otp = require("../models/OTPModel");
const client = require("../models/ClientModel");
const hash = require("../utils/hash");
const { generateToken, generateTokenForClient } = require("../auth/jwt");
const OTPModel = require("../models/OTPModel");

const otpController = {
  async generateTokenForAdmin(req, res) {
    const session = await mongoose.startSession(); // Start a session transaction
    session.startTransaction();
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return APIResponse.error(
          res,
          null,
          "Name, Email and password are required",
          400
        );
      }
      const userFind = await user.findOne({ email: email, name: name });
      if (!userFind) {
        return APIResponse.error(res, {}, "No user found", 404);
      }
      const isMatch = await hash.comparePassword(password, userFind.password);
      if (!isMatch) {
        return APIResponse.error(res, {}, "Invalid Credentials", 401);
      }
      const token = generateToken(userFind);
      await session.commitTransaction(); // Commit transaction
      session.endSession();
      return APIResponse.suceess(
        res,
        token,
        "Token Generated Successfully",
        200
      );
    } catch (err) {
      console.log("Error in generating token", err);
      return APIResponse.error(res, null, "Internal Server Error", 500);
    }
  },
  async generateOTP(req, res) {
    const session = await mongoose.startSession(); // Start a session for transaction
    session.startTransaction();
    try {
      const { clientName, idDoc, addressDoc, images, DOB } = req.body;
      if (!clientName) {
        return APIResponse.error(res, {}, "Client Name is missing", 400);
      }
      // const findUser = await user.findOne(
      //   {
      //     name: req.user.name,
      //     email: req.user.email,
      //   },
      //   { _id: 1 }
      // );
      // if (!findUser) {
      //   return APIResponse.error(res, {}, "No such user found", 404);
      // }
      let otp_random;
      do {
        otp_random = crypto.randomInt(100000, 999999).toString();
      } while (await otp.exists({ otp_random: otp_random }));
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const otpRecord = await otp.create({
        otp_random: otp_random,
        generated_by: findUser,
        expires_at: expiry,
        idDoc: idDoc,
        addressDoc: addressDoc,
        images: images,
        dob: DOB,
      });
      await client.create({ clientName: clientName, otp_id: otpRecord._id });

      await session.commitTransaction(); // Commit transaction
      session.endSession();
      return APIResponse.suceess(
        res,
        {
          otp_id: otpRecord._id,
          otp: otpRecord.otp_random,
          expiryDate: otpRecord.expires_at,
        },
        "Success",
        200
      );
    } catch (err) {
      console.log("Error in generating OTP", err);
      return APIResponse.error(res, null, "Internal Server Error", 500);
    }
  },
  async authenticateOTP(req, res) {
    try {
      const { otp } = req.body;
      if (!otp) {
        return APIResponse.error(res, null, "Verification Code Required ", 400);
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
      const token = generateTokenForClient(otpData);
      const responseData = {
        idDoc: otpData.idDoc,
        addressDoc: otpData.addressDoc,
        images: otpData.images,
        dob: otpData.dob,
        clientName: otpData.client.clientName,
        token: token,
      };
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "Lax",
      });

      return APIResponse.suceess(
        res,
        responseData,
        "Authentication Successful",
        200
      );
    } catch (err) {
      console.log("Error in authenticating OTP", err);
      return APIResponse.error(res, null, "Internal Server Error", 500);
    }
  },
};

module.exports = otpController;
