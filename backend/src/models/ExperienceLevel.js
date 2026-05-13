export const createExperienceLevelTable = async (db) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS experience_levels (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      \`order\` INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.query(sql);
  console.log("✅ Bảng 'experience_levels' đã sẵn sàng!");
};
