import { v4 as uuidv4 } from "uuid";
import pool from "../libs/db.js";
import esClient from "../libs/elasticsearch.js";
import {
  buildJobSearchBody,
  jobSearchOptions,
} from "../libs/esSearchQueries.js";

// Helper function đồng bộ job lên ES
const syncJobToElasticsearch = async (jobId) => {
  try {
    const [jobs] = await pool.query(
      `SELECT 
        j.*, 
        c.name as companyName,
        cat.name as jobTypeName,
        exp.name as experienceLevelName
       FROM jobs j
       LEFT JOIN companies c ON j.companyId = c.id
       LEFT JOIN job_categories cat ON j.jobTypeId = cat.id
       LEFT JOIN experience_levels exp ON j.experienceLevelId = exp.id
       WHERE j.id = ?`,
      [jobId]
    );

    if (jobs.length > 0) {
      const job = jobs[0];
      await esClient.index({
        index: "jobs",
        id: job.id,
        body: {
          id: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          location: job.location,
          companyName: job.companyName,
          jobTypeName: job.jobTypeName,
          experienceLevelName: job.experienceLevelName,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          createdAt: job.createdAt,
        },
      });
      console.log(`☁️ Đã đồng bộ Job ${job.id} lên Elasticsearch`);
    }
  } catch (error) {
    console.error("Lỗi đồng bộ ES Job:", error);
  }
};

/** Chuẩn hóa salary từ query (string/array/number) — Express 5 + qs có thể trả về không chỉ string. */
function parseSalaryQueryParam(value) {
  if (value === undefined || value === null) {
    return null;
  }

  let raw = value;
  if (Array.isArray(raw)) {
    raw = raw.find(
      (item) =>
        item !== undefined &&
        item !== null &&
        !(typeof item === "string" && item.trim() === ""),
    );
  }

  if (raw === undefined || raw === null) {
    return null;
  }

  if (typeof raw === "string" && raw.trim() === "") {
    return null;
  }

  let n;
  if (typeof raw === "bigint") {
    n = Number(raw);
  } else if (typeof raw === "number") {
    n = raw;
  } else {
    n = Number(String(raw).trim());
  }

  if (!Number.isFinite(n) || n < 0) {
    return null;
  }

  return n;
}

const findRecruiterCompany = async (companyId, recruiterId) => {
  const [companies] = await pool.query(
    "SELECT id FROM companies WHERE id = ? AND recruiterId = ?",
    [companyId, recruiterId],
  );

  return companies[0] || null;
};

