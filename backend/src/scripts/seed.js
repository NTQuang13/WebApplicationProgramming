import { fakerVI as faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import pool from "../libs/db.js";
import { cvQueue } from "../libs/queue.js";
import "dotenv/config";
import fs from "fs";
import path from "path";

// --- CẤU HÌNH SỐ LƯỢNG DỮ LIỆU MUỐN TẠO ---
const NUM_RECRUITERS = 10;
const NUM_CANDIDATES = 30;
const NUM_COMPANIES = 15;
const NUM_JOBS = 200;

// --- CẤU HÌNH THƯ MỤC CV THẬT ---
// Bỏ 30 file CV PDF thật vào thư mục này trước khi chạy seed
const REAL_CV_DIR = path.resolve("src/real_cvs");
// Thư mục uploads thực tế mà server đang serve file tĩnh
const UPLOADS_DIR = path.resolve("uploads");

/**
 * Đọc danh sách các file PDF trong thư mục real_cvs/
 * Trả về mảng { fileName, filePath, fileSize }
 */
function loadRealCVs() {
  if (!fs.existsSync(REAL_CV_DIR)) {
    throw new Error(
      `❌ Không tìm thấy thư mục "${REAL_CV_DIR}".\n` +
        `   Hãy tạo thư mục "real_cvs/" và bỏ vào đó ít nhất 1 file PDF.`,
    );
  }

  const files = fs
    .readdirSync(REAL_CV_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));

  if (files.length === 0) {
    throw new Error(
      `❌ Thư mục "${REAL_CV_DIR}" không có file PDF nào.\n` +
        `   Hãy bỏ vào đó ít nhất 1 file PDF CV thật.`,
    );
  }

  console.log(`📁 Tìm thấy ${files.length} CV thật: ${files.join(", ")}`);

  return files.map((fileName) => {
    const srcPath = path.join(REAL_CV_DIR, fileName);
    const stats = fs.statSync(srcPath);
    return {
      originalName: fileName,
      srcPath,
      fileSize: stats.size,
    };
  });
}

/**
 * Copy file CV thật vào thư mục uploads/ với tên unique (uuid + tên gốc)
 * để tránh ghi đè khi nhiều candidate dùng chung 1 CV nguồn.
 * Trả về { fileName, filePath, fileSize }
 */
function copyRealCVToUploads(realCV) {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const uniqueName = `${uuidv4()}_${realCV.originalName}`;
  const destPath = path.join(UPLOADS_DIR, uniqueName);

  fs.copyFileSync(realCV.srcPath, destPath);

  return {
    fileName: uniqueName,
    // Đường dẫn tương đối dùng trong DB (server serve /uploads/...)
    filePath: `/uploads/${uniqueName}`,
    fileSize: realCV.fileSize,
  };
}

