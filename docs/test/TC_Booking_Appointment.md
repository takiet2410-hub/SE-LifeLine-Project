# BỘ TEST CASE CHI TIẾT: THÍCH ỨNG & ĐẶT LỊCH HIẾN MÁU (BOOKING APPOINTMENT)

**Mã tính năng / Feature ID:** FG2  
**Các Use Case liên quan:**  
- **LL-UC-06:** Tìm kiếm & Xem điểm hiến máu (Browse Donation Locations)  
- **LL-UC-07:** Đặt lịch hẹn hiến máu (Book Appointment)  
- **LL-UC-08:** Xem chi tiết & lịch sử lịch hẹn (View Appointment)  
- **LL-UC-09:** Hủy lịch hẹn (Cancel Appointment)  
- **LL-UC-10:** Tải & Hiển thị E-ticket (Download E-ticket)  
- **SYS-UC-01:** Tạo & Đánh giá Form sàng lọc tiền hiến máu (Pre-donation Screening Form)  
- **SYS-UC-02:** Tạo & Mã hóa QR E-Ticket (Generate E-Ticket)  
- **FR-019:** Đồng bộ dữ liệu lịch hẹn sang hệ thống BloodCenter (Sync Appointment to BloodCenter)  
- **FR-020:** Bác sĩ / Nhân viên y tế xác nhận lịch hẹn (BloodCenter Staff Confirmation)  
- **FR-021:** Bác sĩ / Nhân viên y tế từ chối/tạm hoãn lịch hẹn & gửi Email (BloodCenter Staff Rejection)  

**Ngày cập nhật:** 05/08/2026  
**Phiên bản:** 3.0 (Quy định chi tiết Thao tác UI Frontend & Mã Code Jest Backend Test)  
**Tác giả:** Antigravity AI - Software Quality Assurance  

---

## 1. MAPPING YÊU CẦU & BẢNG TỔNG QUAN TEST CASES

