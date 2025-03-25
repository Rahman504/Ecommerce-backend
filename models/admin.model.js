const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
    fname: {type: String, required: true},
    lname: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    reg_date: {type: Date, default: Date.now()},
})

module.exports = mongoose.model("Admin", AdminSchema)