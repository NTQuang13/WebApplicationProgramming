import pool from "../libs/db.js";

export const getCategories = async (req, res) => {
  try {
    const [data] = await pool.query("SELECT * FROM job_categories ORDER BY name ASC");
    res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi lấy danh mục:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
