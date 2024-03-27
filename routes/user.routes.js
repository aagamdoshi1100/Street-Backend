const express = require("express");
const mongoose = require("mongoose");
const { Cart } = require("../models/cart.model");
const { Product } = require("../models/product.model");
const { User } = require("../models/user.model");

const userRouter = express.Router();

async function populateIds(array) {
  const populatedArray = await Promise.all(
    array.map(async (obj) => {
      const product = await Product.findById(obj._id);
      return { ...product._doc, qtyOfsameProductInCart: obj._doc.qty };
    })
  );

  return populatedArray;
}

userRouter.post("/:userId/cart", async (req, res) => {
  try {
    const { productId } = req.body;
    console.log(productId, "pid");
    const userExists = await User.findById(req.params.userId);
    const productExists = await Product.findById(productId);

    if (!userExists || !productExists) {
      return res.status(404).json({ error: "User or product not found" });
    }

    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      const firstProduct = {
        _id: new mongoose.Types.ObjectId(productId.toString()),
        qty: 1,
      };
      await Cart.create({
        userId: req.params.userId,
        cartProducts: [firstProduct],
      });
    } else {
      console.log(cart.cartProducts, "cp");
      const findExistingProductIndex = cart.cartProducts.findIndex(
        (product) => product._id.toString() === productId.toString()
      );
      console.log(findExistingProductIndex, "fs");
      if (findExistingProductIndex !== -1) {
        cart.cartProducts[findExistingProductIndex].qty += 1;
      } else {
        cart.cartProducts.push(productId);
      }
      await cart.save();
      cart = await populateIds(cart.cartProducts);
    }
    return res
      .status(200)
      .json({ message: "Product added to cart successfully", cart });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

userRouter.get("/:userId/cart", async (req, res) => {
  try {
    const userExists = await User.findById(req.params.userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      res.status(404).json({ message: "No products in cart", cart: [] });
    } else {
      cart = await populateIds(cart.cartProducts);
      return res
        .status(200)
        .json({ message: "Cart products fetched successfully", cart });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

userRouter.patch("/:userId/cart", async (req, res) => {
  try {
    const userExists = await User.findById(req.params.userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      res.status(404).json({ message: "No products in cart", cart: [] });
    } else {
      if (req.body.action === "REMOVE") {
        cart.cartProducts = cart.cartProducts.filter(
          (product) => product._id.toString() !== req.body._id.toString()
        );
      } else if (req.body.action === "INCREMENT") {
        cart.cartProducts.map((product) => {
          if (product._id.toString() === req.body._id.toString()) {
            product.qty += 1;
          }
        });
      } else {
        cart.cartProducts.map((product) => {
          if (product._id.toString() === req.body._id.toString()) {
            product.qty -= 1;
          }
        });
      }
      await cart.save();
      return res.status(200).json({
        message: "Product cart modified successfully",
        cart: cart.cartProducts,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = userRouter;
