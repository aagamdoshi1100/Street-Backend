const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { User } = require("../models/user.model");
const {
  isAccountExist,
  accountNotExist,
} = require("../middlewares/middlewares");

const JWT_SECRET = process.env.SECRET;

const authRouter = express.Router();

authRouter.post("/login", accountNotExist, async (req, res) => {
  const { email, password } = req.body;
  try {
    const loginResponse = await User.findOne({ email });
    const decoded = await bcrypt.compare(password, loginResponse.password);
    if (loginResponse.email === email && decoded) {
      const userId = loginResponse._id;
      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" });
      const {
        _doc: { password, ...propertiesWOPass },
      } = loginResponse;
      res.status(200).json({
        loggedInUser: propertiesWOPass,
        message: "Login success",
        token,
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

authRouter.post("/signup", isAccountExist, async (req, res) => {
  const { email, firstname, lastname, country, address } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const signUpResponse = await User.create({
      email,
      password: hashedPassword,
      firstname,
      lastname,
      profilePictureURL: "",
      country,
      address,
    });
    const token = jwt.sign({ userId: signUpResponse._id }, JWT_SECRET);
    const {
      _doc: { password, ...propertiesWOPass },
    } = signUpResponse;
    res.status(201).json({
      message: "New user created",
      data: { createdUser: propertiesWOPass, token },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = authRouter;
