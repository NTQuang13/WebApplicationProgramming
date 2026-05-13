import { Queue } from "bullmq";
import IORedis from "ioredis";
import "dotenv/config";

// Kết nối tới Redis (Mặc định ở localhost:6379)
const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
);

// Tạo hàng đợi chuyên xử lý CV
export const cvQueue = new Queue("cv-queue", { connection });

console.log("✅ BullMQ Queue 'cv-queue' đã được khởi tạo!");
