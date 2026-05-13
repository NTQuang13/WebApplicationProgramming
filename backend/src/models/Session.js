import pool from "../libs/db.js";

export const createSessionTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      refreshToken VARCHAR(512) NOT NULL UNIQUE,
      expiresAt DATETIME NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_session 
        FOREIGN KEY (userId) 
        REFERENCES users(id) 
        ON DELETE CASCADE
    );
  `;
  await pool.query(sql);
  console.log("✅ Bảng 'sessions' đã sẵn sàng!");
};
