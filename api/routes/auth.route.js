const express = require("express");
const  Controller  = require("../controllers/auth.controller");

const router = express.Router();
router.route("/signup").post(Controller.createUser)
router.route("/signin").post(Controller.signinUser)
module.exports = router;