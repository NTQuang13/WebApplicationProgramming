import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import pool from "../libs/db.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const [existingUsers] = await pool.query(
      "SELECT email FROM users WHERE email = ?",
      [email],
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await pool.query(
      "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [userId, name, email, hashedPassword, role || "candidate"],
    );

    const accessToken = jwt.sign(
      { userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    return res.status(201).json({
      user: { id: userId, name, email, role: role || "candidate" },
      token: accessToken,
    });
  } catch (error) {
    console.error("Lỗi khi gọi signup", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Thông tin không chính xác" });
    }

    const user = rows[0];
    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Thông tin không chính xác" });
    }

    // Tạo accessToken với JWT
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    // Tạo refreshToken
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);

    // Tạo session mới để lưu refreshToken
    await pool.query(
      "INSERT INTO sessions (userId, refreshToken, expiresAt) VALUES (?, ?, ?)",
      [user.id, refreshToken, expiresAt],
    );

    // Trả refreshToken về trong cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    // Trả accessToken về trong res
    return res.status(200).json({
      message: `User ${user.name} đã logged in!`,
      accessToken,
    });
  } catch (error) {
    console.error("Lỗi khi gọi signin", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signout = async (req, res) => {
  try {
    // Lấy refreshToken từ cookie
    const token = req.cookies?.refreshToken;

    // Xóa refreshToken trong Session
    if (token) {
      await pool.query("DELETE FROM sessions WHERE refreshToken = ?", [token]);
    }

    // Xóa cookie
    res.clearCookie("refreshToken");

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signout", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Tạo access token mới từ refresh token
export const refreshToken = async (req, res) => {
  try {
    // Lấy refreshToken từ cookie
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Token không tồn tại" });
    }

    // So sánh với refresh token trong db
    const [rows] = await pool.query(
      "SELECT * FROM sessions WHERE refreshToken = ?",
      [token],
    );
    const session = rows[0];
    if (!session) {
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // Kiểm tra hết hạn chưa
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token đã hết hạn" });
    }

    // Tạo access token mới
    const accessToken = jwt.sign(
      { userId: session.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refreshToken", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
