const db = require("../models");
const Event = db.Event;
const EventInterest = db.EventInterest;
const { Op } = require("sequelize");

exports.createEvent = async (req, res) => {
  try {
    const { title, date, time, description, location, status } = req.body;

    console.log(title, date, time, description, location, status);
    const image = req.file ? req.file.filename : null;

    if (!title || !date || !time) {
      return res
        .status(400)
        .json({ message: "Title, date, and time are required." });
    }

    const newEvent = await Event.create({
      title,
      date,
      time,
      description,
      location,
      status: status || "upcoming",
      image,
    });

    res
      .status(201)
      .json({ message: "Event created successfully!", event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const { keyword, date, status } = req.query;

    // Build filter conditions
    const where = {};

    if (keyword) {
      const search = { [Op.iLike]: `%${keyword}%` };
      where[Op.or] = [
        { title: search },
        { description: search },
        { location: search },
      ];
    }

    if (date) {
      where.date = date; // should be in YYYY-MM-DD
    }

    if (status && status.toLowerCase() !== "all") {
      where.status = status.toLowerCase();
    }

    const events = await Event.findAll({
      where,
      order: [["date", "ASC"]],
      include: [
        {
          model: EventInterest,
          as: "interests",
          attributes: [],
        },
      ],
    });

    const formatted = await Promise.all(
      events.map(async (event) => {
        const interestCount = await EventInterest.count({
          where: { event_id: event.event_id, status: "enabled" },
        });

        return {
          title: event.title,
          date: new Date(event.date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          time: event.time,
          description: event.description,
          location: event.location,
          interested: interestCount,
          status: capitalize(event.status),
        };
      })
    );

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Helper to capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