// 1. TẠO JOB MỚI
export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      salaryMin,
      salaryMax,
      location,
      jobTypeId,
      experienceLevelId,
      companyId,
    } = req.body;

    // Người tạo job là user đang đăng nhập
    const createdBy = req.user.id;

    if (!title || !description || !companyId) {
      return res.status(400).json({
        message: "Thiếu thông tin bắt buộc (title, description, companyId)",
      });
    }

    const ownedCompany = await findRecruiterCompany(companyId, createdBy);
    if (!ownedCompany) {
      return res.status(403).json({
        message: "Ban chi duoc dang job cho company do minh tao",
      });
    }

    // Validate salary
    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      Number(salaryMin) > Number(salaryMax)
    ) {
      return res.status(400).json({
        message: "salaryMin không được lớn hơn salaryMax",
      });
    }

    const jobId = uuidv4();

    const sql = `
      INSERT INTO jobs
      (
        id,
        title,
        description,
        requirements,
        salaryMin,
        salaryMax,
        location,
        jobTypeId,
        experienceLevelId,
        companyId,
        createdBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      jobId,
      title,
      description,
      requirements || null,
      salaryMin !== undefined ? Number(salaryMin) : null,
      salaryMax !== undefined ? Number(salaryMax) : null,
      location || null,
      jobTypeId || null,
      experienceLevelId || null,
      companyId,
      createdBy,
    ]);

    res.status(201).json({
      message: "Tạo công việc thành công",
      jobId,
    });

    // Đồng bộ background
    syncJobToElasticsearch(jobId);
  } catch (error) {
    console.error("Lỗi tạo job:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// 2. LẤY DANH SÁCH JOB (FILTER + PAGINATION)
export const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Các tham số filter từ frontend
    const {
      q,
      location,
      companyId,
      createdBy,
      expectedSalary: expectedSalaryQuery,
    } = req.query;
    const jobTypeId = req.query.jobTypeId || req.query.jobType;
    const experienceLevelId =
      req.query.experienceLevelId || req.query.experienceLevel;
    const expectedSalary = parseSalaryQueryParam(expectedSalaryQuery);

    const conditions = [];
    const params = [];
    let searchLatency = 0;

    if (q) {
      const startTime = Date.now();
      try {
        const { hits } = await esClient.search({
          index: "jobs",
          size: 500, // Lấy top 500 kết quả liên quan nhất
          ...jobSearchOptions(),
          body: buildJobSearchBody(q),
        });
        searchLatency = Date.now() - startTime;
        
        const jobIds = hits.hits.map(hit => hit._id);
        if (jobIds.length === 0) {
          return res.status(200).json({ data: [], total: 0, page, limit, latencyMs: searchLatency });
        }
        
        conditions.push(`j.id IN (${jobIds.map(() => '?').join(',')})`);
        params.push(...jobIds);
      } catch (esError) {
        console.error("ES Search Error:", esError);
        // Fallback về LIKE nếu ES lỗi
        conditions.push("(j.title LIKE ? OR j.description LIKE ?)");
        params.push(`%${q}%`, `%${q}%`);
      }
    }
    if (location) {
      conditions.push("j.location LIKE ?");
      params.push(`%${location}%`);
    }
    if (jobTypeId) {
      const jobTypeIds = jobTypeId.split(",").map(id => id.trim()).filter(Boolean);
      if (jobTypeIds.length > 0) {
        conditions.push(`j.jobTypeId IN (${jobTypeIds.map(() => "?").join(",")})`);
        params.push(...jobTypeIds);
      }
    }
    if (experienceLevelId) {
      conditions.push("j.experienceLevelId = ?");
      params.push(experienceLevelId);
    }
    if (companyId) {
      conditions.push("j.companyId = ?");
      params.push(companyId);
    }
    if (createdBy) {
      conditions.push("j.createdBy = ?");
      params.push(createdBy);
    }
    if (expectedSalary != null) {
      conditions.push(
        "(COALESCE(j.salaryMin, j.salaryMax) <= ? AND COALESCE(j.salaryMax, j.salaryMin) >= ?)",
      );
      params.push(expectedSalary, expectedSalary);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT 
        j.*, 
        c.name as companyName,
        cat.name as jobTypeName,
        exp.name as experienceLevelName
      FROM jobs j
      LEFT JOIN companies c ON j.companyId = c.id
      LEFT JOIN job_categories cat ON j.jobTypeId = cat.id
      LEFT JOIN experience_levels exp ON j.experienceLevelId = exp.id
      ${whereClause}
      ORDER BY j.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const [data] = await pool.query(sql, [...params, limit, offset]);

    const countSql = `
      SELECT COUNT(*) as total
      FROM jobs j
      ${whereClause}
    `;

    const [[{ total }]] = await pool.query(countSql, params);

    res.status(200).json({
      data,
      total,
      page,
      limit,
      latencyMs: searchLatency
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách job:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// 3. LẤY CHI TIẾT JOB
export const getJobById = async (req, res) => {
  try {
    const targetId = req.params.id;

    const [jobs] = await pool.query(
      `SELECT 
        j.*, 
        c.name as companyName,
        cat.name as jobTypeName,
        exp.name as experienceLevelName
       FROM jobs j
       LEFT JOIN companies c ON j.companyId = c.id
       LEFT JOIN job_categories cat ON j.jobTypeId = cat.id
       LEFT JOIN experience_levels exp ON j.experienceLevelId = exp.id
       WHERE j.id = ?`,
      [targetId],
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy công việc",
      });
    }

    res.status(200).json({
      job: jobs[0],
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết job:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// 4. UPDATE JOB
export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    // Check job tồn tại
    const [jobs] = await pool.query("SELECT createdBy FROM jobs WHERE id = ?", [
      jobId,
    ]);

    if (jobs.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy công việc",
      });
    }

    // Check quyền
    if (jobs[0].createdBy !== userId) {
      return res.status(403).json({
        message: "Bạn không có quyền sửa công việc này",
      });
    }

    const {
      title,
      description,
      requirements,
      salaryMin,
      salaryMax,
      location,
      jobTypeId,
      experienceLevelId,
      companyId,
    } = req.body;

    // Validate salary
    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      Number(salaryMin) > Number(salaryMax)
    ) {
      return res.status(400).json({
        message: "salaryMin không được lớn hơn salaryMax",
      });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }

    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }

    if (requirements !== undefined) {
      updates.push("requirements = ?");
      values.push(requirements);
    }

    if (salaryMin !== undefined) {
      updates.push("salaryMin = ?");
      values.push(Number(salaryMin));
    }

    if (salaryMax !== undefined) {
      updates.push("salaryMax = ?");
      values.push(Number(salaryMax));
    }

    if (location !== undefined) {
      updates.push("location = ?");
      values.push(location);
    }

    if (jobTypeId !== undefined) {
      updates.push("jobTypeId = ?");
      values.push(jobTypeId);
    }

    if (experienceLevelId !== undefined) {
      updates.push("experienceLevelId = ?");
      values.push(experienceLevelId);
    }

    if (companyId !== undefined) {
      const ownedCompany = await findRecruiterCompany(companyId, userId);
      if (!ownedCompany) {
        return res.status(403).json({
          message: "Ban chi duoc gan job vao company do minh tao",
        });
      }

      updates.push("companyId = ?");
      values.push(companyId);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
      });
    }

    values.push(jobId);

    const sql = `
      UPDATE jobs
      SET ${updates.join(", ")}
      WHERE id = ?
    `;

    await pool.query(sql, values);

    res.status(200).json({
      message: "Cập nhật công việc thành công",
    });

    // Đồng bộ background
    syncJobToElasticsearch(jobId);
  } catch (error) {
    console.error("Lỗi cập nhật job:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// 5. DELETE JOB
export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    // Check tồn tại
    const [jobs] = await pool.query("SELECT createdBy FROM jobs WHERE id = ?", [
      jobId,
    ]);

    if (jobs.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy công việc",
      });
    }

    // Check quyền
    if (jobs[0].createdBy !== userId) {
      return res.status(403).json({
        message: "Bạn không có quyền xoá công việc này",
      });
    }

    await pool.query("DELETE FROM jobs WHERE id = ?", [jobId]);

    try {
      await esClient.delete({
        index: "jobs",
        id: jobId,
      });
      console.log(`☁️ Đã xoá Job ${jobId} khỏi Elasticsearch`);
    } catch (e) {
      // Ignored nếu document chưa tồn tại
    }

    res.status(200).json({
      message: "Đã xoá công việc thành công",
    });
  } catch (error) {
    console.error("Lỗi xoá job:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
