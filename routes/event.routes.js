const express = require("express");
const router = express.Router();
const eventController = require("../controllers/event.controllers");
const upload = require("../middleware/upload");

router.post("/", upload.single("image"), eventController.createEvent);
router.get("/", eventController.getAllEvents);
module.exports = router;
