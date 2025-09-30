const bcrypt = require("bcrypt");
const db = require("../models");
const jwt = require("jsonwebtoken");

const User = db.User;
const Doctor = db.Doctor;
const Client = db.Client;
const Admin = db.Admin;

exports.registerDoctor = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      first_name,
      middle_name,
      last_name,
      field_id,
      contact_number,
      valid_id,
      email,
      password,
    } = req.body;

    // Check if a user with the email already exists
    const existingUser = await User.findOne({
      where: { email },
      transaction: t,
    });

    if (existingUser) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user with doctor role and pending status
    const user = await User.create(
      {
        email,
        password: hashedPassword,
        role: "doctor",
        status: "pending",
      },
      { transaction: t }
    );

    // Create the doctor profile linked to the user
    const doctor = await Doctor.create(
      {
        first_name,
        middle_name,
        last_name,
        field_id,
        contact_number,
        valid_id,
        user_id: user.user_id,
        status: "enabled", // Optional since your model has a default
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      message: "Doctor registered successfully.",
      user,
      doctor,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error registering doctor:", error);
    return res.status(500).json({
      message: "An error occurred while registering the doctor.",
      error: error.message,
    });
  }
};

exports.registerClient = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      first_name,
      middle_name,
      last_name,
      field_id,
      contact_number,
      email,
      password,
    } = req.body;

    // Check if user already exists with the same email
    const existingUser = await User.findOne({
      where: { email },
      transaction: t,
    });

    if (existingUser) {
      await t.rollback();
      return res.status(400).json({
        message: "User with this email already exists.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user record
    const user = await User.create(
      {
        email,
        password: hashedPassword,
        role: "client",
        status: "pending", // Default for new client users
      },
      { transaction: t }
    );

    // Create the client record linked to the user
    const client = await Client.create(
      {
        first_name,
        middle_name,
        last_name,
        field_id,
        contact_number,
        user_id: user.user_id,
        status: "enabled", // Optional; your model uses default
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      message: "Client registered successfully.",
      user,
      client,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error registering client:", error);
    return res.status(500).json({
      message: "An error occurred while registering the client.",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Hash the role (bcrypt is async and one-way)
    const hashedRole = await bcrypt.hash(user.role, 10);

    const payload = {
      user_id: user.user_id,
      role: hashedRole,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15h",
    });

    return res.status(200).json({
      status: "SUCCESS",
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "An error occurred during login.",
      error: error.message,
    });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const client_tab = [
      "home",
      "events",
      "articles",
      "consultation",
      "profile",
    ];

    const doctor_tab = [
      "home",
      "events",
      "articles",
      "availability",
      "consultation",
      "profile",
      // "patients",
    ];

    const admin_tab = [
      "home",
      "events",
      "articles",
      "consultation",
      "profile",
      // "patients",
      "doctors",
      "clients",
    ];

    const token = req.body.token;

    let encryptedRole;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token missing or malformed." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //role is bcrypted, so we need to compare it and return the tabs accordingly
    let tabs;
    if (bcrypt.compareSync("client", decoded.role)) {
      tabs = client_tab;
      encryptedRole = "grace";
    }
    if (bcrypt.compareSync("doctor", decoded.role)) {
      tabs = doctor_tab;
      encryptedRole = "janna"; // Placeholder, adjust as needed
    }
    if (bcrypt.compareSync("admin", decoded.role)) {
      tabs = admin_tab;
      encryptedRole = "gwyneth"; // Placeholder, adjust as needed
    }

    return res.status(200).json({
      message: "Token is valid.",
      tabs,
      role: encryptedRole,
    });
  } catch (error) {
    return res.status(401).json({
      message: "Token is invalid or expired.",
      error: error.message,
    });
  }
};

exports.registerAdmin = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      first_name,
      middle_name,
      last_name,
      contact_number,
      email,
      password,
      secret_key,
    } = req.body;

    // ✅ Check secret key
    if (secret_key !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        message: "Invalid admin secret key. Registration denied.",
      });
    }

    // ✅ Check for existing email
    const existingUser = await User.findOne({
      where: { email },
      transaction: t,
    });

    if (existingUser) {
      await t.rollback();
      return res.status(400).json({
        message: "User with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(
      {
        email,
        password: hashedPassword,
        role: "admin",
        status: "enabled",
      },
      { transaction: t }
    );

    const admin = await Admin.create(
      {
        first_name,
        middle_name,
        last_name,
        contact_number,
        user_id: user.user_id,
        status: "enabled",
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      message: "Admin registered successfully.",
      user,
      admin,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error registering admin:", error);
    return res.status(500).json({
      message: "An error occurred while registering the admin.",
      error: error.message,
    });
  }
};
