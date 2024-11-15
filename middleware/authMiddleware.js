const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = (req, res, next) => {
  const { jwtToken } = req.session;

  if (!jwtToken) {
    return res
      .status(401)
      .json({ Error: "Not logged in. Please log in again!" });
  }

  const token = jwtToken.replace("Bearer ", "");

  jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
    if (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ Error: "Token has expired. Please log in again!" });
      } else {
        console.log(error);
        return res.status(500).json({ Error: "Internal error occurred!" });
      }
    } else {
      User.findById(payload.id)
        .then((userFound) => {
          if (!userFound) {
            return res.status(401).json({ Error: "Invalid credentials!" });
          }

          req.user = userFound;
          next();
        })
        .catch((error) => {
          console.log(error);
          return res.status(500).json({ Error: error.message });
        });
    }
  });
};
