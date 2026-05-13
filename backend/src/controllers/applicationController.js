import { v4 as uuidv4 } from "uuid";
import pool from "../libs/db.js";
import { sendCvDownload } from "../utils/cvFile.js";

// 1. NỘP CV ỨNG TUYỂN
export const applyJob = async (req, res) => {
  try {
    const { jobId, cvId } = req.body;
    const userId = req.user.id; // Lấy từ token của Candidate

    if (!jobId || !cvId) {
      return res.status(400).json({ message: "Thiếu jobId hoặc cvId" });
    }

    // Kiểm tra xem CV này có đúng là của User đang đăng nhập không
    const [cvs] = await pool.query(
      "SELECT id FROM cvs WHERE id = ? AND userId = ?",
      [cvId, userId],
    );
    if (cvs.length === 0) {
      return res.status(403).json({
        message:
          "Forbidden: CV không tồn tại hoặc không thuộc quyền sở hữu của bạn",
      });
    }

    // Kiểm tra xem đã apply job này chưa
    const [existing] = await pool.query(
      "SELECT id FROM applications WHERE jobId = ? AND userId = ?",
      [jobId, userId],
    );
    if (existing.length > 0) {
      return res.status(400).json({
        message: "Already applied: Bạn đã ứng tuyển vào công việc này rồi",
      });
    }

    const applicationId = uuidv4();
    const sql =
      "INSERT INTO applications (id, jobId, userId, cvId) VALUES (?, ?, ?, ?)";
    await pool.query(sql, [applicationId, jobId, userId, cvId]);

    res.status(201).json({
      message: "Ứng tuyển thành công!",
      application: { id: applicationId, jobId, cvId, status: "pending" },
    });
  } catch (error) {
    console.error("Lỗi ứng tuyển:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 2. LẤY DANH SÁCH ỨNG TUYỂN (Thông minh theo Role)
export const getApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (role === "candidate") {
      // Ứng viên: Lấy lịch sử các job mình đã nộp
      const sql = `
        SELECT a.*, j.title as jobTitle, c.name as companyName,
          cv.fileName as cvFileName
        FROM applications a
        JOIN jobs j ON a.jobId = j.id
        JOIN companies c ON j.companyId = c.id
        JOIN cvs cv ON a.cvId = cv.id
        WHERE a.userId = ? 
        ORDER BY a.appliedAt DESC LIMIT ? OFFSET ?
      `;
      const params = [userId, limit, offset];

      const [[{ total }]] = await pool.query(
        "SELECT COUNT(*) AS total FROM applications WHERE userId = ?",
        [userId],
      );

      const [data] = await pool.query(sql, params);
      return res.status(200).json({ data, total, page, limit });
    }

    if (role === "recruiter") {
      // Nhà tuyển dụng: ứng viên đã nộp vào các job do recruiter tạo
      const sql = `
        SELECT a.*, u.name as candidateName, u.email as candidateEmail,
          cv.filePath, cv.fileName as cvFileName,
          j.title as jobTitle, c.name as companyName
        FROM applications a
        JOIN jobs j ON a.jobId = j.id
        JOIN companies c ON j.companyId = c.id
        JOIN users u ON a.userId = u.id
        JOIN cvs cv ON a.cvId = cv.id
        WHERE j.createdBy = ? 
        ORDER BY a.appliedAt DESC LIMIT ? OFFSET ?
      `;
      const params = [userId, limit, offset];

      const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) AS total FROM applications a
         JOIN jobs j ON a.jobId = j.id
         WHERE j.createdBy = ?`,
        [userId],
      );

      const [data] = await pool.query(sql, params);
      return res.status(200).json({ data, total, page, limit });
    }

    return res.status(403).json({
      message: "Forbidden: Vai trò không được hỗ trợ",
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách ứng tuyển:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 3. CẬP NHẬT TRẠNG THÁI ỨNG TUYỂN (Chỉ dành cho Recruiter)
export const updateApplicationStatus = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id; // ID của Recruiter đang đăng nhập

    // 1. Kiểm tra trạng thái gửi lên có hợp lệ không
    const validStatuses = ["pending", "reviewed", "accepted", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Trạng thái không hợp lệ. Chỉ chấp nhận: pending, reviewed, accepted, rejected",
      });
    }

    // 2. Lấy thông tin ứng tuyển và kiểm tra quyền sở hữu của Recruiter
    // JOIN bảng applications với jobs để biết ai là người tạo ra công việc này
    const checkSql = `
      SELECT a.id, j.createdBy 
      FROM applications a
      JOIN jobs j ON a.jobId = j.id
      WHERE a.id = ?
    `;
    const [applications] = await pool.query(checkSql, [applicationId]);

    if (applications.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn ứng tuyển này" });
    }

    // Chốt chặn bảo mật: Recruiter có phải là người tạo ra job này không?
    if (applications[0].createdBy !== userId) {
      return res.status(403).json({
        message:
          "Forbidden: Bạn không có quyền thay đổi trạng thái của đơn ứng tuyển này",
      });
    }

    // 3. Tiến hành cập nhật trạng thái
    await pool.query(
      "UPDATE applications SET status = ?, reviewedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [status, applicationId],
    );

    res.status(200).json({
      message: "Cập nhật trạng thái thành công!",
      applicationId,
      newStatus: status,
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái ứng tuyển:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 4. TẢI CV CỦA ỨNG VIÊN (Recruiter đã tạo job tương ứng)
export const downloadApplicationCv = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const recruiterId = req.user.id;

    const [rows] = await pool.query(
      `SELECT cv.filePath, cv.fileName
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       INNER JOIN cvs cv ON a.cvId = cv.id
       WHERE a.id = ? AND j.createdBy = ?`,
      [applicationId, recruiterId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy ứng tuyển hoặc bạn không có quyền tải CV này.",
      });
    }

    const { filePath, fileName } = rows[0];
    return sendCvDownload(res, filePath, fileName);
  } catch (error) {
    console.error("Lỗi tải CV ứng viên:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
