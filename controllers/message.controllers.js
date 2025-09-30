// controllers/message.controller.js
const db = require("../models");
const Message = db.Message;
const User = db.User;

exports.sendMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, type, content } = req.body;
    const msg = await Message.create({ sender_id, receiver_id, type, content });

    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const msgs = await Message.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { sender_id: user1, receiver_id: user2 },
          { sender_id: user2, receiver_id: user1 },
        ],
      },
      order: [["createdAt", "ASC"]],
      include: [
        { model: User, as: "sender", attributes: ["user_id", "email", "role"] },
        {
          model: User,
          as: "receiver",
          attributes: ["user_id", "email", "role"],
        },
      ],
    });

    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    await Message.update({ read: true }, { where: { message_id: messageId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
