const express = require("express");
const cors = require("cors");
const path = require("path");
const router = require("./routes/indexRoutes");
const hash = require("./utils/hash");
const cookieParser = require("cookie-parser");
require("dotenv").config();
require("./database/db");

const port = process.env.PORT;
const app = express();
const corsOption = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
};
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOption));
app.get("/", (req, res) => {
  res.send("Website is working");
});
app.use("/", router);

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// (async () => {
//   const pass = await hash.hashPassword("");
//   console.log(pass);
// })();
