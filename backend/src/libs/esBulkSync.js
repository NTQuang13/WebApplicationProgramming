import "dotenv/config";

const flushBytes = () =>
  Math.max(256_000, Number(process.env.ES_BULK_FLUSH_BYTES || 5_000_000));

const bulkConcurrency = () =>
  Math.max(1, Number(process.env.ES_BULK_CONCURRENCY || 5));

/**
 * Đồng bộ hàng loạt document lên ES bằng Bulk API (helpers.bulk: chunk + song song).
 */
export async function bulkIndexJobs(client, jobs) {
  if (!jobs.length) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      time: 0,
      bytes: 0,
      retry: 0,
      noop: 0,
      aborted: false,
    };
  }

  return client.helpers.bulk({
    datasource: jobs,
    onDocument: (job) => [
      { index: { _index: "jobs", _id: job.id } },
      {
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
    ],
    flushBytes: flushBytes(),
    concurrency: bulkConcurrency(),
    refreshOnCompletion: "jobs",
  });
}

export async function bulkIndexCvs(client, cvRows) {
  if (!cvRows.length) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      time: 0,
      bytes: 0,
      retry: 0,
      noop: 0,
      aborted: false,
    };
  }

  return client.helpers.bulk({
    datasource: cvRows,
    onDocument: (cv) => [
      { index: { _index: "cvs", _id: cv.cvId } },
      {
        cvId: cv.cvId,
        userId: cv.userId,
        fileName: cv.fileName,
        rawText: cv.rawText,
        createdAt: cv.createdAt,
      },
    ],
    flushBytes: flushBytes(),
    concurrency: Math.min(bulkConcurrency(), 3),
    refreshOnCompletion: "cvs",
  });
}
