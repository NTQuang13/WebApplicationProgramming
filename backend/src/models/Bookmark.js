export const createBookmarkTable = async (db) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS bookmarks (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      jobId VARCHAR(255) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
      UNIQUE KEY unique_bookmark (userId, jobId) -- Ngăn chặn 1 user lưu 1 job 2 lần
    );
  `;
  await db.query(sql);
  console.log("✅ Bảng 'bookmarks' đã sẵn sàng!");
};
