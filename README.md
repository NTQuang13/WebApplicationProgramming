# Smart Job Portal with Document Search

Hệ thống tuyển dụng thông minh tích hợp tìm kiếm CV nâng cao bằng Elasticsearch và xử lý hàng đợi với Redis/BullMQ.

---

## 🚀 Công nghệ sử dụng

- **Frontend**: React + Vite, TailwindCSS, Zustand (State Management)
- **Backend**: Node.js (Express), MySQL (Lưu trữ chính)
- **Tìm kiếm**: Elasticsearch (Full-text search cho CV)
- **Xử lý nền**: BullMQ + Redis (Xử lý trích xuất text từ file PDF)

---

## 📋 Yêu cầu hệ thống

Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt:

- **Node.js**: Phiên bản 18 hoặc 20+
- **MySQL**: Phiên bản 8.0+
- **Redis**: Phiên bản 6+
- **Docker**: Để chạy Elasticsearch nhanh chóng

---

## 🛠️ Cài đặt và Thiết lập

### 1. Khởi động Elasticsearch (Docker)

Dự án sử dụng Docker để đơn giản hóa việc cài đặt Elasticsearch. Tại thư mục gốc, chạy:

```bash
docker-compose up -d
```

### 2. Thiết lập Backend

Di chuyển vào thư mục backend và cài đặt các dependencies:

```bash
cd backend
npm install
```

Tạo file `.env` bằng cách copy từ file mẫu:

```bash
cp .env.example .env
```

_Lưu ý: Hãy cập nhật thông tin kết nối MySQL (`DB_USER`, `DB_PASS`) trong file `.env` của bạn._

**Mẹo:** Để tạo một chuỗi ngẫu nhiên an toàn cho `ACCESS_TOKEN_SECRET`, bạn có thể chạy lệnh sau trong terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Sau đó copy chuỗi được in ra và gán vào biến `ACCESS_TOKEN_SECRET`.

### 3. Khởi tạo Cơ sở dữ liệu

Chạy các lệnh sau để tạo bảng và nạp dữ liệu mẫu:

```bash
# Tạo các bảng trong MySQL
npm run db:init

# Nạp dữ liệu mẫu (Công ty, Danh mục, Job, User...)
npm run db:seed

# Đồng bộ dữ liệu hiện có sang Elasticsearch
npm run db:sync-es
```

### 4. Thiết lập Frontend

Di chuyển vào thư mục frontend và cài đặt dependencies:

```bash
cd ../frontend
npm install
```

---

## 🏃 Chạy ứng dụng

Hệ thống cần chạy 3 tiến trình riêng biệt để hoạt động đầy đủ:

### 1. API Server (Backend)

```bash
cd backend
npm run dev
```

_API sẽ chạy tại: [http://localhost:3000](http://localhost:3000)_

### 2. CV Worker (Xử lý file PDF)

Tiến trình này chịu trách nhiệm đọc file CV được upload, trích xuất text và đẩy vào Elasticsearch.

```bash
cd backend
npm run worker
```

### 3. Web App (Frontend)

```bash
cd frontend
npm run dev
```

_Ứng dụng sẽ chạy tại: [http://localhost:5173](http://localhost:5173)_

---

## 📄 Tài liệu API

Dự án cung cấp đặc tả API chuẩn Swagger. Bạn có thể xem và test API tại:

- File đặc tả: `backend/swagger.yaml`
- Hướng dẫn test: Xem chi tiết trong mục **Test API** của tài liệu hướng dẫn cũ hoặc import vào Postman.

---

## 📁 Cấu trúc thư mục

```text
.
├── backend             # Mã nguồn phía Server (Node.js)
│   ├── src/            # Logic xử lý chính
│   ├── scripts/        # Các script bổ trợ (Seed, Sync ES)
│   └── swagger.yaml    # Đặc tả API
├── frontend            # Mã nguồn phía Client (React)
│   ├── src/            # Components, Hooks, Stores
│   └── public/         # Tài sản tĩnh
├── docker-compose.yml  # Cấu hình Elasticsearch
└── README.md           # Hướng dẫn này
```

---

## 💡 Ghi chú quan trọng

- **Upload CV**: Để tìm kiếm được nội dung trong CV, bạn cần đảm bảo cả `Redis` và `Worker` đều đang chạy khi thực hiện upload.
- **Quyền hạn**: Chức năng tìm kiếm CV nâng cao (Elasticsearch) chỉ dành cho tài khoản có role `RECRUITER`.
- **Dữ liệu**: Nếu Elasticsearch bị mất dữ liệu, hãy chạy `npm run db:sync-es` để đồng bộ lại từ MySQL.

---
