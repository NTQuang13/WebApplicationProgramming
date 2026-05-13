import fs from "fs";
import { Worker, UnrecoverableError } from "bullmq";
import IORedis from "ioredis";
import PDFParser from "pdf2json";
import { v4 as uuidv4 } from "uuid";
import pool from "../libs/db.js";
import esClient from "../libs/elasticsearch.js";
import { resolveCvAbsolutePath } from "../utils/cvFile.js";
import "dotenv/config";

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
);

const CV_WORKER_CONCURRENCY = Math.max(
  1,
  parseInt(process.env.CV_WORKER_CONCURRENCY || "4", 10),
);

console.log(
  `👷 Worker xử lý CV đang chạy (concurrency=${CV_WORKER_CONCURRENCY}) và chờ việc...`,
);

// --- HÀM PHỤ TRỢ: Trích xuất Text bằng thư viện mới ---
const extractTextFromPDF = (filePath) => {
  return new Promise((resolve, reject) => {
    // Khởi tạo parser. Tham số '1' báo cho thư viện biết ta chỉ cần trích xuất Text thô
    const pdfParser = new PDFParser(null, 1);

    // Lắng nghe sự kiện lỗi
    pdfParser.on("pdfParser_dataError", (errData) =>
      reject(errData.parserError),
    );

    // Lắng nghe sự kiện đọc xong
    pdfParser.on("pdfParser_dataReady", () => {
      // Lấy toàn bộ chữ, thay thế các dấu xuống dòng bằng khoảng trắng cho sạch dữ liệu
      const rawText = pdfParser
        .getRawTextContent()
        .replace(/\r\n/g, " ")
        .trim();
      resolve(rawText);
    });

    // Bắt đầu đọc file
    pdfParser.loadPDF(filePath);
  });
};

// --- LOGIC CHÍNH CỦA WORKER ---
const worker = new Worker(
  "cv-queue",
  async (job) => {
    const { cvId, filePath } = job.data;
    console.log(`[Job ${job.id}] Đang bắt đầu xử lý CV: ${cvId}`);

    let txStarted = false;
    try {
      // 1. Chuẩn hoá & validate đường dẫn file
      const resolvedFilePath = resolveCvAbsolutePath(filePath);
      if (!resolvedFilePath) {
        throw new UnrecoverableError(
          `Duong dan CV khong hop le hoặc nam ngoai thu muc uploads: ${filePath}`,
        );
      }
      if (!fs.existsSync(resolvedFilePath)) {
        throw new UnrecoverableError(
          `ENOENT: khong tim thay file PDF: ${resolvedFilePath}`,
        );
      }

      const extractedText = await extractTextFromPDF(resolvedFilePath);

      // 2. Idempotent theo cvId:
      // - Chỉ giữ 1 record trong cv_extracted_data cho mỗi cvId
      // - Nếu cv_extracted_data đã tồn tại (do retry/queue trùng), worker sẽ update record mới nhất và xoá các bản trùng.
      await pool.query("START TRANSACTION");
      txStarted = true;
      const [cvsRows] = await pool.query(
        "SELECT id FROM cvs WHERE id = ? FOR UPDATE",
        [cvId],
      );
      if (!cvsRows || cvsRows.length === 0) {
        await pool.query("ROLLBACK");
        throw new UnrecoverableError(`CV không tồn tại trong bảng cvs: ${cvId}`);
      }

      const [existingRows] = await pool.query(
        `
          SELECT id
          FROM cv_extracted_data
          WHERE cvId = ?
          ORDER BY COALESCE(lastProcessedAt, createdAt) DESC, id DESC
          LIMIT 1
        `,
        [cvId],
      );

      if (existingRows && existingRows.length > 0) {
        const keepId = existingRows[0].id;

        // Xoá các bản trùng (giữ lại 1 bản gần nhất)
        await pool.query(
          "DELETE FROM cv_extracted_data WHERE cvId = ? AND id <> ?",
          [cvId, keepId],
        );

        await pool.query(
          `
            UPDATE cv_extracted_data
            SET rawText = ?,
                lastProcessedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
          [extractedText, keepId],
        );
      } else {
        const extractId = uuidv4();
        await pool.query(
          `
            INSERT INTO cv_extracted_data (id, cvId, rawText, lastProcessedAt)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `,
          [extractId, cvId, extractedText],
        );
      }

      // 3. Cập nhật trạng thái thành 'completed'
      await pool.query("UPDATE cvs SET status = 'completed' WHERE id = ?", [
        cvId,
      ]);

      await pool.query("COMMIT");

      // 4. Đồng bộ lên Elasticsearch
      const [cvInfo] = await pool.query(
        "SELECT userId, fileName FROM cvs WHERE id = ?",
        [cvId]
      );
      if (cvInfo.length > 0) {
        await esClient.index({
          index: "cvs",
          id: cvId, // Dùng cvId làm ID của document luôn
          body: {
            cvId: cvId,
            userId: cvInfo[0].userId,
            fileName: cvInfo[0].fileName,
            rawText: extractedText,
            createdAt: new Date().toISOString(),
          },
        });
        console.log(`[Job ${job.id}] ☁️ Đã đồng bộ CV ${cvId} lên Elasticsearch`);
      }

      console.log(
        `[Job ${job.id}] ✅ Đã xử lý xong CV: ${cvId} (Kích thước text: ${extractedText.length} ký tự)`,
      );
    } catch (error) {
      console.error(`[Job ${job.id}] ❌ Lỗi khi xử lý CV ${cvId}:`, error);
      // Nếu lỗi xảy ra sau khi START TRANSACTION, cố gắng rollback để tránh transaction treo.
      try {
        if (txStarted) {
          await pool.query("ROLLBACK");
        }
      } catch {
        // ignore
      }
      // Nếu rớt, báo lỗi vào DB
      await pool.query("UPDATE cvs SET status = 'failed' WHERE id = ?", [cvId]);
      throw error;
    }
  },
  { connection, concurrency: CV_WORKER_CONCURRENCY },
);
