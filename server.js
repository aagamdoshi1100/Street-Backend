const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const connection = require("./database/connection");
app.use(cors());

app.listen(3000, () => {
  console.log("listening on *:3000");
});

app.get("/", (req, res) => {
  res.send("Success");
});

app.use(express.json());
const authRouter = require("./routes/auth.routes");
const productRouter = require("./routes/product.routes");
const userRouter = require("./routes/user.routes");
app.use("/", authRouter);
app.use("/products", productRouter);
app.use("/users", userRouter);

connection();
