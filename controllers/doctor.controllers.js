const db = require("../models");
const DoctorAvailability = db.DoctorAvailability;

exports.createAvailability = async (req, res) => {
  try {
    const { doctor_id, date, start_time, end_time, status } = req.body;
    // Basic validation
    if (!doctor_id || !date || !start_time || !end_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const availability = await DoctorAvailability.create({
      doctor_id,
      date,
      start_time,
      end_time,
      status: status || "available",
    });
    return res.status(201).json({
      message: "Availability created successfully",
      availability,
    });
  } catch (err) {
    console.error("Error creating availability:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

exports.getAvailabilitiesByDoctor = async (req, res) => {
  try {
    const { doctorId, date } = req.query; // 👈 from query
    console.log(
      "Fetching availability for doctorId:",
      doctorId,
      "on date:",
      date
    );
    if (!doctorId || !date) {
      return res
        .status(400)
        .json({ message: "doctorId and date are required" });
    }
    const slots = await DoctorAvailability.findAll({
      where: { doctor_id: doctorId, date },
      order: [["start_time", "ASC"]],
    });

    return res.status(200).json({ slots });
  } catch (err) {
    console.error("Error fetching availability:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
