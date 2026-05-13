import { v4 as uuidv4 } from "uuid";
import pool from "../libs/db.js";

// 1. LƯU CÔNG VIỆC
export const saveJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.user.id;

    if (!jobId) {
      return res.status(400).json({ message: "Thiếu jobId" });
    }

    // Kiểm tra xem job có tồn tại không
    const [jobs] = await pool.query("SELECT id FROM jobs WHERE id = ?", [
      jobId,
    ]);
    if (jobs.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy công việc này" });
    }

    // Kiểm tra trùng lặp
    const [existing] = await pool.query(
      "SELECT id FROM bookmarks WHERE userId = ? AND jobId = ?",
      [userId, jobId],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Duplicate: Bạn đã lưu công việc này rồi" });
    }

    const bookmarkId = uuidv4();
    await pool.query(
      "INSERT INTO bookmarks (id, userId, jobId) VALUES (?, ?, ?)",
      [bookmarkId, userId, jobId],
    );

    res.status(201).json({
      message: "Đã lưu công việc!",
      bookmark: { id: bookmarkId, jobId },
    });
  } catch (error) {
    console.error("Lỗi lưu job:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 2. LẤY DANH SÁCH CÔNG VIỆC ĐÃ LƯU
export const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // JOIN 3 bảng: Bookmarks, Jobs và Companies để lấy đầy đủ thông tin hiển thị
    const sql = `
      SELECT b.id as bookmarkId, b.createdAt as savedAt, 
             j.id as jobId, j.title, j.salaryMin, j.salaryMax, j.location,
             c.name as companyName, c.website
      FROM bookmarks b
      JOIN jobs j ON b.jobId = j.id
      JOIN companies c ON j.companyId = c.id
      WHERE b.userId = ?
      ORDER BY b.createdAt DESC LIMIT ? OFFSET ?
    `;
    const [data] = await pool.query(sql, [userId, limit, offset]);

    res.status(200).json({ data, page, limit });
  } catch (error) {
    console.error("Lỗi lấy danh sách lưu:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 3. BỎ LƯU CÔNG VIỆC (Xóa bookmark)
export const removeBookmark = async (req, res) => {
  try {
    const { jobId } = req.params; // Lấy jobId từ URL
    const userId = req.user.id;

    const [result] = await pool.query(
      "DELETE FROM bookmarks WHERE userId = ? AND jobId = ?",
      [userId, jobId],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy công việc đã lưu này" });
    }

    res.status(200).json({ message: "Đã bỏ lưu công việc" });
  } catch (error) {
    console.error("Lỗi xóa bookmark:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
