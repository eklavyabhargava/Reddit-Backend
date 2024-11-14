const express = require("express");
const app = express();
const verifyUser = require("../middleware/authMiddleware");
const upload = require("../middleware/handleFileUpload");
const {
  createPost,
  castVote,
  getPosts,
} = require("../controller/PostController");

// API to fetch all posts
app.get("/get-posts", async (req, res) => {
  await getPosts(req, res);
});

app.use(verifyUser);

// API to create new post
app.post("/create-post", upload.single("media"), async (req, res) => {
  await createPost(req, res);
});

// API to handle votes
app.post("/handle-vote", async (req, res) => {
  await castVote(req, res);
});

module.exports = app;
