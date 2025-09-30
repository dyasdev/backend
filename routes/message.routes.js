// routes/message.routes.js
const router = require("express").Router();
const controller = require("../controllers/message.controllers");

router.post("/", controller.sendMessage);
router.get("/:user1/:user2", controller.getConversation);
router.put("/read/:messageId", controller.markAsRead);

module.exports = router;
