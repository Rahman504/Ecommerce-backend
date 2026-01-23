const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
require("dotenv").config();

const userAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. You need to be logged in." });
    }

    try {
        const secret = process.env.SECRET_KEY || "default_secret";
        const userData = jwt.verify(token, secret);
        if (!userData || !userData.id) {
            return res.status(401).json({ message: "Invalid token. Please log in again." });
        }

        User.findById(userData.id)
            .then((user) => {
                if (!user) {
                    return res.status(401).json({ message: "User account not found." });
                }
                req.user = { id: user._id, email: user.email }; 
                next();
            })
            .catch(() => {
                return res.status(500).json({ message: "Server error. Please try again." });
            });

    } catch (err) {
        return res.status(401).json({ message: "Invalid token signature." });
    }
};

module.exports = userAuth;
