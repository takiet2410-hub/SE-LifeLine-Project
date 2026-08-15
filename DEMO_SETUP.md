# 🚀 Hướng Dẫn Setup & Khởi Chạy Dự Án LifeLine (Dành Cho Thành Viên Mới)

Tài liệu này chi tiết toàn bộ quy trình cho thành viên mới **sau khi `git pull` hoặc `git clone`** code về máy local. Dự án bao gồm **3 dịch vụ chính**:
1. 🤖 **AI Service (Python FastAPI)**: Chatbot tư vấn, RAG Engine, Semantic Cache.
2. ⚙️ **Backend Core (Node.js Express + TS)**: Quản lý Auth, Booking, SOS, Campaign, Notification, Proxy.
3. 💻 **Frontend (React + Vite + TS)**: Giao diện Web Client cho Người hiến máu & Quản trị viên.

---

## 📋 1. Yêu Cầu Tiền Trạm (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Node.js**: Phiên bản `18.x` trở lên (Khuyên dùng LTS `20.x`).
- **Python**: Phiên bản `3.10` trở lên.
- **Git**: Đã cấu hình trên máy.
- **MongoDB**: Chuỗi kết nối MongoDB Atlas URI hoặc MongoDB Local.
- **Google Gemini API Key**: Dùng cho AI Service (Lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey)).
- **Cloudinary Account**: Dùng cho upload ảnh đại diện (Tùy chọn nếu chỉ test các tính năng cơ bản).

---

## 📥 2. Bước 1: Lấy Code Mới Nhất Tới Local

Mở Terminal tại thư mục bạn muốn chứa dự án:

```bash
# Nếu bạn chưa clone dự án
git clone <URL_REPOSITORY_LIFELINE>
cd SE-LifeLine-Project

# Nếu bạn đã clone và muốn cập nhật code mới nhất
git checkout main
git pull origin main
```

---

## 🔑 3. Bước 2: Cấu Hình Biến Môi Trường (`.env`)

Mỗi dịch vụ cần 1 file `.env` riêng đặt đúng ở thư mục tương ứng. Bạn cần tạo 3 file `.env` như sau:

### 3.1. Dịch vụ AI Service: Tạo file `src/ai-service/.env`

```env
GEMINI_API_KEY=AIzaSy... (Điền API Key của bạn lấy từ Google AI Studio)
MONGODB_URI=mongodb+srv://... (Điền MongoDB URI của dự án)
AI_SERVICE_TOKEN_SECRET_CURRENT=super-secret-local-dev-key
AI_SERVICE_TOKEN_SECRET_PREVIOUS=optional_previous_string_for_rotation
AI_SERVICE_TOKEN_KID=local-dev-key-1
GEMINI_MODEL=gemini-2.0-flash
GEMINI_FALLBACK_MODEL=gemini-2.0-flash-lite
```

### 3.2. Dịch vụ Backend Core: Tạo file `src/backend-core/.env`

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://... (Điền MongoDB URI trùng với AI Service)
JWT_SECRET=sanguineteam
SENDER_EMAIL=noreply.lifeline@gmail.com
FRONTEND_URL=http://localhost:5173

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=tên_cloud_của_bạn
CLOUDINARY_API_KEY=api_key_của_bạn
CLOUDINARY_API_SECRET=api_secret_của_bạn

