const express = require("express");
const router = express.Router();

// Defining all routes here
router.use("/", require("./index.route"));
router.use("/api/v1/auth", require("./auth.route"));
router.use("/api/v1/notes", require("./note.route"));
router.use("/api/v1/search", require("./search.route"));
module.exports = router;
