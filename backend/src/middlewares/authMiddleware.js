import jwt from "jsonwebtoken";
import pool from "../libs/db.js";

// Authorization - xác minh user là ai
export const protectedRoute = (req, res, next) => {
  try {
    // Lấy accessToken từ header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy access token" });
    }
    // Xác accessToken hợp lệ
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      async (err, decodedUser) => {
        if (err) {
          console.log(err);
          return res
            .status(403)
            .json({ message: "Access token hết hạn hoặc không đúng" });
        }

        // Tìm user
        const [rows] = await pool.query(
          "SELECT id, name, email, role, createdAt FROM users WHERE id = ?",
          [decodedUser.userId],
        );
        const user = rows[0];
        if (!user) {
          return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        // Trả user về trong req
        req.user = user;
        next();
      },
    );
  } catch (error) {
    console.log("Lỗi khi xác minh JWT trong authMiddleware", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
