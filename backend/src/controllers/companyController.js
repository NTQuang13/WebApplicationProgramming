import { v4 as uuidv4 } from "uuid";
import pool from "../libs/db.js";

// Hàm xử lý việc Tạo công ty
export const createCompany = async (req, res) => {
  try {
    const { name, description, website } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const companyId = uuidv4();
    const recruiterId = req.user?.id || null;
    const sql =
      "INSERT INTO companies (id, recruiterId, name, description, website) VALUES (?, ?, ?, ?, ?)";
    await pool.query(sql, [
      companyId,
      recruiterId,
      name,
      description,
      website || null,
    ]);

    res
      .status(201)
      .json({ company: { id: companyId, recruiterId, name, description, website } });
  } catch (error) {
    console.error("Lỗi tạo công ty:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Hàm xử lý việc Lấy danh sách
export const getCompanies = async (req, res) => {
  try {
    // Lấy page và limit từ query URL (VD: ?page=1&limit=10), gán mặc định nếu không có
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Lấy dữ liệu theo Limit và Offset
    const sql =
      "SELECT * FROM companies ORDER BY createdAt DESC LIMIT ? OFFSET ?";
    // Note: Khi truyền số vào LIMIT trong mysql2, cần phải parse cẩn thận hoặc truyền thẳng
    const [companies] = await pool.query(sql, [limit, offset]);

    res.status(200).json({ companies });
  } catch (error) {
    console.error("Lỗi lấy danh sách công ty:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyCompanies = async (req, res) => {
  try {
    const recruiterId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT * FROM companies
      WHERE recruiterId = ?
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `;
    const [companies] = await pool.query(sql, [recruiterId, limit, offset]);

    res.status(200).json({ companies });
  } catch (error) {
    console.error("Loi lay danh sach cong ty cua recruiter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const companyId = req.params.id;
    const [companies] = await pool.query("SELECT * FROM companies WHERE id = ?", [
      companyId,
    ]);

    if (companies.length === 0) {
      return res.status(404).json({ message: "Not found: Company not found" });
    }

    res.status(200).json({ company: companies[0] });
  } catch (error) {
    console.error("Lỗi lấy chi tiết công ty:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
