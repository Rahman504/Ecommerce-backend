require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const flash = require("connect-flash");



mongoose.connect(process.env.DB_URL)
.then(() => {
    console.log("Database connected successfully");
})
.catch((error) => {
    console.log("Error connecting to database", error.message);
    
})
const corsConfig = {
    origin: process.env.FRONTEND_URL || "https://city-shop-ecommerce.vercel.app",
    credentials: true,
    allowHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "X-Access-Token",
      "Authorization",
      "Access-Control-Allow-Origin",
      "access-control-allow-Origin"
    ]
  }
  app.use(cors(corsConfig));

app.use(session({secret: "Citystore", resave: true, saveUninitialized: false}))
app.use(bodyParser.json());
app.use(flash());

const cartRoutes = require("./routes/cart.routes");
const {createProduct, getAllProducts, getOneProduct, updateProduct, deleteProduct, addReview, getAdminProducts} = require("./controllers/product.controller");
const { register, login } = require("./controllers/user.controller");
const userAuth = require("./middleware/user.middleware");
const { addAdmin, adminLogin, profilePage} = require("./controllers/admin.controller");
const adminAuth = require("./middleware/admin")
const Cart = require("./models/cart.model"); 

app.get("/", (req, res) => {
    res.json({message: "Hello World"});
})

app.use("/api/cart", cartRoutes); 
app.post("/api/products", adminAuth, createProduct)
app.get("/api/products", getAllProducts)
app.get("/api/admin/products", adminAuth, getAdminProducts)
app.get("/api/products/:id", getOneProduct)
app.put("/api/products/:id", updateProduct)
app.delete("/api/products/:id", deleteProduct)
app.post("/api/products/:id/reviews", userAuth, addReview);

app.post("/api/users", register);
app.post("/api/users/login", login);
app.post("/api/admin/signup", addAdmin);
app.post("/api/admin/login", adminLogin);
app.get("/api/admin/profile", adminAuth, profilePage);

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log("App is running on port", PORT);
})