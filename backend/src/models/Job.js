export const createJobTable = async (db) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS jobs (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT,
      salaryMin INT,
      salaryMax INT,
      location VARCHAR(255),
      jobTypeId VARCHAR(255),
      experienceLevelId VARCHAR(255),
      status VARCHAR(50) DEFAULT 'published',
      esIndexId VARCHAR(255),
      startDate DATETIME DEFAULT NULL,
      endDate DATETIME DEFAULT NULL,
      companyId VARCHAR(255) NOT NULL,
      createdBy VARCHAR(255) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      publishedAt TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (jobTypeId) REFERENCES job_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (experienceLevelId) REFERENCES experience_levels(id) ON DELETE SET NULL
    );
  `;
  await db.query(sql);
  console.log("✅ Bảng 'jobs' đã sẵn sàng!");
};
