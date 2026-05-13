import { v4 as uuidv4 } from "uuid";
import pool from "../libs/db.js";
import { cvQueue } from "../libs/queue.js";
import { sendCvDownload } from "../utils/cvFile.js";
import esClient from "../libs/elasticsearch.js";
import {
  buildCvSearchBody,
  cvSearchOptions,
} from "../libs/esSearchQueries.js";

// 1. UPLOAD CV
export const uploadCV = async (req, res) => {
  try {
    // req.file được sinh ra bởi thư viện Multer
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "File lỗi: Vui lòng tải lên một file" });
    }

    const userId = req.user.id; // Lấy từ verifyToken
    const cvId = uuidv4();
    const { originalname, path, size } = req.file;
    const status = "pending"; // Trạng thái chờ xử lý (Extract Text)

    const sql = `
      INSERT INTO cvs (id, userId, fileName, filePath, fileSize, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.query(sql, [cvId, userId, originalname, path, size, status]);

    // Chúng ta truyền cvId và filePath để Worker biết cần đọc file nào
    await cvQueue.add("extract-cv-text", {
      cvId: cvId,
      filePath: path,
    });

    // Chúng ta sẽ làm phần Worker ở bước sau.

    res
      .status(201)
      .json({ cvId, status, message: "Upload CV thành công, đang chờ xử lý" });
  } catch (error) {
    console.error("Lỗi upload CV:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 2. LẤY DANH SÁCH CV CỦA USER (Chỉ lấy của người đang đăng nhập)
export const getCVs = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const sql =
      "SELECT * FROM cvs WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?";
    const [data] = await pool.query(sql, [userId, limit, offset]);

    res.status(200).json({ data, page, limit });
  } catch (error) {
    console.error("Lỗi lấy danh sách CV:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 3. LẤY CHI TIẾT 1 CV
export const getCVById = async (req, res) => {
  try {
    const cvId = req.params.id;
    const userId = req.user.id;

    // Đảm bảo user chỉ xem được CV của chính họ
    const [cvs] = await pool.query(
      "SELECT * FROM cvs WHERE id = ? AND userId = ?",
      [cvId, userId],
    );

    if (cvs.length === 0) {
      return res.status(404).json({ message: "Not found: Không tìm thấy CV" });
    }

    res.status(200).json({ cv: cvs[0] });
  } catch (error) {
    console.error("Lỗi lấy chi tiết CV:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 4. TAI CV CUA USER DANG DANG NHAP
export const downloadMyCV = async (req, res) => {
  try {
    const cvId = req.params.id;
    const userId = req.user.id;

    const [cvs] = await pool.query(
      "SELECT filePath, fileName FROM cvs WHERE id = ? AND userId = ?",
      [cvId, userId],
    );

    if (cvs.length === 0) {
      return res.status(404).json({ message: "Khong tim thay CV" });
    }

    const { filePath, fileName } = cvs[0];
    return sendCvDownload(res, filePath, fileName);
  } catch (error) {
    console.error("Loi tai CV:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 4b. RECRUITER TẢI CV ỨNG VIÊN (chỉ khi CV đã dùng để nộp đơn vào job do recruiter tạo)
export const downloadCandidateCvAsRecruiter = async (req, res) => {
  try {
    const cvId = req.params.id;
    const recruiterId = req.user.id;

    const [rows] = await pool.query(
      `SELECT cv.filePath, cv.fileName
       FROM cvs cv
       INNER JOIN applications a ON a.cvId = cv.id
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE cv.id = ? AND j.createdBy = ?
       LIMIT 1`,
      [cvId, recruiterId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          "Không tìm thấy CV hoặc ứng viên chưa nộp đơn vào công việc của bạn.",
      });
    }

    const { filePath, fileName } = rows[0];
    return sendCvDownload(res, filePath, fileName);
  } catch (error) {
    console.error("Loi tai CV ung vien (recruiter):", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 5. TIM KIEM CV (FULL-TEXT SEARCH)
export const searchCVs = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const recruiterId = req.user.id;
    const from = (parseInt(page) - 1) * parseInt(limit);

    const startTime = Date.now(); // Để đo latency

    const [accessibleCvs] = await pool.query(
      `SELECT DISTINCT a.cvId
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE j.createdBy = ?`,
      [recruiterId],
    );
    const accessibleCvIds = accessibleCvs.map((row) => row.cvId);

    if (accessibleCvIds.length === 0) {
      return res.status(200).json({
        data: [],
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        latencyMs: 0,
      });
    }

    const { hits } = await esClient.search({
      index: "cvs",
      from: from,
      size: parseInt(limit),
      ...cvSearchOptions(),
      body: buildCvSearchBody(q, { cvIds: accessibleCvIds }),
    });

    const latencyMs = Date.now() - startTime;
    
    const results = hits.hits.map(hit => ({
      cvId: hit._source.cvId,
      userId: hit._source.userId,
      fileName: hit._source.fileName,
      createdAt: hit._source.createdAt,
      score: hit._score,
      highlights: hit.highlight ? hit.highlight.rawText : []
    }));

    res.status(200).json({
      data: results,
      total: hits.total.value,
      page: parseInt(page),
      limit: parseInt(limit),
      latencyMs: latencyMs
    });
  } catch (error) {
    console.error("Lỗi tìm kiếm CV:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

