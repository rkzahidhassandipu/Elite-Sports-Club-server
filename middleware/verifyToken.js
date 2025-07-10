const jwt = require("jsonwebtoken");
require("dotenv").config(); // Load JWT_SECRET from .env

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  // 🔑 Use JWT_SECRET key here to verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = decoded; // Attach decoded payload to the request
    next();
  });
};

module.exports = verifyToken;