# Token Kết Nối Với AI Service
AI_SERVICE_TOKEN_SECRET_CURRENT=super-secret-local-dev-key
AI_SERVICE_TOKEN_SECRET_PREVIOUS=optional_previous_string_for_rotation
AI_SERVICE_TOKEN_KID=local-dev-key-1
AI_SERVICE_URL=http://127.0.0.1:8000
```

### 3.3. Dịch vụ Frontend: Tạo file `src/frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_CLOUDINARY_CLOUD_NAME=tên_cloud_của_bạn
VITE_CLOUDINARY_UPLOAD_PRESET=tên_preset_unsigned_của_bạn
```

---

## 🛠️ 4. Bước 3: Setup Chi Tiết & Khởi Tạo Dữ Liệu Ban Đầu

Thực hiện cài đặt phụ thuộc và khởi tạo dữ liệu cho từng dịch vụ:

### 4.1. Setup AI Service (`src/ai-service`)

1. Di chuyển vào thư mục:
   ```bash
   cd src/ai-service
   ```
2. Tạo môi trường ảo Python (Virtual Environment):
   - **Windows PowerShell**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
     > 💡 *Nếu Windows báo lỗi execution policies, chạy lệnh này trước:* `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`
   - **Git Bash / Linux / macOS**:
     ```bash
     python -m venv venv
     source venv/bin/activate
     ```
3. Cài đặt thư viện:
   ```bash
   pip install -r requirements.txt
   ```
4. **QUAN TRỌNG FOR NEWBIE - Khởi tạo dữ liệu Kiến thức AI (Knowledge Base):**
   Chạy script ingest để nạp toàn bộ dữ liệu tài liệu y tế vào MongoDB cho AI RAG:
   ```bash
   python scripts/ingest_md.py
   ```
   *Màn hình hiển thị `THÀNH CÔNG: Đã ingest ... tài liệu vào MongoDB.` là hoàn tất.*

---

### 4.2. Setup Backend Core (`src/backend-core`)

1. Mở Terminal mới (hoặc di chuyển thư mục):
   ```bash
   cd src/backend-core
   ```
2. Cài đặt gói thư viện Node.js:
   ```bash
   npm install
   ```
3. **Khởi tạo dữ liệu mẫu (Seed Data - Khuyên dùng):**
   Giúp tạo sẵn dữ liệu Trung tâm hiến máu, Hồ sơ Donor & Phân quyền:
   ```bash
   npm run seed:prod
   ```
   *Màn hình báo `Data Integrity Check Passed` là hoàn tất.*

---

### 4.3. Setup Frontend (`src/frontend`)

1. Di chuyển vào thư mục:
   ```bash
   cd src/frontend
   ```
2. Cài đặt các thư viện React:
   ```bash
   npm install
   ```

---

## 🏃‍♂️ 5. Bước 4: Khởi Chạy Đồng Thời 3 Dịch Vụ

Mở **3 cửa sổ Terminal độc lập** để chạy đồng thời 3 dịch vụ:

### 🟢 Terminal 1: AI Service
```bash
cd src/ai-service
# Đảm bảo venv đã được activate
python main.py
```
👉 *Chạy tại:* `http://127.0.0.1:8000`  
👉 *Swagger API Docs:* `http://127.0.0.1:8000/docs`

---

### 🟢 Terminal 2: Backend Core
```bash
cd src/backend-core
npm run dev
```
👉 *Chạy tại:* `http://localhost:3000`

---

### 🟢 Terminal 3: Frontend Web Client
```bash
cd src/frontend
npm run dev
```
👉 *Chạy tại:* `http://localhost:5173`

---

## 🧪 6. Bước 5: Kiểm Thử & Trải Nghiệm Tính Năng

1. **Truy cập Ứng dụng Web:** Mở trình duyệt truy cập `http://localhost:5173/`
2. **Tạo tài khoản / Đăng nhập:** Đăng ký tài khoản người dùng mới hoặc đăng nhập tài khoản có sẵn.
3. **Test AI Chatbot tư vấn hiến máu:**
   - **Chế độ Guest:** Chưa đăng nhập -> Bấm vào widget Chatbot ở góc phải bên dưới (`http://localhost:5173/chatbot`). AI đóng vai trò tư vấn viên cộng đồng chung.
   - **Chế độ Member (Đã đăng nhập):** Đăng nhập -> Chọn **AI Chatbot** trên thanh Sidebar. AI chào theo tên người dùng, nhận diện nhóm máu và lưu lịch sử chat.
   - Hỏi thử: *"Điều kiện hiến máu là gì?"* hoặc *"Khoảng cách giữa 2 lần hiến máu là bao lâu?"*.
4. **Test Đặt lịch hiến máu (Booking):**
   - Vào mục Đặt lịch -> Chọn điểm hiến máu -> Chọn ngày giờ -> Xác nhận đặt lịch.
5. **Test Đổi Thông Tin Profile:**
   - Vào **My Profile** -> Cập nhật thông tin cá nhân / Upload avatar.

---

## ❓ 7. Xử Lý Lỗi Thường Gặp (Troubleshooting)

| Sự cố | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **`cannot be loaded because running scripts is disabled` (PowerShell)** | Windows chặn chạy script chưa ký | Chạy `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` trong PowerShell rồi kích hoạt lại `venv`. |
| **AI Chatbot không trả lời hoặc báo lỗi Knowledge Base** | Chưa nạp dữ liệu vector vào MongoDB | Vào `src/ai-service` và chạy lại `python scripts/ingest_md.py`. |
| **Lỗi `MONGODB_URI` / `GEMINI_API_KEY` is missing** | Chưa tạo hoặc đặt sai tên file `.env` | Kiểm tra xem file `.env` có nằm ở đúng thư mục `src/ai-service/.env` và `src/backend-core/.env` hay chưa. |
| **Lỗi CORS khi gọi API từ Frontend sang Backend** | Backend chưa chạy hoặc `VITE_API_BASE_URL` sai | Kiểm tra Terminal Backend Core đã hiện `Server listening on port 3000` chưa, kiểm tra file `src/frontend/.env`. |
| **Lỗi `ModuleNotFoundError` khi chạy Python** | Chưa kích hoạt môi trường ảo `venv` | Chạy lệnh activate `venv` trước khi thực hiện `python main.py` hoặc `python scripts/ingest_md.py`. |

---

🎉 **Chào mừng bạn gia nhập đội ngũ phát triển dự án LifeLine! Chúc bạn setup thành công!** 🚀
