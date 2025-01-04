const express = require("express");
const  Controller  = require("../controllers/note.controller");
const {AuthCheck} = require("../middleware/authCheck")
const router = express.Router();
router.route("").post(AuthCheck, Controller.createNote).get(AuthCheck,Controller.getAllNotes).put(AuthCheck, Controller.updateNote).delete(AuthCheck, Controller.deleteNote)
router.route("/:noteId").get(AuthCheck, Controller.getNoteById);
router.route("/:noteId/share").post(AuthCheck, Controller.shareNote);
module.exports = router;
