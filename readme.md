# Elite Sports Club - Backend

This is the backend server for the **Elite Sports Club** platform, built with **Node.js**, **Express.js**, and **MongoDB**. It provides a RESTful API to handle authentication, court bookings, user roles, payments, announcements, and more.

---

## 🔧 Technologies Used

- **Node.js**
- **Express.js**
- **MongoDB + Mongoose**
- **Firebase Admin SDK (JWT auth)**
- **Stripe (Payments)**
- **dotenv**
- **CORS**
- **Cookie-parser**
- **Express Validator**

---

## 📁 Project Structure

├── controllers/        # Route handler logic <br />
├── middleware/         # Auth, error handling, etc.<br />
├── models/             # Mongoose schemas<br />
├── routes/             # Express route definitions<br />
├── utils/              # Helper functions<br />
├── .env                # Environment variables<br />
├── server.js           # Entry point of the app<br />
└── package.json        # Project metadata and scripts

---

## ⚙️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/Programming-Hero-Web-Course4/b11a12-server-side-rkzahidhassandipu.git
cd b11a12-server-side-rkzahidhassandipu

```
2. Install dependencies

npm install

3. Create .env file

PORT=5000
MONGODB_URI=your_mongodb_uri
FIREBASE_PROJECT_ID=your_project_id
STRIPE_SECRET_KEY=your_stripe_secret
JWT_SECRET=your_jwt_secret

4. Start the server

npm run start
# or for development
npm run dev

Server should now be running at:
http://localhost:5000


🔐 Authentication

    JWT-based authentication using Firebase Admin SDK

    Token sent via HTTP-only cookie

🔑 Main API Endpoints
Method	Endpoint	Description
POST	/auth/login	User login/authentication
GET	/users/me	Get logged-in user data
POST	/courts	Add new court (admin)
GET	/courts	Get all courts
POST	/bookings	Book a court
GET	/bookings	Get user bookings
PATCH	/bookings/:id/approve	Approve booking (admin)
POST	/create-payment-intent	Stripe Payment Intent
GET	/announcements	Get all announcements


🛡️ Middleware

    verifyToken – Authenticates user from cookie-based JWT

    verifyAdmin – Authorizes only admin users

🧪 Tools & Libraries

    cors – Handle cross-origin requests

    cookie-parser – Parse cookies from headers

    dotenv – Load env variables

    stripe – Payment integration

📄 License

This project is part of the Programming Hero Web Development Course. Educational use only.


## 👨‍💻 Author

## 👨‍💻 Author

**Raihan Uddin (RK Zahid Hassan Dipu)**  
📧 Email: [rkrazzakhan01731@gmail.com](mailto:rkrazzakhan01731@gmail.com)  
🌐 [Portfolio](https://meek-meerkat-1edcac.netlify.app)  
🔗 [GitHub](https://github.com/rkzahidhassandipu)  
📹 [YouTube](https://www.youtube.com/@WebCodeTutorials-)




Let me know if you want a separate `README.md` for your **client side** too!


