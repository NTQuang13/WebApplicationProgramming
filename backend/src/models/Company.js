export const createCompanyTable = async (db) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS companies (
      id VARCHAR(255) PRIMARY KEY,
      recruiterId VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      website VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (recruiterId) REFERENCES users(id) ON DELETE SET NULL
    );
  `;
  await db.query(sql);
  console.log("✅ Bảng 'companies' đã sẵn sàng!");
};
