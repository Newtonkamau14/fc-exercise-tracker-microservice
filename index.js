const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

//db connection
mongoose.connect("mongodb://localhost/exercise-tracker", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//Schema and models
const userSchema = new mongoose.Schema({
  username: String,
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: String,
  duration: Number,
  date: String,
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

//serve static files
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//endpoints
app.post("/api/users", async (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username });
  await newUser.save();
  res.json({ username: newUser.username, _id: newUser._id });
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  const user = await User.findById(_id);
  const newExercise = new Exercise({
    userId: _id,
    description,
    duration,
    date: date ? new Date(date).toDateString() : new Date().toDateString(),
  });
  await newExercise.save();
  res.json({
    username: user.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: newExercise.date,
    _id: user._id,
  });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  const user = await User.findById(_id);
  let logs = await Exercise.find({ userId: _id });
  if (from) {
    logs = logs.filter((log) => new Date(log.date) >= new Date(from));
  }
  if (to) {
    logs = logs.filter((log) => new Date(log.date) <= new Date(to));
  }
  if (limit) {
    logs = logs.slice(0, limit);
  }
  res.json({
    username: user.username,
    count: logs.length,
    _id: user._id,
    log: logs.map((log) => ({
      description: log.description,
      duration: log.duration,
      date: log.date,
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
