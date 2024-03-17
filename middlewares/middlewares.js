const { User } = require("../models/user.model");

const isAccountExist = async (req, res, next) => {
  try {
    const userExist = await User.findOne({ email: req.body.email });
    if (userExist) {
      res
        .status(409)
        .json({
          message: `User ${req.body.email} already exist. Please signin`,
        });
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const accountNotExist = async (req, res, next) => {
  try {
    const userExist = await User.findOne({ email: req.body.email });
    if (!userExist) {
      return res.status(404).json({
        message: `User ${req.body.email} do not exist. Please signup`,
      });
    } else {
      next();
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { isAccountExist, accountNotExist };
