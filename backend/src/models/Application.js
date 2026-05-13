export const createApplicationTable = async (db) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS applications (
      id VARCHAR(255) PRIMARY KEY,
      jobId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      cvId VARCHAR(255) NOT NULL,
      status ENUM('pending', 'reviewed', 'accepted', 'rejected') DEFAULT 'pending',
      appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewedAt TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (cvId) REFERENCES cvs(id) ON DELETE CASCADE,
      UNIQUE KEY unique_apply (jobId, userId) -- Ngăn 1 user apply 2 lần vào 1 job
    );
  `;
  await db.query(sql);
  console.log("✅ Bảng 'applications' đã sẵn sàng!");
};
