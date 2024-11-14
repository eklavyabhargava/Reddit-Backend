const multer = require("multer");

// set file destination
const storage = multer.memoryStorage({
  destination: function (req, file, cb) {
    cb(null, "");
  },
});

const filefilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/gif"
  ) {
    cb(null, true); // Allow the file to be uploaded
  } else {
    cb(null, false); // Reject the file
  }
};

// using upload middleware to handle the file upload
const upload = multer({ storage: storage, fileFilter: filefilter });

module.exports = upload;
