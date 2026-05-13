export const createCategoryTable = async (db) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS job_categories (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.query(sql);
  console.log("✅ Bảng 'job_categories' đã sẵn sàng!");
};
