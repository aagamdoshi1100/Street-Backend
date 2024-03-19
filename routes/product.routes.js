const express = require("express");
const { Product } = require("../models/product.model");

const productRouter = express.Router();

productRouter.get("/", async (req, res) => {
  try {
    const getAllProducts = await Product.find({});
    res.status(200).json({
      data: getAllProducts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

productRouter.get("/:productId", async (req, res) => {
  try {
    const getProductsById = await Product.find({ _id: req.params.productId });
    res.status(200).json({
      data: getProductsById,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

productRouter.post("/addProduct", async (req, res) => {
  try {
    const addProductResponse = await Product.create(req.body);
    res.status(201).json({
      message: "New product added to database",
      data: addProductResponse,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = productRouter;
