const mongoose = require("mongoose");

const addSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    addresses: [
      {
        address: String,
        city: String,
        state: String,
        postalcode: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Address = mongoose.model("Address", addSchema);
module.exports = { Address };
