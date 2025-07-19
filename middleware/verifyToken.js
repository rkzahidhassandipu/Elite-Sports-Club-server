const jwt = require("jsonwebtoken");
require("dotenv").config();
const cookieParser = require("cookie-parser");


const verifyToken = (req, res, next) => {
  const token = req.cookies["token"];

console.log("cookie", req.cookies);
  console.log("token", token); 

  if (!token) {
    return res.status(401).json({ error: "Unauthorized access. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
