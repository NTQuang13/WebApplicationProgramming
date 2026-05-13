export const createSearchLogTable = async (db) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS search_logs (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255),
      keyword VARCHAR(255),
      searchType VARCHAR(100),
      filters JSON,
      resultCount INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    );
  `;
  await db.query(sql);
  console.log("✅ Bảng 'search_logs' đã sẵn sàng!");
};
