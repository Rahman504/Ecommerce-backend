const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: {type: "String", required: true, minLength: 3},
    description: {type: "String", required: true, maxLength: 10000},
    price: {type: Number},
    discount: {type: Number, default: 0},
    discountedPrice: {type: Number},
    imageUrl: {type: [String], required: true},
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }
}, {timestamps: true})


ProductSchema.pre('save', function (next) {
    this.discountedPrice = this.price - (this.price * this.discount) / 100;
    next();
});

const ProductModel = mongoose.model("Product", ProductSchema);
module.exports = ProductModel