| STT | Use Case | ID Test Case | Tên Test Case | Màn hình UI (Frontend) | File Code Test Backend (Jest) | Độ ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | LL-UC-06 | `TC_UC06_001` | Tìm điểm hiến máu gần nhất bằng định vị GPS tự động | `InteractiveMapPage.tsx` (`/my-appointments/map`) | `booking.integration.test.ts` (`GET /locations`) | High |
| 2 | LL-UC-06 | `TC_UC06_002` | Tìm điểm hiến máu thủ công khi từ chối quyền truy cập GPS | `InteractiveMapPage.tsx` (`/my-appointments/map`) | `booking.integration.test.ts` (`GET /locations`) | High |
| 3 | LL-UC-06 | `TC_UC06_003` | Lọc địa điểm hiến máu theo Bán kính, Ngày, Nhóm máu, Mức độ đông đúc | `InteractiveMapPage.tsx` (Filter Drawer) | `booking.service.test.ts` (`searchLocations`) | Medium |
| 4 | LL-UC-06 | `TC_UC06_004` | Xử lý ngoại lệ: Không tìm thấy chiến dịch hiến máu nào trong bán kính chọn | `InteractiveMapPage.tsx` (Empty State) | `booking.service.test.ts` (`searchLocations`) | Medium |
| 5 | LL-UC-06 | `TC_UC06_005` | Kiểm tra thời gian tải dữ liệu bản đồ (<= 1s - NFR-001) | `InteractiveMapPage.tsx` | `booking.integration.test.ts` | Medium |
| 6 | LL-UC-07 | `TC_UC07_001` | Yêu cầu đăng nhập (JWT Token) trước khi thực hiện đặt lịch hẹn | `LoginPage.tsx` / `Step1_LocationTime.tsx` | `booking.integration.test.ts` (`POST 401`) | High |
| 7 | LL-UC-07 | `TC_UC07_002` | Đặt lịch hẹn thành công với thông tin & điều kiện hợp lệ (Status: Pending) | `Step3_ConfirmBooking.tsx` -> `MyAppointmentPage.tsx` | `booking.integration.test.ts` (`POST 201`) | Critical |
| 8 | LL-UC-07 | `TC_UC07_003` | Từ chối đặt lịch khi khoảng cách lần hiến máu gần nhất < 84 ngày | `Step3_ConfirmBooking.tsx` (Error Toast) | `booking.service.test.ts` (`ELIGIBILITY_FAILED_84_DAYS`) | High |
| 9 | LL-UC-07 | `TC_UC07_004` | Chặn đặt trùng lịch hẹn đang có hiệu lực (`DUPLICATE_APPOINTMENT`) | `Step3_ConfirmBooking.tsx` (Error Toast) | `booking.service.test.ts` (`DUPLICATE_APPOINTMENT`) | High |
| 10 | LL-UC-07 | `TC_UC07_005` | Chặn đặt lịch vào đợt hiến máu đã hết slot hoặc không Active | `Step1_LocationTime.tsx` (Disabled Slot) | `booking.service.test.ts` (`CAMPAIGN_FULL`) | High |
| 11 | LL-UC-07 | `TC_UC07_006` | Kiểm tra đồng thời (Race Condition) khi 2 người cùng chọn 1 slot cuối | `Step3_ConfirmBooking.tsx` | `booking.service.test.ts` (`Concurrent Transaction`) | High |
| 12 | LL-UC-07 | `TC_UC07_007` | Điền Form sàng lọc đạt (PASS) -> Tạo thành công lịch hẹn và phiếu sàng lọc | `Step2_ScreeningForm.tsx` | `booking.service.test.ts` (`createAppointment PASS`) | Critical |
| 13 | LL-UC-07 | `TC_UC07_008` | Điền Form sàng lọc cần đánh giá (REVIEW) -> Gắn cờ khám y tế trực tiếp | `Step2_ScreeningForm.tsx` | `booking.service.test.ts` (`createAppointment REVIEW`) | High |
| 14 | LL-UC-07 | `TC_UC07_009` | Điền Form sàng lọc không đạt (REJECT) -> Chặn tạo lịch hẹn | `Step2_ScreeningForm.tsx` (Banner từ chối) | `booking.service.test.ts` (`ELIGIBILITY_FAILED_SCREENING`) | High |
| 15 | LL-UC-07 | `TC_UC07_010` | Bỏ trống hoặc định dạng sai Form sàng lọc (`INVALID_SCREENING_FORM`) | `Step2_ScreeningForm.tsx` (Highlight đỏ) | `booking.integration.test.ts` (`POST 400`) | Medium |
| 16 | LL-UC-07 | `TC_UC07_011` | Cố gắng đặt lịch hẹn cho chiến dịch bị hủy hoặc không tồn tại | `Step1_LocationTime.tsx` | `booking.service.test.ts` (`CAMPAIGN_NOT_ACTIVE`) | High |
| 17 | LL-UC-07 | `TC_UC07_012` | Kiểm tra thời gian hoàn tất xác nhận lịch hẹn (<= 5s - NFR-002) | `Step3_ConfirmBooking.tsx` | `booking.service.test.ts` | High |
| 18 | LL-UC-07 | `TC_UC07_013` | Tính nguyên tố Transaction (Atomic Rollback) khi gặp lỗi DB / Network | `Step3_ConfirmBooking.tsx` | `booking.service.test.ts` (`abortTransaction`) | High |
| 19 | LL-UC-07 | `TC_UC07_014` | Kiểm tra quy tắc hết hạn khung giờ hiến máu theo thời gian thực (FR-010a) | `InteractiveMapPage.tsx` / `Step1_LocationTime.tsx` | `booking.service.test.ts` (`checkAndMarkExpired`) | High |
| 20 | LL-UC-08 | `TC_UC08_001` | Xem chi tiết lịch hẹn đã đặt (Địa điểm, Khung giờ, Screening Form, E-ticket) | `AppointmentDetails.tsx` modal | `booking.integration.test.ts` (`GET /appointments/:id`) | High |
| 21 | LL-UC-08 | `TC_UC08_002` | Xem danh sách lịch sử lịch hẹn (Sắp tới, Đã hoàn thành, Đã hủy) | `MyAppointmentPage.tsx` | `booking.integration.test.ts` (`GET /appointments`) | Medium |
| 22 | LL-UC-08 | `TC_UC08_003` | Kiểm tra phân quyền: Người dùng không thể xem lịch hẹn của người khác | `AppointmentDetails.tsx` | `booking.service.test.ts` (`APPOINTMENT_NOT_FOUND`) | High |
| 23 | LL-UC-08 | `TC_UC08_004` | Kiểm tra tự động chuyển trạng thái `NoShow` & hết hạn QR Code đối với lịch hẹn đã qua giờ | `MyAppointmentPage.tsx` | `booking.service.test.ts` (`checkAndMarkExpired`) | High |
| 24 | LL-UC-09 | `TC_UC09_001` | Hủy lịch hẹn thành công trước thời hạn quy định (> 24 giờ) | `CancelAppointmentModal.tsx` | `booking.integration.test.ts` (`PATCH /cancel 200`) | High |
| 25 | LL-UC-09 | `TC_UC09_002` | Cho phép hủy lịch hẹn trong thời gian ân hạn (Grace Period <= 30 phút sau khi tạo) | `CancelAppointmentModal.tsx` | `booking.service.test.ts` (`cancelAppointment 30m`) | Business Rule |
| 26 | LL-UC-09 | `TC_UC09_003` | Từ chối hủy lịch hẹn khi đã sát giờ hẹn (< 24 giờ và > 30 phút sau khi tạo) | `CancelAppointmentModal.tsx` | `booking.service.test.ts` (`CANCELLATION_DEADLINE_PASSED`) | Business Rule |
| 27 | LL-UC-09 | `TC_UC09_004` | Thao tác hủy đối với lịch hẹn đã hủy / hoàn thành / NoShow | `CancelAppointmentModal.tsx` | `booking.service.test.ts` (`INVALID_STATUS_TRANSITION`) | Exception |
| 28 | LL-UC-09 | `TC_UC09_005` | Kiểm tra hoàn trả capacity của chiến dịch (-1 registeredCount) & vô hiệu QR Code | `MyAppointmentPage.tsx` | `booking.service.test.ts` (`$inc: -1`) | High |
| 29 | LL-UC-10 | `TC_UC10_001` | Tải xuống E-Ticket dạng PDF thành công cho lịch hẹn đã được xác nhận | `ETicketModal.tsx` | `booking.integration.test.ts` (`GET /e-ticket`) | High |
| 30 | LL-UC-10 | `TC_UC10_002` | Từ chối xuất E-Ticket khi lịch hẹn chưa được xác nhận/Pending | `ETicketModal.tsx` | `booking.service.test.ts` (`ETICKET_NOT_READY`) | High |
| 31 | LL-UC-10 | `TC_UC10_003` | Kiểm tra tính duy nhất và chữ ký số mật mã (`SIGNED-TK-...`) của QR Code E-ticket | `ETicketModal.tsx` | `booking.service.test.ts` (`qrPayloadSigned`) | High |
| 32 | LL-UC-10 | `TC_UC10_004` | Kiểm tra thời gian sinh/xuất file E-ticket (<= 5s - NFR-003) | `ETicketModal.tsx` | `booking.integration.test.ts` | Medium |
| 33 | STAFF | `TC_STAFF_001` | Đồng bộ dữ liệu lịch hẹn & phiếu sàng lọc sang hệ thống BloodCenter (FR-019) | Staff Dashboard | `booking.service.test.ts` (`syncToBloodCenter`) | High |
| 34 | STAFF | `TC_STAFF_002` | Bác sĩ / Staff xác nhận lịch hẹn -> Đổi trạng thái Confirmed, phát hành E-ticket & gửi Email | Staff Dashboard | `booking.integration.test.ts` (`POST /confirm`) | Critical |
| 35 | STAFF | `TC_STAFF_003` | Bác sĩ / Staff từ chối/tạm hoãn lịch hẹn -> Đổi trạng thái Rejected & gửi Email lý do | Staff Dashboard | `booking.service.test.ts` (`rejectAppointment`) | High |

