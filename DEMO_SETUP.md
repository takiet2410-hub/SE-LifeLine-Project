# Hướng dẫn Setup Demo (LifeLine Project)

Tài liệu này hướng dẫn cách khởi chạy toàn bộ hệ thống (Frontend & Backend) ở môi trường Local để chuẩn bị cho buổi Demo.

---

## 1. Yêu cầu hệ thống (Prerequisites)
- **Node.js**: Phiên bản 18.x trở lên.
- **MongoDB**: Đã cài đặt MongoDB dưới local hoặc có sẵn link kết nối (URI) tới MongoDB Atlas.
- **Tài khoản Cloudinary**: Dùng để chứa ảnh Profile.

---

## 2. Setup Backend Core

1. Mở Terminal, di chuyển vào thư mục backend:
   ```bash
   cd src/backend-core
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường (`.env`):
   - Tạo file `.env` ngang hàng với `package.json` trong thư mục `backend-core`.
   - Các thông số bắt buộc cơ bản (tham khảo `.env.example` nếu có):
     ```env
     PORT=3000
     MONGODB_URI=mongodb://localhost:27017/lifeline_db  # Hoặc link MongoDB Atlas của bạn
     JWT_SECRET=your_super_secret_key_here
     ```
4. Khởi động Backend Server:
   ```bash
   npm run dev
   ```
   *Terminal báo `Server is running on port 3000` và `Connected to MongoDB` là thành công.*

---

## 3. Setup Frontend

1. Mở một Terminal MỚI (giữ nguyên Terminal của Backend), di chuyển vào thư mục frontend:
   ```bash
   cd src/frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường (`.env`):
   - Tạo file `.env` ngang hàng với `package.json` trong thư mục `frontend`.
   - **Quan trọng:** Phải thiết lập Cloudinary để chức năng Upload Ảnh Profile hoạt động.
     ```env
     VITE_API_BASE_URL=http://localhost:3000/api/v1
     VITE_CLOUDINARY_CLOUD_NAME=tên_cloud_của_bạn
     VITE_CLOUDINARY_UPLOAD_PRESET=tên_preset_unsigned_của_bạn
     ```
     *(Lưu ý: `VITE_CLOUDINARY_UPLOAD_PRESET` bắt buộc phải được setup với chế độ **Unsigned** trên Cloudinary Dashboard).*

4. Khởi động Frontend Server:
   ```bash
   npm run dev
   ```
   *Terminal báo `Local: http://localhost:5173/` là thành công.*

---

## 4. Kịch bản Test Demo Nhanh

Sau khi cả 2 server đều đang chạy, bạn mở trình duyệt và truy cập: `http://localhost:5173/`

1. **Đăng nhập:** Tạo tài khoản mới hoặc dùng tài khoản test.
2. **Test Đổi Thông Tin & Dynamic Payload:**
   - Vào mục **My Profile** (menu bên trái).
   - Chuyển sang tab **Thông tin liên hệ**.
   - Bấm "Chỉnh sửa" -> Đổi số điện thoại hoặc Tỉnh/Thành phố -> Bấm "Lưu thay đổi".
   - Bật Tab Network trên trình duyệt (F12) để show cho mọi người thấy Payload API gửi đi chỉ chứa đúng trường vừa sửa (Dynamic Payload).
3. **Test Upload Avatar:**
   - Ở màn hình Profile, rê chuột vào Avatar -> Chọn 1 ảnh từ máy tính (dưới 5MB).
   - Xem vòng loading xoay và ảnh được update thành công qua Cloudinary.
4. **Test Chuyển Trang Không Lỗi (React Router):**
   - Click lại vào mục **My Appointments** trên menu trái. Giao diện sẽ chuyển ngay lập tức mà không bị kẹt.

🎉 **Chúc Team có một buổi Demo thành công rực rỡ!**
