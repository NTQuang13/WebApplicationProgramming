import { Client } from '@elastic/elasticsearch';
import 'dotenv/config';

// Khởi tạo Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  },
  tls: {
    rejectUnauthorized: false // Bỏ qua lỗi chứng chỉ SSL ở localhost (nếu có)
  }
});

// Khởi tạo các index và mapping cho jobs và cvs
export const initElasticsearch = async () => {
  try {
    const ping = await esClient.ping();
    if (!ping) {
      console.error('❌ Không thể kết nối tới Elasticsearch');
      return;
    }
    console.log('✅ Đã kết nối tới Elasticsearch thành công');

    // Tạo Index cho Jobs
    const jobIndexExists = await esClient.indices.exists({ index: 'jobs' });
    if (!jobIndexExists) {
      await esClient.indices.create({
        index: 'jobs',
        body: {
          settings: {
            analysis: {
              analyzer: {
                // Analyzer đơn giản, có thể nâng cấp thêm vietnamese analyzer nếu cài plugin
                default: {
                  type: 'standard'
                }
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: { type: 'text' },
              description: { type: 'text' },
              requirements: { type: 'text' },
              location: { type: 'text' },
              companyName: { type: 'text' },
              jobTypeName: { type: 'keyword' },
              experienceLevelName: { type: 'keyword' },
              salaryMin: { type: 'double' },
              salaryMax: { type: 'double' },
              createdAt: { type: 'date' }
            }
          }
        }
      });
      console.log('✅ Đã tạo Elasticsearch Index: jobs');
    }

    // Tạo Index cho CVs
    const cvIndexExists = await esClient.indices.exists({ index: 'cvs' });
    if (!cvIndexExists) {
      await esClient.indices.create({
        index: 'cvs',
        body: {
          mappings: {
            properties: {
              cvId: { type: 'keyword' },
              userId: { type: 'keyword' },
              fileName: { type: 'text' },
              rawText: { type: 'text' },
              createdAt: { type: 'date' }
            }
          }
        }
      });
      console.log('✅ Đã tạo Elasticsearch Index: cvs');
    }

  } catch (error) {
    console.error('❌ Lỗi khởi tạo Elasticsearch:', error.message);
  }
};

export default esClient;
