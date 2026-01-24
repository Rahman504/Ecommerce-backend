const Product = require("../models/product.model");
const Review = require("../models/review.model");

const createProduct = async (req, res) => {
    try {
        const { 
            name, 
            price, 
            discount, 
            description, 
            imageUrl1, 
            imageUrl2, 
            imageUrl3, 
            imageUrl4,
            countInStock 
        } = req.body;
        
        const adminId = req.adminId;

        if (!adminId) {
            return res.status(403).json({ message: "Unauthorized. Please log in as admin." });
        }

        if (!name || !price || !description || !imageUrl1 || countInStock === undefined) {
            return res.status(400).json({ message: "A required field is missing" });
        } else if (name.length < 3) {
            return res.status(400).json({ message: "Product name must be at least 3 characters long" });
        } else if (description.length > 100000) {
            return res.status(400).json({ message: "Description is too long" });
        }

        const productData = {
            name,
            price: Number(price),
            discount: Number(discount || 0),
            description,
            imageUrl: [imageUrl1, imageUrl2, imageUrl3, imageUrl4].filter(img => img),
            countInStock: Number(countInStock),
            adminId,
        };

        const product = await Product.create(productData);
        res.status(201).json({ message: "Product created successfully", productId: product._id });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAdminProducts = async (req, res) => {
    try {
        const products = await Product.find({ adminId: req.adminId });
        if (!products.length) {
            return res.status(404).json({ message: "No products found for this admin." });
        }
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAllProducts = (req, res) => {
    Product.find({})
    .then((products) => {
        res.status(200).json({message: "Product retrieved successfully", products}); 
    })
    .catch((error) => {
        res.status(500).json({message: "Server Error", error});
    })
}

const getOneProduct = (req, res) => {
    const id = req.params.id;
    Product.findById(id)
    .then((product) => {
        if (!product) {
            return res.status(404).json({message: "Product not found"})
        }
        Review.find({product: id}, {rating: true, reviewText: true}).populate("user")
        .then((reviews) => {
            res.status(200).json({message: "Product retrieved.", product, reviews})
        })
        .catch((error) => {
            res.status(200).json({message: "Product retrieved. Unable to retrieve product reviews", product, reviews: []})
        })
    })
    .catch((error) => {
        res.status(500).json({message: "Server error", error});
    })
}

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.name = req.body.name;
        product.description = req.body.description;
        product.price = Number(req.body.price);
        product.discount = Number(req.body.discount);
        product.imageUrl = req.body.imageUrl;
        product.countInStock = Number(req.body.countInStock);

        const updatedProduct = await product.save();

        res.status(200).json({
            message: "Product updated successfully!",
            product: updatedProduct
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const deleteProduct = (req, res) => {
    const id = req.params.id;
    Product.findByIdAndDelete(id)
    .then(() => {
        res.status(200).json({message: "Product deleted successfully"})
    })
    .catch((error) => {
        res.status(500).json({message: "Server error", error})
    })
}

const addReview = (req, res) => {
    const productId = req.params.id;
    const userId = req.session.userId;
    const reviewObj = {
        rating: req.body.rating,
        reviewText: req.body.review,
        user: userId,
        product: productId
    } 

    Review.create(reviewObj)
    .then(() => {
        res.status(201).json({message: "Review added successfully!"})
    })
    .catch((error) => {
        res.status(500).json({message: "Error adding review, retry.", error})
    })
}

module.exports = {
    createProduct,
    getAllProducts,
    getOneProduct,
    updateProduct,
    deleteProduct,
    addReview,
    getAdminProducts
}