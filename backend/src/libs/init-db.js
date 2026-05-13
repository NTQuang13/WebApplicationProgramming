import mysql from "mysql2/promise";
import "dotenv/config";
import { createUserTable } from "../models/User.js";
import { createCompanyTable } from "../models/Company.js";
import { createJobTable } from "../models/Job.js";
import { createCVTable } from "../models/CV.js";
import { createCVExtractedTable } from "../models/CVExtracted.js";
import { createApplicationTable } from "../models/Application.js";
import { createBookmarkTable } from "../models/Bookmark.js";
import { createSessionTable } from "../models/Session.js";
import { createCategoryTable } from "../models/Category.js";
import { createExperienceLevelTable } from "../models/ExperienceLevel.js";
import { createSearchLogTable } from "../models/SearchLog.js";

async function setupDatabase() {
  let connection;
  try {
    console.log("⏳ Đang kết nối MySQL để khởi tạo...");

    // 1. Tạo kết nối KHÔNG KHAI BÁO DATABASE NAME
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "", // Điền username
      password: process.env.DB_PASS || "", // Điền password
    });

    const dbName = process.env.DB_NAME || "job_portal";

    // 2. Chạy lệnh tạo Database trước
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`✅ Đã tạo hoặc tìm thấy Database: '${dbName}'`);

    // 3. Bắt buộc phải chọn Database vừa tạo để làm việc
    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Đã chọn Database: '${dbName}'`);

    console.log("⏳ Đang khởi tạo các bảng...");

    // 4. Truyền biến connection này vào các hàm tạo bảng
    await createUserTable(connection);
    await createCompanyTable(connection);
    await createCategoryTable(connection);
    await createExperienceLevelTable(connection);
    await createJobTable(connection);
    await createCVTable(connection);
    await createCVExtractedTable(connection);
    await createApplicationTable(connection);
    await createBookmarkTable(connection);
    await createSessionTable(connection);
    await createSearchLogTable(connection);

    console.log("🎉 KHỞI TẠO CƠ SỞ DỮ LIỆU HOÀN TẤT!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi khởi tạo Database:", error);
    process.exit(1);
  } finally {
    // Luôn nhớ đóng kết nối khi xong việc
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
