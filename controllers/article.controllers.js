const jwt = require("jsonwebtoken");
const db = require("../models");
const { Sequelize } = require("sequelize"); // Make sure Sequelize is imported
const Article = db.Article;
const Like = db.Like;
const Comment = db.Comment;

exports.createArticle = async (req, res) => {
  try {
    const { title, slug, content, excerpt, status, token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Decode the token to get the user_id
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.user_id;

    const article = await Article.create({
      title,
      slug,
      content,
      excerpt,
      status,
      user_id,
    });

    return res.status(201).json({
      message: "Article created successfully",
      article,
    });
  } catch (error) {
    console.error("Error creating article:", error);
    return res.status(500).json({
      message: "Failed to create article",
      error: error.message,
    });
  }
};

// exports.getAllArticlesWithCounts = async (req, res) => {
//   try {
//     const articles = await Article.findAll({
//       attributes: {
//         include: [
//           [
//             Sequelize.literal(`(
//               SELECT COUNT(*) FROM comments AS comment
//               WHERE comment.article_id = Article.article_id
//             )`),
//             "comment_count",
//           ],
//           [
//             Sequelize.literal(`(
//               SELECT COUNT(*) FROM likes AS like_tbl
//               WHERE like_tbl.article_id = Article.article_id
//             )`),
//             "like_count",
//           ],
//         ],
//       },
//       order: [["createdAt", "DESC"]],
//     });

//     res.status(200).json(articles);
//   } catch (err) {
//     console.error("Error fetching articles with counts:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

exports.getAllArticlesWithCounts = async (req, res) => {
  try {
    console.log("Fetching articles with counts", req.query);
    const searchQuery = req.query.q || ""; // get search query, default empty
    const articles = await Article.findAll({
      where: {
        [Sequelize.Op.or]: [
          Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("title")), {
            [Sequelize.Op.like]: `%${searchQuery.toLowerCase()}%`,
          }),
          Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("content")), {
            [Sequelize.Op.like]: `%${searchQuery.toLowerCase()}%`,
          }),
        ],
      },
      attributes: {
        include: [
          [
            Sequelize.literal(`(
          SELECT COUNT(*) FROM comments AS comment
          WHERE comment.article_id = Article.article_id
        )`),
            "comment_count",
          ],
          [
            Sequelize.literal(`(
          SELECT COUNT(*) FROM likes AS like_tbl
          WHERE like_tbl.article_id = Article.article_id
        )`),
            "like_count",
          ],
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(articles);
  } catch (err) {
    console.error("Error fetching articles with counts:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getArticleById = async (req, res) => {
  const { id } = req.params;

  try {
    const article = await db.Article.findByPk(id, {
      include: [
        {
          model: db.Comment,
          as: "comments",
          attributes: ["comment_id", "user_id", "content", "createdAt"],
        },
        {
          model: db.Like,
          as: "likes",
          attributes: ["like_id", "user_id"],
        },
      ],
    });

    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    res.status(200).json(article);
  } catch (error) {
    console.error("🔥 Error fetching article by ID:", error.message);
    res.status(500).json({ message: "Server error retrieving article." });
  }
};

// exports.getAllArticlesWithCountsByUser = async (req, res) => {

//   const token = req.headers.authorization;
//   console.log("Token received:", token);

//   if (!token) {
//     return res.status(400).json({ message: "Token is required in the body" });
//   }

//   try {
//     // Decode token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user_id = decoded.user_id;
//     console.log("Decoded user_id:", user_id);

//     if (!user_id) {
//       return res
//         .status(400)
//         .json({ message: "Invalid token: user_id not found" });
//     }

//     const articles = await Article.findAll({
//       attributes: {
//         include: [
//           [
//             Sequelize.literal(`(
//               SELECT COUNT(*) FROM comments AS comment
//               WHERE comment.article_id = Article.article_id
//             )`),
//             "comment_count",
//           ],
//           [
//             Sequelize.literal(`(
//               SELECT COUNT(*) FROM likes AS like_tbl
//               WHERE like_tbl.article_id = Article.article_id
//             )`),
//             "like_count",
//           ],
//           [
//             Sequelize.literal(`(
//               SELECT COUNT(*) FROM likes AS like_tbl
//               WHERE like_tbl.article_id = Article.article_id
//               AND like_tbl.user_id = '${user_id}'
//             ) > 0`),
//             "user_liked",
//           ],
//         ],
//       },
//       order: [["createdAt", "DESC"]],
//     });

//     res.status(200).json(articles);
//   } catch (err) {
//     console.error("Error decoding token or fetching articles:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };
exports.getAllArticlesWithCountsByUser = async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res
      .status(400)
      .json({ message: "Token is required in the headers" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.user_id;

    if (!user_id) {
      return res
        .status(400)
        .json({ message: "Invalid token: user_id not found" });
    }

    const searchQuery = req.query.q || "";

    const articles = await Article.findAll({
      where: searchQuery
        ? {
            [Sequelize.Op.or]: [
              Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("title")),
                "LIKE",
                `%${searchQuery.toLowerCase()}%`
              ),
              Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("content")),
                "LIKE",
                `%${searchQuery.toLowerCase()}%`
              ),
              Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("excerpt")),
                "LIKE",
                `%${searchQuery.toLowerCase()}%`
              ),
            ],
          }
        : {},
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT COUNT(*) FROM comments AS comment
              WHERE comment.article_id = article.article_id
            )`),
            "comment_count",
          ],
          [
            Sequelize.literal(`(
              SELECT COUNT(*) FROM likes AS like_tbl
              WHERE like_tbl.article_id = article.article_id
            )`),
            "like_count",
          ],
          [
            Sequelize.literal(`(
              SELECT COUNT(*) FROM likes AS like_tbl
              WHERE like_tbl.article_id = article.article_id
              AND like_tbl.user_id = ${user_id}
            ) > 0`),
            "user_liked",
          ],
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(articles);
  } catch (err) {
    console.error("Error decoding token or fetching articles:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  const token = req.headers.authorization;
  const { article_id } = req.body;

  if (!token || !article_id) {
    return res
      .status(400)
      .json({ message: "Token and article_id are required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.user_id;

    if (!user_id) {
      return res
        .status(400)
        .json({ message: "Invalid token: user_id not found" });
    }

    // Check if like already exists
    const existingLike = await Like.findOne({
      where: { user_id, article_id },
    });

    if (existingLike) {
      // Unlike
      await existingLike.destroy();
      return res
        .status(200)
        .json({ liked: false, message: "Unliked successfully" });
    } else {
      // Like
      await Like.create({ user_id, article_id });
      return res
        .status(200)
        .json({ liked: true, message: "Liked successfully" });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { article_id, comment } = req.body;
    const content = comment;

    const token = req.headers.authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.user_id;

    console.log(
      "Creating comment for article_id:",
      article_id,
      "by user_id:",
      user_id,
      "with content:",
      content
    );

    if (!article_id || !content) {
      return res
        .status(400)
        .json({ message: "Article ID and content are required." });
    }

    const newComment = await Comment.create({
      article_id,
      user_id,
      content,
    });

    res
      .status(201)
      .json({ message: "Comment posted successfully.", comment: newComment });
  } catch (error) {
    console.error("Error posting comment:", error);
    if (error instanceof Sequelize.ValidationError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors.map((err) => err.message),
      });
    }
    res.status(500).json({ message: "Failed to post comment." });
  }
};

exports.deleteComment = async (req, res) => {
  const { comment_id } = req.params;

  try {
    const comment = await Comment.findByPk(comment_id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    await comment.destroy();
    res.status(200).json({ message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment." });
  }
};
