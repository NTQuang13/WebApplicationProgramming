# Smart Job Portal with Document Search

Ứng dụng web tuyển dụng gồm:
- `frontend`: React + Vite
- `backend`: Express + MySQL
- CV search: Elasticsearch
- Xử lý CV nền: BullMQ + Redis

README này tập trung vào 2 việc:
1. Cài đặt và chạy dự án trên máy local
2. Test API bằng `backend/swagger.yaml`

## 1. Yêu cầu hệ thống

Bạn cần cài sẵn:
- [Node.js](https://nodejs.org/) 18+ (khuyên dùng 20+)
- [MySQL](https://www.mysql.com/)
- [Redis](https://redis.io/)
- [Elasticsearch](https://www.elastic.co/elasticsearch/)

Các cổng mặc định đang dùng trong project:
- Frontend: `5173`
- Backend API: `3000`
- MySQL: `3306`
- Redis: `6379`
- Elasticsearch: `9200`

## 2. Cấu trúc thư mục

```text
.
├─ backend
│  ├─ src
│  └─ swagger.yaml
├─ frontend
└─ README.md
```

## 3. Cài đặt backend

### 3.1. Tạo file môi trường

Tạo file `backend/.env` với nội dung mẫu:

```env
PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=job_portal

ACCESS_TOKEN_SECRET=your_super_secret_key

REDIS_URL=redis://127.0.0.1:6379

ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme

ES_SEARCH_TIMEOUT=5s
ES_SEARCH_TRACK_TOTAL_HITS=10000
CV_WORKER_CONCURRENCY=4
```

Để tạo nhanh `ACCESS_TOKEN_SECRET`, bạn có thể chạy:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.2. Cài package backend

```bash
cd backend
npm install
```

### 3.3. Khởi tạo database

Lệnh sau sẽ tự tạo database và các bảng:

```bash
npm run db:init
```

Nếu bạn muốn nạp dữ liệu mẫu:

```bash
npm run db:seed
```

Nếu bạn đã có CV trong database nhưng Elasticsearch chưa có dữ liệu index, có thể sync lại:

```bash
npm run db:sync-es
```

## 4. Chạy backend

Project backend nên chạy bằng 2 tiến trình riêng:

### Terminal 1: API server

```bash
cd backend
npm run dev
```

### Terminal 2: CV worker

```bash
cd backend
npm run worker
```

Khi backend chạy thành công:
- API base URL: [http://localhost:3000](http://localhost:3000)

## 5. Cài đặt và chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Khi frontend chạy thành công:
- App URL: [http://localhost:5173](http://localhost:5173)

## 6. Trình tự khởi động đầy đủ

Nếu là lần đầu chạy project, nên theo thứ tự này:

1. Khởi động MySQL
2. Khởi động Redis
3. Khởi động Elasticsearch
4. Chạy `backend/npm install`
5. Chạy `npm run db:init`
6. Chạy `npm run db:seed` nếu cần dữ liệu mẫu
7. Chạy `npm run dev` trong `backend`
8. Chạy `npm run worker` trong `backend`
9. Chạy `npm install` và `npm run dev` trong `frontend`

## 7. Test API bằng Swagger

File test API nằm tại:
- [backend/swagger.yaml](D:\Web\WebApplicationProgramming\backend\swagger.yaml)

Bạn có thể test theo một trong hai cách:

### Cách 1: Swagger Editor

1. Mở [https://editor.swagger.io/](https://editor.swagger.io/)
2. Xóa nội dung mẫu
3. Dán toàn bộ nội dung file `backend/swagger.yaml`
4. Đảm bảo backend đang chạy ở `http://localhost:3000`
5. Dùng `Try it out` để gọi API

### Cách 2: Import vào Postman

1. Mở Postman
2. Chọn `Import`
3. Import file `backend/swagger.yaml`
4. Tạo request trực tiếp từ collection sinh ra

## 8. Luồng test API khuyến nghị

Để test đầy đủ mà ít lỗi nhất, nên đi theo trình tự sau:

### Auth

1. `POST /api/auth/signup`
2. `POST /api/auth/signin`
3. Copy `accessToken`
4. Với Swagger/Postman, thêm header:

```http
Authorization: Bearer <accessToken>
```

### Data nền

1. `GET /api/categories`
2. `GET /api/experience-levels`

### Recruiter flow

1. Đăng nhập bằng tài khoản recruiter
2. `POST /api/companies`
3. `POST /api/jobs`
4. `GET /api/jobs`
5. `GET /api/applications`
6. `GET /api/cvs/search?q=uit`

### Candidate flow

1. Đăng nhập bằng tài khoản candidate
2. `POST /api/cvs/upload`
3. Chờ worker xử lý
4. `GET /api/cvs`
5. `POST /api/applications`
6. `GET /api/bookmarks`
7. `POST /api/bookmarks`

## 9. Ghi chú quan trọng khi test

### JWT / Bearer token

Các route protected yêu cầu:

```http
Authorization: Bearer <accessToken>
```

### Refresh token

- `POST /api/auth/signin` trả `refreshToken` qua cookie
- `POST /api/auth/refresh` cần cookie đó
- Trong Swagger Editor online, test cookie có thể không tiện bằng Postman

### Upload CV

- Field upload phải tên là `file`
- Giới hạn tối đa `5MB`
- Upload xong chỉ mới lưu file và đẩy job vào queue
- Worker phải đang chạy thì text CV mới được xử lý để search

### CV Search

- API: `GET /api/cvs/search`
- Chỉ recruiter mới dùng được
- Kết quả chỉ gồm các CV thuộc ứng viên đã apply vào job do recruiter hiện tại tạo
- Elasticsearch phải chạy ổn và có dữ liệu index

## 10. Một số lệnh hữu ích

Trong thư mục `backend`:

```bash
npm run dev
npm run worker
npm run db:init
npm run db:seed
npm run db:sync-es
npm run cvs:enqueue-pending
npm run deploy:prepare
npm run demo:reset
```

Trong thư mục `frontend`:

```bash
npm run dev
npm run build
npm run preview
```

## 11. Xử lý lỗi thường gặp

### Backend chạy nhưng search CV không ra kết quả

Kiểm tra:
- Elasticsearch đã chạy chưa
- Worker có đang chạy không
- CV đã được upload và xử lý xong chưa
- Recruiter có quyền xem CV đó không

### Upload CV xong nhưng không tìm kiếm được

Thường là một trong các nguyên nhân:
- Worker chưa chạy
- Redis chưa chạy
- Elasticsearch chưa có index hoặc chưa sync

Bạn có thể thử:

```bash
cd backend
npm run cvs:enqueue-pending
npm run db:sync-es
```

### Lỗi database

Kiểm tra lại:
- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- MySQL service đã chạy chưa

## 12. Tài liệu liên quan

- API spec: [backend/swagger.yaml](D:\Web\WebApplicationProgramming\backend\swagger.yaml)
- Backend entry: [backend/src/server.js](D:\Web\WebApplicationProgramming\backend\src\server.js)
- Frontend app: [frontend/src/App.tsx](D:\Web\WebApplicationProgramming\frontend\src\App.tsx)
