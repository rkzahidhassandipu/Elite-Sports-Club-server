const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const client = require("./config/db");
const verifyToken = require("./middleware/verifyToken");
const { ObjectId } = require("mongodb");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

async function run() {
  try {
    await client.connect();

    const db = client.db("assignment12");
    const itemsCollection = db.collection("Products");
    const CourtCollection = db.collection("Courts");
    const CourtsBookingCollection = db.collection("CourtsBooking");
    const userCollection = db.collection("user");

    // Example route
    // Get all courts
    app.get("/courts", async (req, res) => {
      try {
        const courts = await CourtCollection.find().toArray();
        res.send(courts);
      } catch (error) {
        console.error("Error fetching courts:", error);
        res.status(500).send({ error: "Failed to fetch court data" });
      }
    });

    // get userRle
    app.get("/users/role/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const user = await userCollection.findOne({ email });
        if (!user) {
          return res
            .status(404)
            .send({ success: false, message: "User not found" });
        }

        res.send({ userRole: user.userRole || "user" }); // default to "user" if role not set
      } catch (error) {
        console.error("Error getting user role:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to get user role" });
      }
    });

    // pending data get by email
    app.get("/bookings", async (req, res) => {
      try {
        const { email } = req.query;

        if (!email) {
          return res
            .status(400)
            .json({ success: false, message: "Email is required" });
        }

        const bookings = await CourtsBookingCollection.find({
          userEmail: email,
          status: "pending",
        }).toArray();

        res.send(bookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch bookings" });
      }
    });

    app.post("/bookings", async (req, res) => {
      try {
        const booking = req.body;

        // Validate required fields
        const requiredFields = [
          "courtId",
          "slots",
          "date",
          "pricePerSlot",
          "userEmail",
        ];

        const missingFields = requiredFields.filter((field) => !booking[field]);

        if (missingFields.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missingFields.join(", ")}`,
          });
        }

        // Calculate total price
        const totalPrice =
          booking.slots.length * parseFloat(booking.pricePerSlot);

        const bookingData = {
          courtId: booking.courtId,
          date: booking.date,
          slots: booking.slots, // array of selected times
          pricePerSlot: booking.pricePerSlot,
          totalPrice,
          userEmail: booking.userEmail,
          status: "pending", // default status
          createdAt: new Date(),
        };

        const result = await CourtsBookingCollection.insertOne(bookingData);

        res.status(201).json({
          success: true,
          message: "Booking created successfully",
          bookingId: result.insertedId,
        });
      } catch (error) {
        console.error("Error creating booking:", error.message);
        res.status(500).json({
          success: false,
          message: "Server error while booking court",
        });
      }
    });

    // create user info
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;

        // Check required fields
        if (!user.name || !user.email) {
          return res.status(400).send({ error: "Name and email are required" });
        }

        // Optional: check for duplicate email
        const exists = await userCollection.findOne({ email: user.email });
        if (exists) {
          return res.status(409).send({ error: "User already exists" });
        }

        const result = await userCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        console.error("User save error:", error);
        res.status(500).send({ error: "Failed to save user" });
      }
    });

    // POST /jwt or /login
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });

      res
        .cookie("access-token", token, {
          httpOnly: true, // Secure against XSS
          secure: process.env.NODE_ENV === "production", // Only send on HTTPS in production
          sameSite: "Strict", // or 'Lax'
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .send({ success: true });
    });

    // user booking approve
    app.put("/bookings/approve/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await CourtsBookingCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "approved" } }
        );

        if (result.modifiedCount > 0) {
          res.send({ success: true, message: "Booking approved" });
        } else {
          res
            .status(404)
            .send({ success: false, message: "Booking not found" });
        }
      } catch (error) {
        console.error("Approval error:", error);
        res.status(500).send({ success: false, message: "Approval failed" });
      }
    });

    // bookings delete
    app.delete("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await CourtsBookingCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount > 0) {
          res.send({
            success: true,
            message: "Booking cancelled successfully",
          });
        } else {
          res
            .status(404)
            .send({ success: false, message: "Booking not found" });
        }
      } catch (error) {
        console.error("Error deleting booking:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to delete booking" });
      }
    });

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}
run().catch(console.dir);

// Default route
app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
});

app.listen(port, () => {
  console.log(`🌐 Server listening on http://localhost:${port}`);
});
