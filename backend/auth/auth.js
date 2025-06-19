const APIresponse = require("../utils/APIResponse");
const { verifyToken } = require("./jwt");

const auth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return APIresponse.error(res, null, "Authentication Required", 401);
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return APIresponse.error(res, null, "You are not authorized", 403);
  }
};

module.exports = auth;
