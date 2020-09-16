const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 3000;
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

const Score = mongoose.model("Score", { name: String, points: Number });

app.get("/", (req, res) => {
  Score.find({})
    .sort({ score: -1 })
    .exec((err, docs) => {
      if (err) {
        return res.status(500).send([]);
      }
      res.status(200).send(docs);
    });
});

app.post("/", async (req, res) => {
  const { name, points } = req.body;
  const newScore = new Score({ name, points });

  await newScore.save();
  Score.find({})
    .sort({ score: -1 })
    .exec((err, docs) => {
      if (err) {
        return res.status(500).send([]);
      }

      res.status(200).send(docs);
    });
});

app.listen(process.env.PORT || port, () => {
  console.log("started");
});
