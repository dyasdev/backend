const controller = require("../controllers/doctor.controllers.js");
const router = require("express").Router();

router.get("/availability", controller.getAvailabilitiesByDoctor);
router.post("/availability", controller.createAvailability);

module.exports = router;
