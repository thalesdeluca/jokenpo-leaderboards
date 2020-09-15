const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

app.use(bodyParser.json()); // for parsing application/json

mongoose.connect(
  "mongodb+srv://owlp-api:HjVabntCY44RwBnw@jokenpo-db.xs3zb.gcp.mongodb.net/jokenpo-db?retryWrites=true&w=majority",
  { useNewUrlParser: true }
);

const Score = mongoose.model("Score", { name: String, points: Number });

app.get("/", (req, res) => {
  Score.find({})
    .sort("-score")
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
    .sort("-score")
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
