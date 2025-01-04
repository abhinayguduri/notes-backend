const express = require("express");
const  Controller  = require("../controllers/index.controller");

const router = express.Router();
router.get("/", Controller.indexHandler);

module.exports = router;
