# Hướng dẫn Setup & Khởi chạy Toàn bộ Hệ thống (LifeLine Project)

Tài liệu này hướng dẫn cách khởi chạy **tất cả 3 dịch vụ** (Python AI Service, Node.js Backend Core, React Frontend) ở môi trường Local để chuẩn bị cho buổi Demo.

---

## 1. Yêu cầu hệ thống (Prerequisites)
- **Node.js**: Phiên bản 18.x trở lên.
- **Python**: Phiên bản 3.10 trở lên.
- **MongoDB**: MongoDB local hoặc MongoDB Atlas URI.
- **Google Gemini API Key**: Dùng cho dịch vụ AI Chatbot (Lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey)).
- **Tài khoản Cloudinary**: Dùng cho tính năng upload ảnh đại diện.

---

## 2. Dịch vụ 1: Setup Python AI Service (`ai-service`)

Dịch vụ AI Chatbot & RAG Engine phụ trách xử lý tư vấn hiến máu thông minh.

1. Mở Terminal mới thứ nhất, di chuyển vào thư mục `ai-service`:
   ```bash
   cd ai-service
   ```
2. Tạo và kích hoạt môi trường ảo Python (Virtual Environment):
   - **Windows PowerShell**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Git Bash / Linux / macOS**:
     ```bash
     python -m venv venv
     source venv/bin/activate
     ```
3. Cài đặt các thư viện phụ thuộc:
   ```bash
   pip install -r requirements.txt
   ```
4. Cấu hình biến môi trường (`.env`):
   Tạo file `.env` trong thư mục `ai-service`:
   ```env
   GEMINI_API_KEY=AIzaSy... (API Key của bạn từ Google AI Studio)
   MONGODB_URI=mongodb+srv://... (MongoDB URI chứa database LifeLine)
   AI_SERVICE_TOKEN_SECRET_CURRENT=super-secret-local-dev-key
   AI_SERVICE_TOKEN_SECRET_PREVIOUS=optional_previous_string_for_rotation
   AI_SERVICE_TOKEN_KID=local-dev-key-1
   GEMINI_MODEL=gemini-2.0-flash
   GEMINI_FALLBACK_MODEL=gemini-2.0-flash-lite
   ```
5. Khởi động AI Service:
   ```bash
   python main.py
   ```
   *Terminal báo `Uvicorn running on http://127.0.0.1:8000` và tải xong mô hình là thành công.*

---

## 3. Dịch vụ 2: Setup Node.js Backend Core (`src/backend-core`)

Dịch vụ Backend chính xử lý Authentication, Booking, SOS, Campaign, Notification và Proxy sang AI Service.

1. Mở Terminal thứ hai (giữ nguyên Terminal AI Service), di chuyển vào thư mục backend:
   ```bash
   cd src/backend-core
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường (`.env`):
   Tạo file `.env` trong thư mục `backend-core`:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=sanguineteam
   SENDER_EMAIL=noreply.lifeline@gmail.com
   FRONTEND_URL=http://localhost:5173
   
   CLOUDINARY_CLOUD_NAME=tên_cloud_của_bạn
   CLOUDINARY_API_KEY=api_key_của_bạn
   CLOUDINARY_API_SECRET=api_secret_của_bạn

   AI_SERVICE_TOKEN_SECRET_CURRENT=super-secret-local-dev-key
   AI_SERVICE_TOKEN_SECRET_PREVIOUS=optional_previous_string_for_rotation
   AI_SERVICE_TOKEN_KID=local-dev-key-1
   AI_SERVICE_URL=http://127.0.0.1:8000
   ```
4. Khởi động Backend Server:
   ```bash
   npm run dev
   ```
   *Terminal báo `Server is running on port 3000` và `Connected to MongoDB` là thành công.*

---

## 4. Dịch vụ 3: Setup Frontend (`src/frontend`)

Giao diện Web Client dành cho Người hiến máu và Quản trị viên / Bệnh viện.

1. Mở Terminal thứ ba (giữ nguyên 2 Terminal trước), di chuyển vào thư mục frontend:
   ```bash
   cd src/frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường (`.env`):
   Tạo file `.env` trong thư mục `frontend`:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   VITE_CLOUDINARY_CLOUD_NAME=tên_cloud_của_bạn
   VITE_CLOUDINARY_UPLOAD_PRESET=tên_preset_unsigned_của_bạn
   ```
4. Khởi động Frontend Server:
   ```bash
   npm run dev
   ```
   *Terminal báo `Local: http://localhost:5173/` là thành công.*

---

## 5. Kịch bản Test Demo Toàn Bộ Hệ Thống

Sau khi cả 3 dịch vụ đều đang chạy:

1. **Truy cập ứng dụng:** Mở trình duyệt và vào `http://localhost:5173/`
2. **Đăng nhập / Đăng ký:** Tạo tài khoản mới hoặc đăng nhập tài khoản Người hiến máu.
3. **Test AI Chatbot tư vấn hiến máu (2 Chế độ):**
   - **Chế độ Guest (Chưa đăng nhập):** Truy cập `http://localhost:5173/chatbot` (hoặc bấm widget), AI sẽ đóng vai trò tư vấn viên chung, không lưu lịch sử chat để bảo mật.
   - **Chế độ Nội bộ (Đã đăng nhập):** Bấm vào mục **AI Chatbot** trên thanh điều hướng bên trái (Sidebar). AI sẽ chào bạn bằng tên, hiểu nhóm máu của bạn và ghi nhớ toàn bộ lịch sử trò chuyện.
   - Nhập câu hỏi: *"Điều kiện hiến máu là gì?"* hoặc *"Tôi có thể hiến máu không?"*.
   - Quan sát tốc độ gõ chữ (streaming) siêu mượt nhờ Semantic Cache và RAG.
4. **Test Đổi Thông Tin & Upload Avatar (Cloudinary):**
   - Vào mục **My Profile** -> Đổi số điện thoại/địa chỉ -> Bấm "Lưu thay đổi".
   - Upload Avatar mới và xem kết quả cập nhật trực tiếp.
5. **Test Đặt Lịch Hiến Máu & Chuyển Trang (React Router):**
   - Chọn điểm hiến máu -> Chọn ngày giờ -> Xác nhận đặt lịch thành công.

🎉 **Chúc Team có một buổi Demo thành công rực rỡ!**
