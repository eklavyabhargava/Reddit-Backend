const express = require("express");
const cors = require("cors");
const connectDb = require("./db");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const app = express();

const PORT = process.env.PORT;

connectDb();

require("./models/User.js");
require("./models/Post.js");

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    methods: "GET, POST, PUT, DELETE",
    optionSuccessStatus: 200,
    credentials: true,
  })
);
app.use(express.json());

// configure session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URL,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: false, // should be set to true when pushed on production
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
    },
  })
);

app.use("/api/auth", require("./routes/auth.routes.js"));
app.use("/api/post", require("./routes/post.routes.js"));
app.get("/api/check-auth", (req, res) => {
  if (req.session && req.session.user) {
    res.status(200).json({ isAuthenticated: true, user: req.session.user });
  } else {
    res.status(401).json({ isAuthenticated: false });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on PORT: ${PORT}`);
});
