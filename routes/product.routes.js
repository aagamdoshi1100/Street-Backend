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
    console.error(err);
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
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

productRouter.get("/search/:searchValue", async (req, res) => {
  try {
    const getProducts = await Product.find({
      Name: { $regex: new RegExp(req.params.searchValue, "i") },
    });
    res.status(200).json({
      data: getProducts,
    });
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = productRouter;
