
const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    product: {type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true},
    rating: {type: Number, required: true},
    reviewText: {type: String, required: true}
}, {timestamps: true})

const ReviewModel = mongoose.model("Review", ReviewSchema);
module.exports = ReviewModel;