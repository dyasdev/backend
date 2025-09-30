const DBConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(DBConfig.DB, DBConfig.USER, DBConfig.PASSWORD, {
  host: DBConfig.HOST,
  dialect: DBConfig.dialect,
  pool: DBConfig.pool,
  logging: false,
  operatorAliases: false,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.User = require("./user.model.js")(sequelize, Sequelize);
db.Doctor = require("./doctor.model.js")(sequelize, Sequelize);
db.Field = require("./field.model.js")(sequelize, Sequelize);
db.Client = require("./client.model.js")(sequelize, Sequelize);
db.Admin = require("./admin.model.js")(sequelize, Sequelize);
db.Event = require("./event.model.js")(sequelize, Sequelize);
db.EventInterest = require("./event_interest.model.js")(sequelize, Sequelize);
db.Article = require("./article.model.js")(sequelize, Sequelize);
db.Like = require("./like.model.js")(sequelize, Sequelize);
db.Comment = require("./comment.model.js")(sequelize, Sequelize);
db.Appointment = require("./appointment.model.js")(sequelize, Sequelize);
db.Message = require("./message.model.js")(sequelize, Sequelize);
// Doctor ↔ Appointment
db.Doctor.hasMany(db.Appointment, {
  foreignKey: "doctor_id",
  as: "appointments",
  onDelete: "CASCADE",
});
db.Appointment.belongsTo(db.Doctor, {
  foreignKey: "doctor_id",
  as: "doctor",
});

db.Message.belongsTo(db.User, { foreignKey: "sender_id", as: "sender" });
db.Message.belongsTo(db.User, { foreignKey: "receiver_id", as: "receiver" });

db.Appointment.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
db.User.hasMany(db.Appointment, { foreignKey: "user_id", as: "appointments" });

//
// Existing Associations
//
db.User.hasMany(db.Doctor, { foreignKey: "user_id", as: "doctors" });
db.User.hasMany(db.Client, { foreignKey: "user_id", as: "clients" });
db.User.hasMany(db.Admin, { foreignKey: "user_id", as: "admins" });
db.Client.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
db.Doctor.belongsTo(db.Field, { foreignKey: "field_id", as: "field" });
db.Doctor.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
db.Field.hasMany(db.Doctor, { foreignKey: "field_id", as: "doctors" });

db.Event.hasMany(db.EventInterest, { foreignKey: "event_id", as: "interests" });
db.EventInterest.belongsTo(db.Event, { foreignKey: "event_id", as: "event" });
db.DoctorAvailability = require("./doctor_availability.model.js")(
  sequelize,
  Sequelize
);
db.User.hasMany(db.EventInterest, {
  foreignKey: "user_id",
  as: "event_interests",
});
db.EventInterest.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
db.User.belongsToMany(db.Event, {
  through: db.EventInterest,
  foreignKey: "user_id",
  otherKey: "event_id",
  as: "interested_events",
});
db.Event.belongsToMany(db.User, {
  through: db.EventInterest,
  foreignKey: "event_id",
  otherKey: "user_id",
  as: "interested_users",
});
db.Doctor.hasMany(db.DoctorAvailability, {
  foreignKey: "doctor_id",
  as: "availabilities",
  onDelete: "CASCADE",
});

db.DoctorAvailability.belongsTo(db.Doctor, {
  foreignKey: "doctor_id",
  as: "doctor",
});

// User ↔ Article
db.User.hasMany(db.Article, { foreignKey: "user_id", as: "articles" });
db.Article.belongsTo(db.User, { foreignKey: "user_id", as: "author" });

// Article ↔ Like
db.Article.hasMany(db.Like, { foreignKey: "article_id", as: "likes" });
db.Like.belongsTo(db.Article, { foreignKey: "article_id", as: "article" });

db.User.hasMany(db.Like, { foreignKey: "user_id", as: "user_likes" });
db.Like.belongsTo(db.User, { foreignKey: "user_id", as: "user" });

// Article ↔ Comment
db.Article.hasMany(db.Comment, { foreignKey: "article_id", as: "comments" });
db.Comment.belongsTo(db.Article, { foreignKey: "article_id", as: "article" });

db.User.hasMany(db.Comment, { foreignKey: "user_id", as: "user_comments" });
db.Comment.belongsTo(db.User, { foreignKey: "user_id", as: "user" });

// Nested Comments (optional replies)
db.Comment.hasMany(db.Comment, { foreignKey: "parent_id", as: "replies" });
db.Comment.belongsTo(db.Comment, { foreignKey: "parent_id", as: "parent" });

module.exports = db;