---

## 2. CHI TIẾT CÁC TEST CASES: THAO TÁC UI & MÃ TEST JEST

### UC-06: TÌM KIẾM & XEM ĐIỂM HIẾN MÁU (BROWSE LOCATIONS)

#### `TC_UC06_001`: Tìm điểm hiến máu gần nhất bằng định vị GPS tự động
- **Loại test:** Functional
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `InteractiveMapPage.tsx` tại đường dẫn `/my-appointments/map`.
- **Các bước thực hiện:**
  1. Người dùng mở ứng dụng và truy cập trang "Bản Đồ Điểm Hiến Máu".
  2. Trình duyệt hiển thị Pop-up hỏi cấp quyền vị trí vị trí GPS.
  3. Bấm chọn **"Đồng ý & Cho phép"**.
  4. Nhấn nút công tắc **`GPS: BẬT`** trên thanh Header bar.
- **Kết quả mong đợi trên UI:**
  - Toast thông báo thành công: *"Đã bật định vị GPS và xác định vị trí của bạn!"*.
  - Nút GPS chuyển sang nền xanh lá với nhãn **`GPS: BẬT`** và icon Navigation nhấp nháy.
  - Bản đồ tự động canh giữa (flyTo) về tọa độ GPS hiện tại của người dùng.
  - Hiển thị marker vị trí trung tâm GPS của người dùng màu xanh lam và các pin điểm hiến máu nằm trong bán kính 15km.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.integration.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('GET /api/v1/bookings/locations should call BookingService.searchLocations with lat, lng, radius', async () => {
    (BookingService.searchLocations as jest.Mock).mockResolvedValue([
      { id: 'c1', name: 'Chiến dịch Bệnh viện Chợ Rẫy', lat: 10.7554, lng: 106.6653 }
    ]);
    
    const response = await request(app).get('/api/v1/bookings/locations?lat=10.7769&lng=106.7009&radius=15');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: 'c1', name: 'Chiến dịch Bệnh viện Chợ Rẫy', lat: 10.7554, lng: 106.6653 }
    ]);
    expect(BookingService.searchLocations).toHaveBeenCalledWith(
      expect.objectContaining({ lat: '10.7769', lng: '106.7009', radius: '15' })
    );
  });
  ```

---

#### `TC_UC06_002`: Tìm điểm hiến máu thủ công khi từ chối quyền truy cập GPS
- **Loại test:** Functional
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `InteractiveMapPage.tsx` (`/my-appointments/map`).
- **Các bước thực hiện:**
  1. Mở màn hình bản đồ và chọn **"Từ chối"** quyền GPS hoặc nhấn nút **`GPS: TẮT`** ở góc phải Header bar.
  2. Nhập từ khóa tìm kiếm `"Quận 5"` vào ô Input Tìm kiếm ở giữa Header.
- **Kết quả mong đợi trên UI:**
  - Nút GPS chuyển sang màu xám với nhãn **`GPS: TẮT`**.
  - Dưới thanh tìm kiếm xuất hiện ghi chú: `* Quyền vị trí tắt: Đang áp dụng tìm kiếm thủ công`.
  - Bản đồ cập nhật vị trí trung tâm về khu vực Quận 5 và hiển thị danh sách các đợt hiến máu tương ứng.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('searchLocations should return locations when lat/lng are omitted', async () => {
    const filters = { date: '2026-08-10' };
    const result = await BookingService.searchLocations(filters);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
  ```

---

