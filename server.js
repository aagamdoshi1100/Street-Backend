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
connection();
