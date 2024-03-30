const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePictureURL: String,
    firstname: String,
    lastname: String,
    phone: Number,
    country: String,
    address: String,
    mobile: Number,
  },
  {
    timestamp: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = { User };
