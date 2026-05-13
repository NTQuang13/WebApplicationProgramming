export const createCVTable = async (db) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS cvs (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      fileName VARCHAR(255) NOT NULL,
      filePath VARCHAR(255) NOT NULL,
      fileSize INT,
      status VARCHAR(50) DEFAULT 'pending',
      esIndexId VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
  await db.query(sql);
  console.log("✅ Bảng 'cvs' đã sẵn sàng!");
};
