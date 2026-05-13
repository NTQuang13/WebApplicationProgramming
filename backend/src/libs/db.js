import mysql from "mysql2/promise";
import "dotenv/config";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "", // Điền tên user mysql
  password: process.env.DB_PASS || "", // Điền password
  database: process.env.DB_NAME || "job_portal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