#### `TC_UC06_003`: Lọc địa điểm hiến máu theo Bán kính, Ngày, Nhóm máu (Multi-select), Mức độ đông đúc
- **Loại test:** Functional
- **Độ ưu tiên:** Medium

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `InteractiveMapPage.tsx` (Panel Bộ lọc tìm kiếm bên trái).
- **Các bước thực hiện:**
  1. Kéo thanh trượt Bán kính về `10 km`.
  2. Chọn Nhóm máu `O+` và `A+`.
  3. Tích chọn mức độ đông đúc `Vắng vẻ (Low)`.
  4. Chọn Ngày dự định hiến: `2026-08-10`.
- **Kết quả mong đợi trên UI:**
  - Danh sách đợt hiến máu ở danh sách bên phải tự động lọc và cập nhật realtime.
  - Vùng đường tròn nét đứt trên bản đồ co lại tương ứng với bán kính 10km.
  - Thẻ đợt hiến máu hiển thị badge `🔴 Cách X km` và `🟢 Vắng vẻ`.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('searchLocations should filter correctly by bloodType and crowdingLevel', async () => {
    const filters = {
      lat: 10.7769,
      lng: 106.7009,
      radius: 10,
      bloodType: 'O+,A+',
      crowdingLevel: 'Low'
    };
    const locations = await BookingService.searchLocations(filters);
    expect(locations.every(c => c.registeredCount / c.capacity < 0.5)).toBe(true);
  });
  ```

---

#### `TC_UC06_004`: Xử lý ngoại lệ: Không tìm thấy chiến dịch hiến máu nào trong bán kính chọn
- **Loại test:** Exception
- **Độ ưu tiên:** Medium

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `InteractiveMapPage.tsx` (Empty State sidebar).
- **Các bước thực hiện:**
  1. Chọn bán kính nhỏ (`1 km`) tại vùng địa lý không có chiến dịch nào diễn ra.
- **Kết quả mong đợi trên UI:**
  - Cột danh sách bên phải hiển thị Empty State với icon `AlertCircle`.
  - Dòng chữ: *"Không tìm thấy điểm hiến máu. Không có chiến dịch nào phù hợp với bộ lọc hiện tại."*.
  - Hiển thị nút **"Xóa bộ lọc"** giúp người dùng khôi phục cài đặt mặc định.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('searchLocations should return empty array when no campaigns match radius', async () => {
    const filters = { lat: 0.0, lng: 0.0, radius: 1 };
    const locations = await BookingService.searchLocations(filters);
    expect(locations).toEqual([]);
  });
  ```

---

#### `TC_UC06_005`: Kiểm tra thời gian tải dữ liệu bản đồ (NFR-001)
- **Loại test:** Performance
- **Độ ưu tiên:** Medium

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Các bước thực hiện:** Mở tab Network trên DevTools (F12) -> Reload trang Bản đồ.
- **Kết quả mong đợi trên UI:** Thời gian hiển thị toàn bộ marker pin trên bản đồ từ khi kết thúc API <= **1.0 giây**.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.integration.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('GET /api/v1/bookings/locations should respond within 1000ms', async () => {
    const start = Date.now();
    await request(app).get('/api/v1/bookings/locations');
    const duration = Date.now() - start;
    expect(duration).toBeLessThanOrEqual(1000);
  });
  ```

---

### UC-07: ĐẶT LỊCH HẸN HIẾN MÁU (BOOK APPOINTMENT) & SYS-UC-01

#### `TC_UC07_001`: Yêu cầu đăng nhập (JWT Token) trước khi thực hiện đặt lịch hẹn (BR-001)
- **Loại test:** Security / Business Rule
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `Step1_LocationTime.tsx` -> Redirect to `LoginPage.tsx`.
- **Các bước thực hiện:**
  1. Đăng xuất tài khoản (Xóa JWT token khỏi LocalStorage).
  2. Vào bản đồ, bấm **"Đặt lịch"** ở một đợt hiến máu.
- **Kết quả mong đợi trên UI:**
  - Ứng dụng tự động điều hướng sang trang Đăng nhập (`/login`).
  - Toast cảnh báo: *"Vui lòng đăng nhập để thực hiện đặt lịch hiến máu."*.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.integration.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('POST /api/v1/bookings/appointments should return 401 if unauthenticated', async () => {
    const unauthApp = express();
    unauthApp.use(express.json());
    unauthApp.use('/api/v1/bookings', bookingRoutes);

    const response = await request(unauthApp)
      .post('/api/v1/bookings/appointments')
      .send({ campaignId: 'c1' });

    expect(response.status).toBe(401);
  });
  ```

---

#### `TC_UC07_002`: Đặt lịch hẹn thành công với thông tin & điều kiện hợp lệ
- **Loại test:** Functional (Happy Path)
- **Độ ưu tiên:** Critical

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `Step1_LocationTime.tsx` -> `Step2_ScreeningForm.tsx` -> `Step3_ConfirmBooking.tsx`.
- **Các bước thực hiện:**
  1. Chọn ngày hiến & khung giờ `07:30 - 09:00`. Bấm **"Tiếp tục"**.
  2. Điền Form sàng lọc sức khỏe: Chọn "Không" cho tất cả các câu hỏi nguy cơ. Bấm **"Gửi phiếu"**.
  3. Ở bước Xác nhận thông tin: Bấm **"Xác nhận đăng ký đặt lịch"**.
