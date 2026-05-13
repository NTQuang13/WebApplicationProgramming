import pool from "../libs/db.js";
import { cvQueue } from "../libs/queue.js";
import { resolveCvAbsolutePath } from "../utils/cvFile.js";
import "dotenv/config";

async function dedupeExtractedData() {
  const [before] = await pool.query(
    "SELECT COUNT(*) AS total, COUNT(DISTINCT cvId) AS distinctCvId FROM cv_extracted_data",
  );
  const beforeTotal = before?.[0]?.total ?? 0;
  const beforeDistinct = before?.[0]?.distinctCvId ?? 0;

  await pool.query(`
    DELETE e1
    FROM cv_extracted_data e1
    INNER JOIN cv_extracted_data e2
      ON e1.cvId = e2.cvId
     AND (
          COALESCE(e1.lastProcessedAt, e1.createdAt) < COALESCE(e2.lastProcessedAt, e2.createdAt)
          OR (
              COALESCE(e1.lastProcessedAt, e1.createdAt) = COALESCE(e2.lastProcessedAt, e2.createdAt)
              AND e1.id < e2.id
          )
        )
  `);

  const [after] = await pool.query(
    "SELECT COUNT(*) AS total, COUNT(DISTINCT cvId) AS distinctCvId FROM cv_extracted_data",
  );
  const afterTotal = after?.[0]?.total ?? 0;
  const afterDistinct = after?.[0]?.distinctCvId ?? 0;
  const removed = beforeTotal - afterTotal;

  console.log(
    `Da don ${removed} dong trung cv_extracted_data. Con lai total=${afterTotal}, distinctCvId=${afterDistinct}.`,
  );

  try {
    await pool.query(
      "ALTER TABLE cv_extracted_data ADD UNIQUE KEY uq_cvId (cvId)",
    );
    console.log("Da them unique key uq_cvId cho cv_extracted_data.");
  } catch (error) {
    if (error?.code === "ER_DUP_KEYNAME") {
      console.log("Unique key uq_cvId da ton tai.");
      return;
    }
    throw error;
  }
}

async function enqueuePendingCVs() {
  try {
    await dedupeExtractedData();

    const [cvs] = await pool.query(`
      SELECT c.id, c.filePath
      FROM cvs c
      LEFT JOIN cv_extracted_data e ON e.cvId = c.id
      WHERE e.cvId IS NULL
        AND c.filePath IS NOT NULL
    `);

    let queued = 0;
    let skipped = 0;

    for (const cv of cvs) {
      if (!resolveCvAbsolutePath(cv.filePath)) {
        skipped += 1;
        console.warn(`Bo qua CV ${cv.id}: duong dan file khong hop le (${cv.filePath})`);
        continue;
      }

      await cvQueue.add("extract-cv-text", {
        cvId: cv.id,
        filePath: cv.filePath,
      });
      queued += 1;
    }

    console.log(`Da dua ${queued} CV vao hang doi xu ly. Bo qua ${skipped} CV.`);
    process.exit(0);
  } catch (error) {
    console.error("Loi khi dua CV vao hang doi xu ly:", error);
    process.exit(1);
  }
}

enqueuePendingCVs();
