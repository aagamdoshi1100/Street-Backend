const express = require("express");
const mongoose = require("mongoose");
const { Cart } = require("../models/cart.model");
const { Product } = require("../models/product.model");
const { User } = require("../models/user.model");
const { Wishlist } = require("../models/wishlist.model");
const { Address } = require("../models/addresses.model");
const { tokenVerify } = require("../middlewares/middlewares");
const { Order } = require("../models/placeOrder.model");

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

const populateWishlists = async (array) => {
  const populatedArray = await Promise.all(
    array.map(async (obj) => {
      const product = await Product.findById(obj._id);
      return { ...product._doc };
    })
  );

  return populatedArray;
};

userRouter.post("/:userId/cart", tokenVerify, async (req, res) => {
  try {
    const { productId } = req.body;
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
      const findExistingProductIndex = cart.cartProducts.findIndex(
        (product) => product._id.toString() === productId.toString()
      );
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

userRouter.get("/:userId/cart", tokenVerify, async (req, res) => {
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

userRouter.patch("/:userId/cart", tokenVerify, async (req, res) => {
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

userRouter.patch(
  "/:userId/cart/:productId/moveToWishlist",
  tokenVerify,
  async (req, res) => {
    try {
      const fetchWishList = await Wishlist.findOne({
        userId: req.params.userId,
      });
      const fetchCartList = await Cart.findOne({
        userId: req.params.userId,
      });
      const checkIfProductAlreadyExistInWishlist =
        fetchWishList.wishlistProducts.find(
          (pro) => pro.toString() === req.params.productId.toString()
        );
      if (!checkIfProductAlreadyExistInWishlist) {
        fetchWishList.wishlistProducts.push(
          new mongoose.Types.ObjectId(req.params.productId.toString())
        );
      }
      const removeFromCart = fetchCartList.cartProducts.filter(
        (pro) => pro._id.toString() !== req.params.productId.toString()
      );
      fetchCartList.cartProducts = removeFromCart;
      await fetchWishList.save();
      await fetchCartList.save();
      res.status(200).json({ message: "Product moved to wishlist" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

userRouter.post("/:userId/wishlist", tokenVerify, async (req, res) => {
  try {
    const isWishListDocExist = await Wishlist.findOne({
      userId: req.params.userId,
    });
    if (!isWishListDocExist) {
      const firstWishList = {
        userId: req.params.userId,
        wishlistProducts: [
          new mongoose.Types.ObjectId(req.body.productId.toString()),
        ],
      };
      const createWishListDoc = await Wishlist.create(firstWishList);
      res.status(201).json({ message: "Wishlist created" });
    } else {
      if (
        isWishListDocExist.wishlistProducts.find(
          (pro) => pro.toString() === req.body.productId.toString()
        )
      ) {
        isWishListDocExist.wishlistProducts =
          isWishListDocExist.wishlistProducts.filter(
            (pro) => pro.toString() !== req.body.productId.toString()
          );
        await isWishListDocExist.save();
        res.status(200).json({ message: "Wishlist removed" });
      } else {
        isWishListDocExist.wishlistProducts.push(
          new mongoose.Types.ObjectId(req.body.productId.toString())
        );
        await isWishListDocExist.save();
        res.status(200).json({ message: "Wishlist added" });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

userRouter.get("/:userId/wishlist", tokenVerify, async (req, res) => {
  try {
    const fetchWishList = await Wishlist.findOne({
      userId: req.params.userId,
    });
    if (!fetchWishList) {
      const createDoc = {
        userId: req.params.userId,
        wishlistProducts: [],
      };
      const createWishListDoc = await Wishlist.create(createDoc);
      res.status(201).json({ message: "Wishlist created", wishlists: [] });
    } else {
      const wishlists = await populateWishlists(fetchWishList.wishlistProducts);
      res.status(200).json({ wishlists });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

userRouter.patch(
  "/:userId/wishlist/:productId/moveToCart",
  tokenVerify,
  async (req, res) => {
    try {
      const fetchWishList = await Wishlist.findOne({
        userId: req.params.userId,
      });
      const fetchCartList = await Cart.findOne({
        userId: req.params.userId,
      });
      fetchWishList.wishlistProducts = fetchWishList.wishlistProducts.filter(
        (pro) => pro.toString() !== req.params.productId.toString()
      );
      const checkIfProductAlreadyExistInCart = fetchCartList.cartProducts.find(
        (pro) => pro._id.toString() === req.params.productId.toString()
      );
      console.log(fetchCartList, checkIfProductAlreadyExistInCart, "ck");
      if (checkIfProductAlreadyExistInCart) {
        checkIfProductAlreadyExistInCart.qty += 1;
      } else {
        fetchCartList.cartProducts.push(
          new mongoose.Types.ObjectId(req.params.productId.toString())
        );
      }
      await fetchWishList.save();
      await fetchCartList.save();
      res.status(200).json({ message: "Product moved to cart" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

userRouter.get("/:userId/cartAndWishlistIds", tokenVerify, async (req, res) => {
  try {
    const fetchWishList = await Wishlist.findOne({
      userId: req.params.userId,
    });
    const fetchCartList = await Cart.findOne({
      userId: req.params.userId,
    });
    res.status(200).json({
      cartIds: fetchCartList?.cartProducts || [],
      wishlistIds: fetchWishList?.wishlistProducts || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

userRouter.put("/:userId/profile", tokenVerify, async (req, res) => {
  try {
    const response = await User.findByIdAndUpdate(
      req.params.userId,
      req.body.details,
      { new: true }
    );
    const {
      _doc: { password, ...propertiesWOPass },
    } = response;
    res.json({
      message: "User details updated successfully",
      data: propertiesWOPass,
    });
  } catch (err) {
    console.error(err);
  }
});

userRouter.get("/:userId/addresses", tokenVerify, async (req, res) => {
  try {
    const findUserAddresses = await Address.findOne({
      userId: req.params.userId,
    });
    if (findUserAddresses) {
      res.status(200).json({ addresses: findUserAddresses.addresses });
    } else {
      res.status(200).json({ addresses: [] });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
});

userRouter.post("/:userId/addresses", tokenVerify, async (req, res) => {
  try {
    let findUserAddresses = await Address.findOne({
      userId: req.params.userId,
    });
    if (!findUserAddresses) {
      findUserAddresses = new Address({
        userId: req.params.userId,
        Addresses: [req.body],
      });
    } else {
      findUserAddresses.addresses.push(req.body);
    }
    const saveData = await findUserAddresses.save();
    res.status(201).json({
      message: "Address added successfully",
      data: saveData.addresses[saveData.addresses.length - 1],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
});

userRouter.post("/:userId/orders", tokenVerify, async (req, res) => {
  try {
    let findCart = await Cart.findOne({
      userId: req.params.userId,
    });
    if (findCart) {
      findCart.cartProducts = [];
      await findCart.save();
    }
    let placeOrder = await Order.findOne({
      userId: req.params.userId,
    });
    if (!placeOrder) {
      placeOrder = new Order({
        userId: req.params.userId,
        orders: req.body.data,
      });
    } else {
      placeOrder.orders = [...placeOrder.orders, ...req.body.data];
    }
    await placeOrder.save();
    res.status(201).json({
      message: "Order placed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
});

userRouter.get("/:userId/orders", tokenVerify, async (req, res) => {
  try {
    let fetchOrder = await Order.findOne({
      userId: req.params.userId,
    });
    if (!fetchOrder) {
      fetchOrder = new Order({
        userId: req.params.userId,
        orders: [],
      });
      await placeOrder.save();
    }
    const orders = await populateWishlists(fetchOrder.orders);
    res.status(201).json({
      message: "Order fetched successfully",
      data: orders ?? [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: err.message });
  }
});

module.exports = userRouter;
