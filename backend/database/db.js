const mongoose = require("mongoose");
require("dotenv").config();

const mongoURI = process.env.MONGO_URI;

(async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
})();
