import pool from "../libs/db.js";

export const getExperienceLevels = async (req, res) => {
  try {
    const [data] = await pool.query("SELECT * FROM experience_levels ORDER BY `order` ASC");
    res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi lấy cấp bậc kinh nghiệm:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