- **Kết quả mong đợi trên UI:**
  - Hiển thị màn hình Hoàn tất thành công với mã hẹn và trạng thái **`Đang chờ duyệt (Pending)`**.
  - Tự động chuyển hướng về trang *"Lịch hẹn của tôi"* (`/my-appointments`).

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.integration.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('POST /api/v1/bookings/appointments should return 201 Created and Pending appointment', async () => {
    (BookingService.createAppointment as jest.Mock).mockResolvedValue({
      id: 'a1',
      status: 'Pending',
      appointmentDate: '2026-08-10',
      timeSlot: '07:30-09:00'
    });

    const response = await request(app)
      .post('/api/v1/bookings/appointments')
      .send({
        campaignId: 'c1',
        appointmentDate: '2026-08-10',
        timeSlot: '07:30-09:00',
        answers: { responses: [{ questionId: '1', selectedOptions: ['Không'] }] }
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('Pending');
  });
  ```

---

#### `TC_UC07_003`: Từ chối đặt lịch khi khoảng cách lần hiến máu gần nhất < 84 ngày (`ELIGIBILITY_FAILED_84_DAYS`)
- **Loại test:** Business Rule
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `Step3_ConfirmBooking.tsx`.
- **Các bước thực hiện:** Đăng nhập tài khoản vừa hiến máu 50 ngày trước -> Đặt lịch hẹn mới.
- **Kết quả mong đợi trên UI:**
  - Xuất hiện thông báo lỗi nổi bật (Alert/Toast): *"Bạn chưa đủ điều kiện khoảng cách giữa 2 lần hiến máu (tối thiểu 84 ngày). Ngày có thể hiến tiếp theo: DD/MM/YYYY."*.
  - Nút xác nhận bị khóa.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('should throw ELIGIBILITY_FAILED_84_DAYS if last donation was < 84 days', async () => {
    const mockCampaign = { status: 'Active', capacity: 10, registeredCount: 5 };
    (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockResolvedValue(mockCampaign)
    });

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 50);

    (Appointment.findOne as jest.Mock).mockReturnValueOnce({
      sort: jest.fn().mockResolvedValue({ appointmentDate: recentDate })
    });

    await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1', appointmentDate: new Date() }))
      .rejects.toThrow('ELIGIBILITY_FAILED_84_DAYS');
    expect(sessionMock.abortTransaction).toHaveBeenCalled();
  });
  ```

---

#### `TC_UC07_004`: Chặn đặt trùng lịch hẹn đang có hiệu lực (`DUPLICATE_APPOINTMENT`)
- **Loại test:** Business Rule
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `Step3_ConfirmBooking.tsx`.
- **Các bước thực hiện:** Tạo lịch hẹn khi đã có 1 lịch hẹn đang ở trạng thái `Pending`/`Confirmed`.
- **Kết quả mong đợi trên UI:** Toast báo lỗi: *"Bạn đang có lịch hẹn hiến máu chưa hoàn thành. Không thể đặt thêm lịch mới."*.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('should throw DUPLICATE_APPOINTMENT if duplicate active appointment found', async () => {
    const mockCampaign = { status: 'Active', capacity: 10, registeredCount: 5 };
    (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockResolvedValue(mockCampaign)
    });

    (Appointment.findOne as jest.Mock).mockReturnValueOnce({ sort: jest.fn().mockResolvedValue(null) });
    (Appointment.findOne as jest.Mock).mockReturnValueOnce({ status: 'Scheduled' });

    await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1', appointmentDate: new Date() }))
      .rejects.toThrow('DUPLICATE_APPOINTMENT');
  });
  ```

---

#### `TC_UC07_005`: Chặn đặt lịch vào đợt hiến máu đã hết slot hoặc không Active (`CAMPAIGN_FULL`)
- **Loại test:** Business Rule
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `Step1_LocationTime.tsx` & Detail Modal.
- **Các bước thực hiện:** Quan sát khung giờ hiến có `registeredCount >= capacity`.
- **Kết quả mong đợi trên UI:** Thẻ khung giờ hiển thị nhãn đỏ **"Hết chỗ"**, nền xám mờ và bị `disabled` không cho click chọn.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('should throw CAMPAIGN_FULL if campaign registeredCount >= capacity', async () => {
    const mockCampaign = { status: 'Active', capacity: 10, registeredCount: 10 };
    (mongoose.models.Campaign.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockResolvedValue(mockCampaign)
    });

    await expect(BookingService.createAppointment('donor-1', { campaignId: 'c1' }))
      .rejects.toThrow('CAMPAIGN_FULL');
  });
  ```

---

#### `TC_UC07_007`: Điền Form sàng lọc đạt (PASS) -> Tạo thành công phiếu sàng lọc (SYS-UC-01)
- **Loại test:** Functional
- **Độ ưu tiên:** Critical

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `Step2_ScreeningForm.tsx`.
- **Các bước thực hiện:** Chọn "Không" cho tất cả các câu hỏi trong phiếu sàng lọc sức khỏe. Bấm "Tiếp tục".
- **Kết quả mong đợi trên UI:** Form cho phép tiếp tục sang bước chốt đăng ký không bị cảnh báo y tế.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('should save ScreeningForm with PASS outcome when all answers are No', async () => {
    const result = await BookingService.createAppointment('donor-1', validPassData);
    expect(result.screeningFormId.outcome).toBe('PASS');
  });
  ```

---

#### `TC_UC07_009`: Điền Form sàng lọc không đạt (REJECT) -> Chặn tạo lịch hẹn
- **Loại test:** Business Rule
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `Step2_ScreeningForm.tsx`.
- **Các bước thực hiện:** Tích chọn "Có" ở câu hỏi nguy cơ như *"Mới xăm hình 6 tháng qua"* hoặc *"Viêm gan B"*.
- **Kết quả mong đợi trên UI:** Hệ thống hiển thị hộp thoại cảnh báo: *"Rất tiếc! Bạn chưa đủ điều kiện hiến máu đợt này theo tiêu chuẩn y tế."* và chặn chuyển sang bước chốt đơn.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('should throw ELIGIBILITY_FAILED_SCREENING when screening outcome is REJECT', async () => {
    const rejectData = {
      campaignId: 'c1',
      answers: { responses: [{ questionId: 'q_tattoo', selectedOptions: ['Xăm, xỏ lỗ tai'] }] }
    };
    await expect(BookingService.createAppointment('donor-1', rejectData))
      .rejects.toThrow('ELIGIBILITY_FAILED_SCREENING');
  });
  ```

---

#### `TC_UC07_014`: Kiểm tra quy tắc hết hạn khung giờ hiến máu theo thời gian thực (FR-010a / BR-009)
- **Loại test:** Business Rule
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `InteractiveMapPage.tsx` Modal & `Step1_LocationTime.tsx`.
- **Các bước thực hiện:** Chọn ngày hôm nay khi thời gian hiện tại đã vượt qua khung giờ cuối cùng (VD: Hiện tại 17:00, khung giờ cuối 16:00).
- **Kết quả mong đợi trên UI:**
  - Hiển thị Banner cảnh báo màu đỏ: *"Đã qua khung giờ cuối cùng trong ngày hôm nay. Vui lòng chọn ngày khác."*.
  - Toàn bộ các khung giờ trong ngày bị mờ với nhãn **"Đã qua giờ"**.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('should mark past pending appointments as NoShow via checkAndMarkExpiredAppointments', async () => {
    const pastAppt = [{ _id: 'a1', status: 'Pending', appointmentDate: '2026-01-01', timeSlot: '07:30-09:00' }];
    await (BookingService as any).checkAndMarkExpiredAppointments(pastAppt);
    expect(pastAppt[0].status).toBe('NoShow');
  });
  ```

---

### UC-08: XEM CHI TIẾT & LỊCH SỬ LỊCH HẸN (VIEW APPOINTMENT)

#### `TC_UC08_001`: Xem chi tiết lịch hẹn đã đặt thành công
- **Loại test:** Functional
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `AppointmentDetails.tsx` modal tại trang `/my-appointments`.
- **Các bước thực hiện:** Nhấp vào một thẻ lịch hẹn trong danh sách.
- **Kết quả mong đợi trên UI:**
  - Hiển thị Modal Popup chứa đầy đủ: Tên bệnh viện/chiến dịch, Địa chỉ, Ngày & Khung giờ, Badge trạng thái (`Pending`/`Confirmed`), Mã vé E-Ticket và mã QR Code (nếu đã Confirmed).

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.integration.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('GET /api/v1/bookings/appointments/:id should return 200 and appointment details', async () => {
    (BookingService.getAppointmentById as jest.Mock).mockResolvedValue({ id: 'a1', status: 'Pending' });

    const response = await request(app).get('/api/v1/bookings/appointments/a1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'a1', status: 'Pending' });
  });
  ```

---

#### `TC_UC08_003`: Kiểm tra phân quyền: Người dùng không thể xem lịch hẹn của người khác (NFR-006)
- **Loại test:** Security
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Các bước thực hiện:** Nhập trực tiếp URL đường dẫn ID lịch hẹn của người khác trên thanh địa chỉ trình duyệt.
- **Kết quả mong đợi trên UI:** Màn hình hiển thị Thông báo lỗi 404/403: *"Không tìm thấy lịch hẹn hoặc bạn không có quyền truy cập."*.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('getAppointmentById should throw APPOINTMENT_NOT_FOUND if appointment belongs to another donor', async () => {
    (Appointment.findOne as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) });

    await expect(BookingService.getAppointmentById('a1', 'wrong-donor-id'))
      .rejects.toThrow('APPOINTMENT_NOT_FOUND');
  });
  ```

---

### UC-09: HỦY LỊCH HẸN (CANCEL APPOINTMENT)

#### `TC_UC09_001`: Hủy lịch hẹn thành công trước thời hạn quy định (> 24 giờ)
- **Loại test:** Functional
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `CancelAppointmentModal.tsx` tại trang `/my-appointments`.
- **Các bước thực hiện:**
  1. Mở chi tiết lịch hẹn còn hạn > 24h. Bấm nút **"Hủy lịch hẹn"**.
  2. Chọn lý do hủy: *"Bận việc đột xuất"*. Bấm **"Xác nhận hủy"**.
- **Kết quả mong đợi trên UI:**
  - Modal đóng lại, thẻ lịch hẹn chuyển sang tab **"Đã hủy"** với Badge màu xám `Cancelled`.
  - Toast thông báo: *"Hủy lịch hẹn thành công!"*.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.integration.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('PATCH /api/v1/bookings/appointments/:id/cancel should return 200 and updated status', async () => {
    (BookingService.cancelAppointment as jest.Mock).mockResolvedValue({ id: 'a1', status: 'Cancelled' });

    const response = await request(app)
      .patch('/api/v1/bookings/appointments/a1/cancel')
      .send({ reason: 'Sick' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Cancelled');
  });
  ```

