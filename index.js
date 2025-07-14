const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const client = require("./config/db");
const verifyToken = require("./middleware/verifyToken");
const { ObjectId } = require("mongodb");
const Stripe = require("stripe");
const jwt = require("jsonwebtoken");
require("dotenv").config();

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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
    const paymentsCollection = db.collection("payments");
    const couponsCollection = db.collection("Coupon");
    const announcementsCollection = db.collection("announcements");

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

    //coupons code get
    app.get("/coupons", async (req, res) => {
      try {
        const coupons = await couponsCollection
          .find()
          .sort({ createdAt: -1 }) // Newest first
          .toArray();

        res.status(200).json(coupons); // Returning array directly
      } catch (error) {
        console.error("Error fetching coupons:", error.message);
        res.status(500).json({
          success: false,
          message: "Failed to fetch coupons",
        });
      }
    });

    // coupons updated
    app.patch("/coupons/:id", async (req, res) => {
      const id = req.params.id;
      const { code, name, discount } = req.body;

      if (!code || !name || typeof discount !== "number") {
        return res.status(400).json({
          success: false,
          message: "Code, name, and discount are required.",
        });
      }

      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            code,
            name,
            discount,
            updatedAt: new Date(),
          },
        };

        const result = await couponsCollection.updateOne(filter, updateDoc);

        res.status(200).json({
          success: true,
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        console.error("Error updating coupon:", error.message);
        res.status(500).json({
          success: false,
          message: "Failed to update coupon",
        });
      }
    });

    app.delete("/coupons/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const result = await couponsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount > 0) {
          res.status(200).json({
            success: true,
            message: "Coupon deleted successfully",
            deletedCount: result.deletedCount,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Coupon not found",
          });
        }
      } catch (error) {
        console.error("Error deleting coupon:", error.message);
        res.status(500).json({
          success: false,
          message: "Failed to delete coupon",
        });
      }
    });

    // get api by id
    app.get("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid booking ID" });
        }

        const booking = await CourtsBookingCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!booking) {
          return res
            .status(404)
            .json({ success: false, message: "Booking not found" });
        }

        res.json({ success: true, booking });
      } catch (error) {
        console.error("Error fetching booking by ID:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch booking" });
      }
    });

    // get payments history
    app.get("/payments", async (req, res) => {
      try {
        const { email } = req.query;

        if (!email) {
          return res
            .status(400)
            .json({ success: false, message: "Email is required" });
        }

        const payments = await paymentsCollection
          .find({ userEmail: email })
          .sort({ paidAt: -1 }) // optional: newest payments first
          .toArray();

        res.status(200).json({ success: true, payments });
      } catch (error) {
        console.error("Error fetching payments:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch payment history" });
      }
    });

    // get user by email and show membershipDate
    app.get("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const user = await userCollection.findOne({ email });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        res.send({
          success: true,
          user,
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    // announcements post admin
    app.post("/announcements", async (req, res) => {
      try {
        const announcement = req.body;

        if (!announcement.title || !announcement.message) {
          return res.status(400).json({
            success: false,
            message: "Title and message are required",
          });
        }

        const result = await announcementsCollection.insertOne(announcement);

        res.status(201).json({
          success: true,
          message: "Announcement created",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error creating announcement:", error.message);
        res.status(500).json({
          success: false,
          message: "Server error while creating announcement",
        });
      }
    });

    // announcements get
    app.get("/announcements", async (req, res) => {
      try {
        const announcements = await announcementsCollection
          .find()
          .sort({ createdAt: -1 }) // optional: newest first
          .toArray();

        res.status(200).json({
          success: true,
          announcements,
        });
      } catch (error) {
        console.error("Error fetching announcements:", error.message);
        res.status(500).json({
          success: false,
          message: "Server error while fetching announcements",
        });
      }
    });

    // announcements update
    app.patch("/announcements/:id", async (req, res) => {
      const id = req.params.id;
      const { title, message, updatedAt } = req.body;

      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            title,
            message,
            updatedAt: updatedAt || new Date(),
          },
        };

        const result = await announcementsCollection.updateOne(
          filter,
          updateDoc
        );

        res.status(200).json({
          success: true,
          message: "Announcement updated successfully",
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        console.error("Error updating announcement:", error.message);
        res.status(500).json({
          success: false,
          message: "Failed to update announcement",
        });
      }
    });

    // announcements delete
    app.delete("/announcements/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const result = await announcementsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount > 0) {
          res.status(200).json({
            success: true,
            message: "Announcement deleted successfully",
            deletedCount: result.deletedCount,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Announcement not found",
          });
        }
      } catch (error) {
        console.error("Error deleting announcement:", error.message);
        res.status(500).json({
          success: false,
          message: "Failed to delete announcement",
        });
      }
    });

    // apply coupon code
    app.get("/coupons/validate", async (req, res) => {
      try {
        const { code } = req.query;
        if (!code) {
          return res
            .status(400)
            .json({ success: false, message: "Coupon code required" });
        }

        const coupon = await couponsCollection.findOne({
          code: code.toUpperCase(),
          isActive: true,
          $or: [
            { expiresAt: { $exists: false } }, // no expiry = lifetime
            { expiresAt: { $gt: new Date() } }, // not expired yet
          ],
        });

        if (!coupon) {
          return res
            .status(404)
            .json({ success: false, message: "Invalid coupon" });
        }

        res.status(200).json({
          success: true,
          discount: coupon.discount,
          type: coupon.type,
          code: coupon.code,
        });
      } catch (error) {
        console.error("Coupon validation error:", error);
        res.status(500).json({ success: false, message: "Server error" });
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

    // all user get
    app.get("/users", async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        res.json(users);
      } catch (err) {
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch users" });
      }
    });

    // get members
    app.get("/members", async (req, res) => {
      try {
        const { name } = req.query;
        let query = {
          userRole: "member",
        };

        if (name) {
          query.name = { $regex: name, $options: "i" };
        }

        const users = await userCollection.find(query).toArray();

        res.send(users);

        // const bookingEmails = await userCollection.distinct(
        //   "userEmail",
        //   { status: "approved" }
        // );

        // const query = { email: { $in: bookingEmails } };
        // if (name) {
        //   query.name = { $regex: name, $options: "i" }; // case-insensitive search
        // }

        // const members = await usersCollection.find(query).toArray();
        // res.json(members);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch members." });
      }
    });

    // POST new court
    app.post("/create/courts", async (req, res) => {
      try {
        const court = req.body;

        // Validate required fields
        if (
          !court.name ||
          !court.type ||
          !court.image ||
          !court.price ||
          !court.slots
        ) {
          return res
            .status(400)
            .json({ success: false, message: "Missing required fields" });
        }

        // Ensure slots is an array
        if (!Array.isArray(court.slots)) {
          return res
            .status(400)
            .json({ success: false, message: "Slots must be an array" });
        }

        // Set createdAt
        court.createdAt = new Date();

        const result = await CourtCollection.insertOne(court);

        if (result.insertedId) {
          res.json({ success: true, insertedId: result.insertedId });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Failed to insert court" });
        }
      } catch (error) {
        console.error("Error inserting court:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    app.post("/coupons", async (req, res) => {
      const { code, name, discount } = req.body;

      if (!code || !name || typeof discount !== "number") {
        return res.status(400).json({
          success: false,
          message: "Code, name, and discount are required.",
        });
      }

      const newCoupon = {
        code,
        name,
        discount,
        createdAt: new Date(),
      };

      try {
        const result = await couponsCollection.insertOne(newCoupon);
        res.status(201).json({
          success: true,
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error adding coupon:", error.message);
        res.status(500).json({
          success: false,
          message: "Failed to add coupon",
        });
      }
    });

    // Update court by ID and set update timestamp
    app.patch("/update/courts/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid court ID" });
        }

        const updatedCourt = {
          ...req.body,
          updatedAt: new Date().toISOString(),
        };

        const result = await CourtCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedCourt }
        );

        if (result.modifiedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Court not found or data unchanged",
          });
        }

        res.json({
          success: true,
          message: "Court updated successfully",
          result,
        });
      } catch (error) {
        console.error("Error updating court:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to update court" });
      }
    });

    // DELETE court
    // Delete court by ID
    app.delete("/courts/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await courtsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
        console.error("Error deleting court:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to delete court" });
      }
    });

    // DELETE /users/:id
    app.delete("/users/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await userCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send({ success: result.deletedCount === 1 });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, error: "Failed to delete user" });
      }
    });

    // pending data get by email
    app.get("/bookings", async (req, res) => {
      try {
        const { email, status } = req.query;
        const query = {};

        if (email) {
          query.userEmail = email;
          query.status = "pending"; // Only user's pending bookings
        } else if (status) {
          query.status = status; // For admin filtering like "pending", "approved", etc.
        } else {
          return res
            .status(400)
            .json({ success: false, message: "Email or status is required" });
        }

        const bookings = await CourtsBookingCollection.find(query).toArray();
        res.send(bookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch bookings" });
      }
    });

    // payment info save
    app.post("/payments/save", async (req, res) => {
      try {
        const paymentData = req.body;
        paymentData.paidAt = new Date();

        // Save to payments collection
        const result = await paymentsCollection.insertOne(paymentData);

        // Optional: update booking status to "confirmed"
        await CourtsBookingCollection.updateOne(
          { _id: new ObjectId(paymentData.bookingId) },
          { $set: { status: "confirmed" } }
        );

        res.send({ success: true, message: "Payment recorded", result });
      } catch (error) {
        console.error("Error saving payment:", error);
        res
          .status(500)
          .send({ success: false, message: "Payment save failed" });
      }
    });

    // payment status approved
    app.get("/approved", async (req, res) => {
      try {
        const { email, status } = req.query;
        const query = {};

        if (email) {
          query.userEmail = email;
          query.status = "approved"; // Only user's approved bookings
        } else if (status) {
          query.status = status; // For admin filtering like "pending", "approved", etc.
        } else {
          return res
            .status(400)
            .json({ success: false, message: "Email or status is required" });
        }

        const bookings = await CourtsBookingCollection.find(query).toArray();
        res.send(bookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch bookings" });
      }
    });

    //  confirmed
    app.get("/booking/confirmed", async (req, res) => {
      try {
        const { email } = req.query;

        if (!email) {
          return res.status(400).json({
            success: false,
            message: "Email is required",
          });
        }

        const confirmedBookings = await CourtsBookingCollection.find({
          userEmail: email,
          status: "confirmed",
        }).toArray();

        res.status(200).json({
          success: true,
          bookings: confirmedBookings,
        });
      } catch (error) {
        console.error("Error fetching confirmed bookings:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch confirmed bookings",
        });
      }
    });

    app.get("/admin/confirmed/bookings", async (req, res) => {
      try {
        const confirmedBookings = await CourtsBookingCollection.find({
          status: "confirmed",
        }).toArray();

        res.status(200).json({
          success: true,
          bookings: confirmedBookings,
        });
      } catch (error) {
        console.error("Error fetching confirmed bookings:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch confirmed bookings",
        });
      }
    });

    // payment get way
    app.post("/payments/create-payment-intent", async (req, res) => {
      const { totalPrice } = req.body;
      const amount = totalPrice * 100;

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (err) {
        console.error("Stripe Error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    // all booking data save db
    app.post("/bookings", async (req, res) => {
      try {
        const booking = req.body;
        console.log("Received booking:", booking);

        // Validate required fields
        const requiredFields = [
          "courtId",
          "name",
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
          name: booking.name,
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

    // user booking status will be approved and userRole will be member
    app.put("/bookings/approve/:id", async (req, res) => {
      try {
        const bookingId = req.params.id;

        // 1. Update booking status to "approved"
        const bookingResult = await CourtsBookingCollection.updateOne(
          { _id: new ObjectId(bookingId) },
          { $set: { status: "approved" } }
        );

        if (bookingResult.modifiedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Booking not found or already approved",
          });
        }

        // 2. Find booking to get user email
        const booking = await CourtsBookingCollection.findOne({
          _id: new ObjectId(bookingId),
        });

        // 3. Promote user to "member" and set membershipDate if still "user"
        if (booking?.userEmail) {
          await userCollection.updateOne(
            { email: booking.userEmail, userRole: "user" },
            {
              $set: {
                membershipDate: new Date(),
                userRole: "member",
              },
            }
          );
        }

        res.status(200).json({
          success: true,
          message:
            "Booking approved and user promoted to member with membership time",
        });
      } catch (error) {
        console.error("Error approving booking:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    // booking confirm status updated api
    app.patch("/bookings/confirm/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { transactionId } = req.body;

        const result = await CourtsBookingCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "confirmed",
              transactionId,
              paidAt: new Date(),
            },
          }
        );

        if (result.modifiedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Booking not found or already confirmed",
          });
        }

        res.send({ success: true, message: "Booking confirmed" });
      } catch (error) {
        console.error("Error confirming booking:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    // bookings delete
    app.delete("/bookings/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await CourtsBookingCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount > 0) {
          return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
          });
        } else {
          return res.status(404).json({
            success: false,
            message: "Booking not found",
          });
        }
      } catch (error) {
        console.error("Error deleting booking:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to delete booking",
        });
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
