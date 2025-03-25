const bcrypt = require("bcryptjs");
const Admin = require("../models/admin.model");
const jwt = require("jsonwebtoken");




const addAdmin = async (req, res) => {
        const { firstName, lastName, email, password } = req.body;
    if (req.body.secret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ message: "Unauthorized access" });
    }
    try {

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            return res.status(400).json({ message: "Admin with this email already exists." });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const adminData = {
            fname: firstName,   
            lname: lastName,    
            email,
            password: hashPassword,
        };

        const newAdmin = await Admin.create(adminData);

        res.status(201).json({ message: "Admin account created successfully!", admin: newAdmin });
    } catch (error) {
        res.status(500).json({ message: error.message || "An error occurred during signup." });
    }
};




const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const admin = await Admin.findOne({ email });

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: admin._id, role: "admin" },
            process.env.ADMIN_SECRET, 
            { expiresIn: "12h" } 
        );

        res.status(200).json({ message: "Login successful", token,  adminId: admin._id });
    } catch (error) {
        res.status(500).json({ message: error.message || "Login failed. Try again." });
    }
};

const profilePage = async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId); 

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.json({ admin });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
  


module.exports = {
    addAdmin,
    adminLogin,
    profilePage
};
