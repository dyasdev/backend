const express = require("express");
const router = express.Router();

// Import the controller
const authController = require("../controllers/auth.controllers.js");

// Define the route for creating a doctor
router.post("/doctors", authController.registerDoctor);
router.post("/clients", authController.registerClient);
router.post("/admins", authController.registerAdmin);
router.post("/login", authController.login);
router.post("/verify", authController.verifyToken);

module.exports = router;
