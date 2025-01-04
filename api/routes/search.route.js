const express = require("express");
const  Controller  = require("../controllers/search.controller");
const {AuthCheck} = require("../middleware/authCheck")
const router = express.Router();
router.route("").get(AuthCheck, Controller.searchUserNotes)

module.exports = router;
