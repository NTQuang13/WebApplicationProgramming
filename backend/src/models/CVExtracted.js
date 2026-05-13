export const createCVExtractedTable = async (db) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS cv_extracted_data (
      id VARCHAR(255) PRIMARY KEY,
      cvId VARCHAR(255) NOT NULL,
      
      rawText LONGTEXT NOT NULL,
      
      skills JSON DEFAULT NULL,
      
      yearsOfExperience INT DEFAULT 0,
      
      education JSON DEFAULT NULL,           -- [{degree, field, university, year}]
      experience JSON DEFAULT NULL,          -- [{title, company, duration, description}]

      lastProcessedAt TIMESTAMP NULL DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- Foreign key to cvs table
      FOREIGN KEY (cvId) REFERENCES cvs(id) ON DELETE CASCADE,
      
      -- Mỗi cvId chỉ nên có 1 bản ghi trích xuất (giúp tránh insert trùng khi job bị retry)
      UNIQUE KEY uq_cvId (cvId),
      INDEX idx_lastProcessedAt (lastProcessedAt)
    );
  `;

  await db.query(sql);
  console.log("✅ Bảng 'cv_extracted_data' đã sẵn sàng");
};
