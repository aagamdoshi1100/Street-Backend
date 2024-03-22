const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    Name: String,
    Public_Id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    Price: Number,
    Rating: Number,
    Quantity: Number,
    Discount: Number,
    Category: String,
    Return_Policy: Boolean,
    About: String,
  },
  {
    timestamp: true,
  }
);

const Product = mongoose.model("Product", productSchema);
module.exports = { Product };
