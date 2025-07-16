const jwt = require("jsonwebtoken");
require("dotenv").config();
const client = require("../config/db"); // path to your MongoDB client file

const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Connect to DB if not already
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }

    const userCollection = client.db("assignment12").collection("user"); // Replace with your DB name

    const user = await userCollection.findOne({ email: decoded.email });

    if (!user || user.userRole !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    next(); // ✅ User is verified and is an admin
  } catch (error) {
    console.error("Admin verification error:", error.message);
    return res.status(403).json({ error: "Forbidden: Invalid token or role" });
  }
};

module.exports = verifyAdmin;
