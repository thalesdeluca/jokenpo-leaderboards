const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { response } = require("express");
const app = express();
const port = 3000;
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

const Score = mongoose.model("Score", {
  points: Number,
  game: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const User = mongoose.model("User", {
  name: String,
  email: String,
  password: String,
});

const Message = mongoose.model("Message", {
  text: String,
  created_at: mongoose.Schema.Types.Date,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const AuthGuard = async (req, res, next) => {
  const token = String(req.headers.authorization);

  if (!token.includes("Bearer")) {
    return res.status(401).json({ message: "Token was not provided" });
  }
  const tokenClear = token.replace("Bearer ", "");
  console.log(tokenClear);
  const decoded = jwt.verify(tokenClear, process.env.SECRET);

  if (!decoded) {
    return res.status(401).json({ message: "Token was invalid" });
  }

  console.log("user", decoded);
  const user = await User.findById(decoded.id).exec();
  console.log("user", user);
  req.user = user;

  next();
};

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email }).exec();
    console.log(password, user.passwor, user);
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Passwords do not match" });
    }

    const token = jwt.sign({ id: user.id }, process.env.SECRET);

    return res.status(200).json({ token });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.code });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userCheck = await User.exists({ email: email });

    if (userCheck) {
      return res.status(403).json({ message: "Already exists" });
    }

    const passwordEncrypted = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: passwordEncrypted });

    await user.save();

    const token = jwt.sign({ id: user.id }, process.env.SECRET);

    return res.status(200).json({ token });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

app.get("/score/:game", (req, res) => {
  const params = req.params;
  Score.find(oarams)
    .sort("-score")
    .populate("user", "name")
    .exec((err, docs) => {
      if (err) {
        return res.status(500).send([]);
      }
      res.status(200).send(docs);
    });
});

app.post("/score", AuthGuard, async (req, res) => {
  const { points, game } = req.body;
  const newScore = new Score({ points, game, user: req.user.id });

  await newScore.save();
  Score.find({ game })
    .sort("-score")
    .populate("user", "name")
    .exec((err, docs) => {
      if (err) {
        return res.status(500).send([]);
      }

      res.status(200).send(docs);
    });
});

app.post("/chat", AuthGuard, async (req, res) => {
  try {
    const { message } = req.body;
    const text = new Message({
      text: message,
      date: new Date(),
      user: req.user.id,
    });

    await text.save();

    return res.status(200).json({ sent: true });
  } catch (err) {
    return res.status(500).json({ sent: false });
  }
});

app.get("/chat", async (req, res) => {
  Message.find({})
    .sort("-date")
    .populate("user", "name")
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