---

#### `TC_UC09_003`: Từ chối hủy lịch hẹn khi đã sát giờ hẹn (< 24 giờ và > 30 phút sau khi tạo)
- **Loại test:** Business Rule
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `CancelAppointmentModal.tsx`.
- **Các bước thực hiện:** Bấm nút Hủy ở lịch hẹn diễn ra sau 5 giờ tới.
- **Kết quả mong đợi trên UI:** Nút hủy bị ẩn hoặc hiển thị cảnh báo: *"Đã quá thời hạn cho phép hủy (trước 24 giờ). Vui lòng liên hệ ban tổ chức để hỗ trợ."*.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('should throw CANCELLATION_DEADLINE_PASSED if appointment is < 24 hours away', async () => {
    const apptDate = new Date();
    apptDate.setHours(apptDate.getHours() + 10);

    (Appointment.findOne as jest.Mock).mockReturnValue({
      session: jest.fn().mockResolvedValue({ status: 'Scheduled', appointmentDate: apptDate })
    });

    await expect(BookingService.cancelAppointment('a1', 'donor-1'))
      .rejects.toThrow('CANCELLATION_DEADLINE_PASSED');
  });
  ```

---

### UC-10: TẢI & HIỂN THỊ E-TICKET (DOWNLOAD E-TICKET) & SYS-UC-02

#### `TC_UC10_001`: Tải xuống E-Ticket dạng PDF thành công cho lịch hẹn đã được xác nhận
- **Loại test:** Functional
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `ETicketModal.tsx`.
- **Các bước thực hiện:** Mở lịch hẹn ở trạng thái `Confirmed` -> Bấm nút **"Tải vé E-Ticket (PDF)"**.
- **Kết quả mong đợi trên UI:** Trình duyệt thực hiện tải tập tin PDF về máy tính. Mã QR hiển thị rõ nét trên màn hình pop-up.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.integration.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('GET /api/v1/bookings/appointments/:id/e-ticket should return 200 and eTicket object', async () => {
    (BookingService.downloadETicket as jest.Mock).mockResolvedValue({ id: 'e1', ticketCode: 'TK-123' });

    const response = await request(app).get('/api/v1/bookings/appointments/a1/e-ticket');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'e1', ticketCode: 'TK-123' });
  });
  ```

