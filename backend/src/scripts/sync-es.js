import pool from "../libs/db.js";
import esClient, { initElasticsearch } from "../libs/elasticsearch.js";
import { bulkIndexJobs, bulkIndexCvs } from "../libs/esBulkSync.js";

async function syncAllData() {
  let failed = false;

  await initElasticsearch();
  console.log("🚀 Bắt đầu đồng bộ dữ liệu cũ lên Elasticsearch...");

  try {
    // 1. Đồng bộ Jobs
    const [jobs] = await pool.query(`
      SELECT 
        j.*, 
        c.name as companyName,
        cat.name as jobTypeName,
        exp.name as experienceLevelName
       FROM jobs j
       LEFT JOIN companies c ON j.companyId = c.id
       LEFT JOIN job_categories cat ON j.jobTypeId = cat.id
       LEFT JOIN experience_levels exp ON j.experienceLevelId = exp.id
    `);

    console.log(`Tiến hành đồng bộ ${jobs.length} công việc (Jobs) qua Bulk API...`);
    const jobStats = await bulkIndexJobs(esClient, jobs);
    console.log(
      `✅ Jobs: ${jobStats.successful} ghi thành công, ${jobStats.failed} lỗi, ${jobStats.time}ms`,
    );
    if (jobStats.failed > 0) {
      console.warn("⚠️ Một số job không index được — kiểm tra log ES.");
    }

    // 2. Đồng bộ CVs
    const [cvData] = await pool.query(`
      SELECT 
        c.id as cvId, c.userId, c.fileName, c.createdAt,
        e.rawText
      FROM cvs c
      JOIN cv_extracted_data e ON c.id = e.cvId
    `);

    console.log(`Tiến hành đồng bộ ${cvData.length} CVs qua Bulk API...`);
    const cvStats = await bulkIndexCvs(esClient, cvData);
    console.log(
      `✅ CVs: ${cvStats.successful} ghi thành công, ${cvStats.failed} lỗi, ${cvStats.time}ms`,
    );
    if (cvStats.failed > 0) {
      console.warn("⚠️ Một số CV không index được — kiểm tra log ES.");
    }
  } catch (error) {
    console.error("❌ Lỗi khi đồng bộ dữ liệu:", error);
  } finally {
    process.exit(0);
  }
}

syncAllData();