const seedDatabase = async () => {
  console.log("⏳ Đang bắt đầu quá trình tạo dữ liệu mẫu (Seeding)...");

  try {
    // Load danh sách CV thật ngay từ đầu, nếu thiếu thư mục thì báo lỗi sớm
    const realCVs = loadRealCVs();

    if (realCVs.length < NUM_CANDIDATES) {
      throw new Error(
        `❌ Không đủ CV thật.\n` +
          `Cần ít nhất ${NUM_CANDIDATES} CV nhưng chỉ có ${realCVs.length}.`,
      );
    }

    // 1. XÓA SẠCH DỮ LIỆU CŨ
    console.log("🧹 Đang dọn dẹp Database cũ...");
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
    await pool.query("TRUNCATE TABLE search_logs;");
    await pool.query("TRUNCATE TABLE bookmarks;");
    await pool.query("TRUNCATE TABLE applications;");
    await pool.query("TRUNCATE TABLE cv_extracted_data;");
    await pool.query("TRUNCATE TABLE cvs;");
    await pool.query("TRUNCATE TABLE jobs;");
    await pool.query("TRUNCATE TABLE companies;");
    await pool.query("TRUNCATE TABLE users;");
    await pool.query("TRUNCATE TABLE job_categories;");
    await pool.query("TRUNCATE TABLE experience_levels;");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

    const defaultPassword = await bcrypt.hash("password123", 10);

    // 2. TẠO USERS (RECRUITER & CANDIDATE)
    console.log(
      `👤 Đang tạo ${NUM_RECRUITERS} nhà tuyển dụng và ${NUM_CANDIDATES} ứng viên...`,
    );
    const recruiters = [];
    const candidates = [];

    for (let i = 0; i < NUM_RECRUITERS + NUM_CANDIDATES; i++) {
      const id = uuidv4();
      const isRecruiter = i < NUM_RECRUITERS;
      const role = isRecruiter ? "recruiter" : "candidate";

      await pool.query(
        "INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)",
        [
          id,
          faker.person.fullName(),
          faker.internet.email(),
          defaultPassword,
          role,
          faker.phone.number(),
        ],
      );

      if (isRecruiter) recruiters.push(id);
      else candidates.push(id);
    }

    // 3. TẠO CÔNG TY
    console.log(`🏢 Đang tạo ${NUM_COMPANIES} công ty...`);
    const companies = [];
    for (let i = 0; i < NUM_COMPANIES; i++) {
      const id = uuidv4();
      const recruiterId = faker.helpers.arrayElement(recruiters);
      await pool.query(
        "INSERT INTO companies (id, recruiterId, name, description, website) VALUES (?, ?, ?, ?, ?)",
        [
          id,
          recruiterId,
          faker.company.name(),
          faker.company.catchPhrase(),
          faker.internet.url(),
        ],
      );
      companies.push({ id, recruiterId });
    }

    // 3.1 TẠO DANH MỤC CÔNG VIỆC
    console.log("📂 Đang tạo danh mục công việc...");
    const categoryNames = [
      "Công nghệ thông tin",
      "Kinh doanh / Bán hàng",
      "Marketing / Truyền thông",
      "Kế toán / Kiểm toán",
      "Hành chính / Nhân sự",
      "Kỹ thuật / Sản xuất",
      "Xây dựng",
      "Y tế / Dược phẩm",
    ];
    const categories = [];
    for (const name of categoryNames) {
      const id = uuidv4();
      await pool.query(
        "INSERT INTO job_categories (id, name, description) VALUES (?, ?, ?)",
        [id, name, faker.lorem.sentence()],
      );
      categories.push(id);
    }

    // 3.2 TẠO CẤP BẬC KINH NGHIỆM
    console.log("📊 Đang tạo cấp bậc kinh nghiệm...");
    const experienceLevelsData = [
      { name: "Entry Level", order: 1 },
      { name: "Junior", order: 2 },
      { name: "Mid-Level", order: 3 },
      { name: "Senior", order: 4 },
      { name: "Lead / Manager", order: 5 },
    ];
    const experienceLevelIds = [];
    for (const level of experienceLevelsData) {
      const id = uuidv4();
      await pool.query(
        "INSERT INTO experience_levels (id, name, `order`) VALUES (?, ?, ?)",
        [id, level.name, level.order],
      );
      experienceLevelIds.push(id);
    }

    // 4. TẠO CÔNG VIỆC (JOBS)
    console.log(`💼 Đang tạo ${NUM_JOBS} công việc...`);
    const jobs = [];
    const jobTitles = [
      "Frontend Developer",
      "Backend Developer",
      "Fullstack Developer",
      "DevOps Engineer",
      "Project Manager",
      "UI/UX Designer",
      "Business Analyst",
      "QA/QC Tester",
    ];
    const locations = [
      "An Giang",
      "Bà Rịa - Vũng Tàu",
      "Bạc Liêu",
      "Bắc Giang",
      "Bắc Kạn",
      "Bắc Ninh",
      "Bến Tre",
      "Bình Dương",
      "Bình Định",
      "Bình Phước",
      "Bình Thuận",
      "Cà Mau",
      "Cao Bằng",
      "Cần Thơ",
      "Đà Nẵng",
      "Đắk Lắk",
      "Đắk Nông",
      "Điện Biên",
      "Đồng Nai",
      "Đồng Tháp",
      "Gia Lai",
      "Hà Giang",
      "Hà Nam",
      "Hà Nội",
      "Hà Tĩnh",
      "Hải Dương",
      "Hải Phòng",
      "Hậu Giang",
      "Hòa Bình",
      "Hưng Yên",
      "Khánh Hòa",
      "Kiên Giang",
      "Kon Tum",
      "Lai Châu",
      "Lạng Sơn",
      "Lào Cai",
      "Lâm Đồng",
      "Long An",
      "Nam Định",
      "Nghệ An",
      "Ninh Bình",
      "Ninh Thuận",
      "Phú Thọ",
      "Phú Yên",
      "Quảng Bình",
      "Quảng Nam",
      "Quảng Ngãi",
      "Quảng Ninh",
      "Quảng Trị",
      "Sóc Trăng",
      "Sơn La",
      "Tây Ninh",
      "Thái Bình",
      "Thái Nguyên",
      "Thanh Hóa",
      "Thừa Thiên Huế",
      "Tiền Giang",
      "TP. Hồ Chí Minh",
      "Trà Vinh",
      "Tuyên Quang",
      "Vĩnh Long",
      "Vĩnh Phúc",
      "Yên Bái",
    ];

    for (let i = 0; i < NUM_JOBS; i++) {
      const id = uuidv4();
      const company = faker.helpers.arrayElement(companies);
      const companyId = company.id;
      const createdBy = company.recruiterId;
      const categoryId = faker.helpers.arrayElement(categories);
      const expLevelId = faker.helpers.arrayElement(experienceLevelIds);
      const salaryMin = faker.number.int({ min: 500, max: 1500 });
      const salaryMax = salaryMin + faker.number.int({ min: 500, max: 1500 });

      await pool.query(
        "INSERT INTO jobs (id, title, description, requirements, salaryMin, salaryMax, location, jobTypeId, experienceLevelId, companyId, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id,
          faker.helpers.arrayElement(jobTitles) +
            " (" +
            faker.helpers.arrayElement([
              "React",
              "NodeJS",
              "Java",
              "Python",
              "Figma",
              "AWS",
            ]) +
            ")",
          faker.lorem.paragraphs(2),
          faker.lorem.paragraph(),
          salaryMin,
          salaryMax,
          faker.helpers.arrayElement(locations),
          categoryId,
          expLevelId,
          companyId,
          createdBy,
        ],
      );
      jobs.push(id);
    }

    // 5. TẠO CV CHO ỨNG VIÊN (XOAY VÒNG QUA CV THẬT)
    console.log(
      `📄 Đang tạo CV cho ${candidates.length} ứng viên ${realCVs.length} ...`,
    );
    const cvs = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];

      // Xoay vòng: candidate thứ i dùng CV thứ (i % số lượng CV thật)
      const realCV = realCVs[i];

      // Copy file CV thật vào uploads/ với tên unique
      const { fileName, filePath, fileSize } = copyRealCVToUploads(realCV);

      const cvId = uuidv4();
      await pool.query(
        "INSERT INTO cvs (id, userId, fileName, filePath, fileSize, status) VALUES (?, ?, ?, ?, ?, ?)",
        [
          cvId,
          candidateId,
          fileName,
          filePath,
          fileSize,
          // Status "pending" để background worker xử lý trích xuất thật
          // Đổi thành "completed" nếu bạn muốn bỏ qua bước này
          "pending",
        ],
      );

      // KHÔNG tạo cv_extracted_data giả nữa.
      // Background worker (pdf-extract worker) sẽ đọc file thật,
      // trích xuất text và insert vào cv_extracted_data + index lên Elasticsearch.
      // Nếu bạn chưa có worker và muốn seed nhanh để test,
      // hãy bật đoạn dưới (uncomment) để insert text giả tạm thời:
      //
      // const extractId = uuidv4();
      // const dummyText = `Kỹ năng: JavaScript, React, Node.js. Kinh nghiệm: ${faker.lorem.paragraph()}`;
      // await pool.query(
      //   "INSERT INTO cv_extracted_data (id, cvId, rawText) VALUES (?, ?, ?)",
      //   [extractId, cvId, dummyText]
      // );

      await cvQueue.add("extract-cv-text", {
        cvId,
        filePath,
      });

      cvs.push({ cvId, candidateId });
    }

    // 6. TẠO APPLICATIONS VÀ BOOKMARKS
    console.log(`🚀 Đang giả lập hành vi Ứng tuyển và Lưu công việc...`);
    for (const cvObj of cvs) {
      // Mỗi ứng viên apply ngẫu nhiên 1-3 jobs
      const applyCount = faker.number.int({ min: 1, max: 3 });
      const randomJobsToApply = faker.helpers.arrayElements(jobs, applyCount);

      for (const jobId of randomJobsToApply) {
        const appId = uuidv4();
        const status = faker.helpers.arrayElement([
          "pending",
          "reviewed",
          "accepted",
          "rejected",
        ]);
        await pool.query(
          "INSERT IGNORE INTO applications (id, jobId, userId, cvId, status) VALUES (?, ?, ?, ?, ?)",
          [appId, jobId, cvObj.candidateId, cvObj.cvId, status],
        );
      }

      // Mỗi ứng viên lưu ngẫu nhiên 2-5 jobs
      const bookmarkCount = faker.number.int({ min: 2, max: 5 });
      const randomJobsToBookmark = faker.helpers.arrayElements(
        jobs,
        bookmarkCount,
      );
      for (const jobId of randomJobsToBookmark) {
        const bmId = uuidv4();
        await pool.query(
          "INSERT IGNORE INTO bookmarks (id, userId, jobId) VALUES (?, ?, ?)",
          [bmId, cvObj.candidateId, jobId],
        );
      }
    }

    console.log("✅ HOÀN TẤT! Đã tạo xong toàn bộ dữ liệu mẫu.");
    console.log(
      `📌 Lưu ý: ${candidates.length} CV đã được copy vào thư mục "uploads/"` +
        ` với status "pending". Hãy chạy background worker để trích xuất text và index lên Elasticsearch.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi trong quá trình Seeding:", error);
    process.exit(1);
  }
};

seedDatabase();
