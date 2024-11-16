const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const User = require("../models/User");

// Generate Refresh Token
function generateRefreshToken(id) {
  if (!id) return null;
  return jwt.sign({ id }, JWT_SECRET_KEY);
}

// Module Exports
module.exports = {
  generateRefreshToken,

  // Handle User Registration
  async registerUser(req, res) {
    const { username, emailId, password } = req.body;

    // Validate inputs
    if (!emailId || !username || !password) {
      return res.status(400).json({
        isSuccess: false,
        errMsg: "Mandatory fields are missing!",
      });
    }

    try {
      // Check for uniqueness of emailId and username
      const emailIdFound = await User.findOne({ emailId });
      if (emailIdFound) {
        return res.status(400).json({
          isSuccess: false,
          errorFor: "emailId",
          errMsg: "User with given email ID already exists!",
        });
      }

      const userFound = await User.findOne({ username });
      if (userFound) {
        return res.status(400).json({
          isSuccess: false,
          errorFor: "username",
          errMsg: "Username already in use, please try a different username!",
        });
      }

      // Hash password and create new user
      const hashedPassword = await bcryptjs.hash(password, 16);
      const newUser = new User({
        emailId,
        username,
        password: hashedPassword,
      });
      const userInfo = await newUser.save();
      const jwtToken = generateRefreshToken(userInfo._id);
      const { password: toExclude, ...userData } = userInfo;

      // store user data and jwt token in session
      req.session.user = userData;
      req.session.jwtToken = jwtToken;

      res.status(201).json({
        isSuccess: true,
        msg: "Account created successfully!",
        user: userData,
      });
    } catch (error) {
      console.error(error); // updated from 'err' to 'error' for consistency
      return res.status(500).json({
        isSuccess: false,
        errMsg: "Internal error occurred!",
      });
    }
  },

  // Handle User Login
  async loginUser(req, res) {
    const { usernameOrEmailId, password } = req.body;

    // Validate inputs
    if (!usernameOrEmailId || !password) {
      return res.status(400).json({
        isSuccess: false,
        errMsg: "Mandatory fields are missing!",
      });
    }

    try {
      // Find user by username or email
      const user = await User.findOne({
        $or: [{ username: usernameOrEmailId }, { emailId: usernameOrEmailId }],
      }).lean();

      if (user) {
        // Compare passwords
        const didMatch = await bcryptjs.compare(password, user.password);
        if (didMatch) {
          const jwtToken = generateRefreshToken(user._id);
          if (!jwtToken) {
            return res.status(400).json({ isSuccess: false });
          }

          const { password, ...userData } = user; // Remove password from response

          // store user data and jwt token in session
          req.session.user = userData;
          req.session.jwtToken = jwtToken;
          console.log("Session:", req.session);

          return res.status(200).json({
            isSuccess: true,
            msg: "Logged in successfully",
            user: userData,
          });
        } else {
          return res.status(401).json({
            isSuccess: false,
            errMsg: "Invalid Credentials!",
          });
        }
      } else {
        return res.status(400).json({
          isSuccess: false,
          errMsg: "User with given username or email ID doesn't exist",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        isSuccess: false,
        errMsg: "Internal Error Occurred!",
      });
    }
  },
};