---

#### `TC_UC10_002`: Từ chối xuất E-Ticket khi lịch hẹn chưa được xác nhận/Pending (`ETICKET_NOT_READY`)
- **Loại test:** Business Rule
- **Độ ưu tiên:** High

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Component / Màn hình:** `AppointmentDetails.tsx`.
- **Các bước thực hiện:** Quan sát nút Xem vé E-Ticket ở lịch hẹn `Pending`.
- **Kết quả mong đợi trên UI:** Nút Xem E-Ticket hiển thị nhãn *"Chờ xác nhận"* và bị mờ không thể bấm vào.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.service.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('should throw ETICKET_NOT_READY if appointment status is Pending', async () => {
    (Appointment.findOne as jest.Mock).mockResolvedValue({ status: 'Pending', eTicketId: null });

    await expect(BookingService.downloadETicket('a1', 'donor-1'))
      .rejects.toThrow('ETICKET_NOT_READY');
  });
  ```

---

### BLOODCENTER STAFF OPERATIONS (Nghiệp vụ Bác sĩ & Staff)

#### `TC_STAFF_002`: Staff xác nhận lịch hẹn -> Đổi trạng thái Confirmed, phát hành E-ticket & gửi Email (FR-020)
- **Loại test:** Functional / Notification
- **Độ ưu tiên:** Critical

##### 🌐 1. Thao tác & Kiểm thử Giao diện Người dùng (Frontend UI Test):
- **Các bước thực hiện:** Bác sĩ mở danh sách đăng ký trên Dashboard Staff -> Nhấn nút **"Xác nhận duyệt"**.
- **Kết quả mong đợi trên UI:** Trạng thái đơn đổi sang `Confirmed`, nút Tải E-ticket xuất hiện, Email được phát đi tự động.

##### 🧪 2. Kiểm thử Tự động với Jest (Backend Code Test):
- **File Test Jest:** `src/backend-core/src/modules/booking/__tests__/booking.integration.test.ts`
- **Mã Jest Test Snippet:**
  ```typescript
  it('POST /api/v1/bookings/appointments/:id/confirm should confirm appointment and generate eTicket', async () => {
    (BookingService.confirmAppointmentByBloodCenter as jest.Mock).mockResolvedValue({
      id: 'a1',
      status: 'Confirmed',
      eTicketId: { ticketCode: 'TK-123' }
    });

    const response = await request(app).post('/api/v1/bookings/appointments/a1/confirm');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Confirmed');
  });
  ```

---

## 3. MA TRẬN PHỦ YÊU CẦU TRONG TEST SUITE (TEST COVERAGE MATRIX)

| Mã Yêu cầu (Requirement ID) | Các Test Case tương ứng |
| :--- | :--- |
| **FR-001** (Map display) | `TC_UC06_001`, `TC_UC06_002` |
| **FR-002** (Search & Filter) | `TC_UC06_003`, `TC_UC06_004` |
| **FR-003** (GPS & Manual location) | `TC_UC06_001`, `TC_UC06_002` |
| **FR-004 / BR-001** (Authentication validation) | `TC_UC07_001` |
| **FR-005 / BR-004** (Eligibility 84-day validation) | `TC_UC07_002`, `TC_UC07_003`, `TC_UC07_007` |
| **FR-006 / BR-005** (Prevent overlap appointments) | `TC_UC07_004` |
| **FR-007 / BR-002 / BR-003** (Reserve slot & Campaign Status) | `TC_UC07_002`, `TC_UC07_005`, `TC_UC07_006` |
| **FR-008** (Update capacity) | `TC_UC07_002`, `TC_UC09_001`, `TC_UC09_005` |
| **FR-009 / SYS-UC-01** (Screening Form PASS/REVIEW/REJECT) | `TC_UC07_007`, `TC_UC07_008`, `TC_UC07_009`, `TC_UC07_010` |
| **FR-010 / SYS-UC-02** (E-Ticket generation) | `TC_UC07_002`, `TC_UC10_001`, `TC_STAFF_002` |
| **FR-010a / BR-009** (Timeslot Expiration Rule) | `TC_UC07_014`, `TC_UC08_004` |
| **FR-011 & FR-012** (View appointment details & history) | `TC_UC08_001`, `TC_UC08_002`, `TC_UC08_004` |
| **FR-013, 014, 015 / BR-006, BR-007** (Cancel appointment & rules) | `TC_UC09_001`, `TC_UC09_002`, `TC_UC09_003`, `TC_UC09_004`, `TC_UC09_005` |
| **FR-016, 017, 018 / BR-008** (Download & View E-ticket) | `TC_UC10_001`, `TC_UC10_002`, `TC_UC10_003`, `TC_UC10_004` |
| **FR-019** (Sync to BloodCenter) | `TC_STAFF_001` |
| **FR-020** (Staff Confirm & Email Issue) | `TC_STAFF_002` |
| **FR-021** (Staff Reject & Email Reason) | `TC_STAFF_003` |
| **NFR-001 đến NFR-008** (Performance, Security, Atomic) | `TC_UC06_005`, `TC_UC07_012`, `TC_UC07_013`, `TC_UC08_003`, `TC_UC10_003`, `TC_UC10_004` |

---

## 4. HƯỚNG DẪN THỰC THI JEST & XUẤT TẬP TIN KẾT QUẢ TEST LOG (JEST EXECUTION & LOG EXPORT)

### 4.1. Lệnh thực thi Kiểm thử Jest trong Terminal

1. Mở Terminal, di chuyển vào thư mục backend core:
   ```bash
   cd src/backend-core
   ```
2. Thực thi toàn bộ bộ kiểm thử đơn vị & kiểm thử tích hợp (35 Test Cases) của module Booking:
   ```bash
   npx jest src/modules/booking/__tests__
   ```
3. Chạy hiển thị chi tiết tên từng câu test (Verbose Mode):
   ```bash
   npx jest src/modules/booking/__tests__ --verbose
   ```

---

### 4.2. Cách ghi và lưu Kết quả chạy Jest ra Tập tin Log / Report

#### 🔹 Phương án 1: Xuất tập tin Log dạng Text/Markdown hiển thị toàn bộ 35 Test Case
Sử dụng lệnh điều hướng Output (Redirection `2>&1`) trên Terminal để ghi đè toàn bộ stdout/stderr vào tập tin nhật ký:
```bash
cmd /c "npx jest src/modules/booking/__tests__ --verbose > ../../docs/test/jest_booking_results.log 2>&1"
```
📌 **Đường dẫn tập tin Log đầu ra:** [`docs/test/jest_booking_results.log`](file:///d:/Lifeline/SE-LifeLine-Project/docs/test/jest_booking_results.log)

#### 🔹 Phương án 2: Xuất tập tin Báo cáo dạng JSON chuẩn SQA
Sử dụng cờ `--json` và `--outputFile` của Jest:
```bash
npx jest src/modules/booking/__tests__ --json --outputFile=../../docs/test/jest_booking_report.json
```

#### 🔹 Phương án 3: Cấu hình npm script tiện ích trong `package.json`
Thêm các lệnh sau vào mục `"scripts"` của file `src/backend-core/package.json`:
```json
"scripts": {
  "test:booking": "jest src/modules/booking/__tests__ --verbose",
  "test:booking:export": "cmd /c \"jest src/modules/booking/__tests__ --verbose > ../../docs/test/jest_booking_results.log 2>&1\""
}
```
Sau đó có thể thực thi đơn giản bằng lệnh:
```bash
npm run test:booking:export
```

