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
  origin: ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
};
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOption));

app.use("/", router);

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

