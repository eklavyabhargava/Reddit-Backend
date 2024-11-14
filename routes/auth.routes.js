const express = require("express");
const { registerUser, loginUser } = require("../controller/AuthController");
const router = express.Router();

// API to register new user
router.post("/register", async (req, res) => {
  await registerUser(req, res);
});

// API to authenticate and handle user login
router.post("/login", async (req, res) => {
  await loginUser(req, res);
});

// API to logout user
router.post("/logout", async (req, res) => {
  req.session.destroy();
  res.send({ isSuccess: true });
});

module.exports = router;
