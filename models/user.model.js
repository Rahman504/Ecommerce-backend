const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    firstName: {type: String, required: true, minLength: 3},
    lastName: {type: String, required: true, minLength: 3},
    email: {type: String, required: true},
    password: {type: String, required: true},
}, {timestamps: true})

const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;