const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3000;
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

const Score = mongoose.model("Score", {
  name: String,
  points: Number,
  game: String,
  user_id: mongoose.Types.ObjectId
});

const User = mongoose.model("User", {
  name: String,
  email: String,
  password: String
});

const Chat = mongoose.model("Chat", {
  users: Array
});

const Message = mongoose.model("Message", {
  text: String,
  user_id: mongoose.Types.ObjectId
});

const AuthGuard = (req, res, next) => {
  const token = String(req.headers.authorization);

  if (!token.includes("Bearer")) {
    return res.status(401).json({ message: "Token was not provided" })
  }


  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (!err) {
      return res.status(401).json({ message: "Token was invalid" })
    }

    const user = await User.findById(decoded.id).exec();
    req.user = user;
  })

  next();
}

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.find({ email: email }).exec();

    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return response.status(401).json({ message: "Passwords do not match" })
    }

    const token = jwt.sign({ id: user.id });

    return response.status(200).json({ token })

  } catch (err) {
    return response.status(500).json(err)
  }
})

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const passwordEncrypted = bcrypt.hash(password, 10);

    const user = new User({ name, email, password: passwordEncrypted });

    user.save()

    const token = jwt.sign({ id: user.id });

    return response.status(200).json({ token })

  } catch (err) {
    return response.status(500).json(err)
  }
})


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

app.post("/score", AuthGuard, async (req, res) => {
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

app.post("/chat", AuthGuard, async (req, res) => {

})

app.get("/chat/:id", AuthGuard, async (req, res) => {

})

app.listen(process.env.PORT || port, () => {
  console.log("started");
});
