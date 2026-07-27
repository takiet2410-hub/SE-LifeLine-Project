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
**Ngày tạo:** 25/07/2026  
**Phiên bản:** 1.0  
**Tác giả:** Antigravity AI - Software Quality Assurance  

---

## 1. MAPPING YÊU CẦU & BẢNG TỔNG QUAN TEST CASES

| STT | Use Case | ID Test Case | Tên Test Case | Loại Test | Độ ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | LL-UC-06 | `TC_UC06_001` | Tìm điểm hiến máu gần nhất bằng định vị GPS tự động | Functional | High |
| 2 | LL-UC-06 | `TC_UC06_002` | Tìm điểm hiến máu thủ công khi từ chối quyền truy cập GPS | Functional | High |
| 3 | LL-UC-06 | `TC_UC06_003` | Lọc địa điểm hiến máu theo Bán kính, Ngày, Nhóm máu, Mức độ đông đúc | Functional | Medium |
| 4 | LL-UC-06 | `TC_UC06_004` | Xử lý ngoại lệ: Không tìm thấy chiến dịch hiến máu nào trong bán kính chọn | Exception | Medium |
| 5 | LL-UC-06 | `TC_UC06_005` | Kiểm tra thời gian tải dữ liệu bản đồ (<= 1s) | Performance | Medium |
| 6 | LL-UC-07 | `TC_UC07_001` | Yêu cầu đăng nhập trước khi thực hiện đặt lịch hẹn | Security / BR | High |
| 7 | LL-UC-07 | `TC_UC07_002` | Đặt lịch hẹn thành công với thông tin & điều kiện hợp lệ | Functional | Critical |
| 8 | LL-UC-07 | `TC_UC07_003` | Từ chối đặt lịch khi khoảng cách lần hiến máu gần nhất < 84 ngày | Business Rule | High |
| 9 | LL-UC-07 | `TC_UC07_004` | Chặn đặt trùng/đè khoảng thời gian lịch hẹn đang có hiệu lực | Business Rule | High |
| 10 | LL-UC-07 | `TC_UC07_005` | Chặn đặt lịch vào đợt/khung giờ hiến máu đã hết slot | Business Rule | High |
| 11 | LL-UC-07 | `TC_UC07_006` | Kiểm tra đồng thời (Race Condition) khi 2 người cùng chọn 1 slot cuối | Concurrency | High |
| 12 | LL-UC-07 | `TC_UC07_007` | Điền Form sàng lọc đạt (PASS) -> Cho phép tiếp tục xác nhận lịch hẹn | Functional | Critical |
| 13 | LL-UC-07 | `TC_UC07_008` | Điền Form sàng lọc cần đánh giá (REVIEW) -> Đánh dấu chờ duyệt y tế | Functional | High |
| 14 | LL-UC-07 | `TC_UC07_009` | Điền Form sàng lọc không đạt (REJECT) -> Chặn đặt lịch hẹn | Functional / BR | High |
| 15 | LL-UC-07 | `TC_UC07_010` | Bỏ trống câu hỏi bắt buộc trong Form sàng lọc tiền hiến máu | Boundary | Medium |
| 16 | LL-UC-07 | `TC_UC07_011` | Cố gắng đặt lịch hẹn cho chiến dịch đã kết thúc hoặc bị vô hiệu hóa | Exception | High |
| 17 | LL-UC-07 | `TC_UC07_012` | Kiểm tra thời gian hoàn tất xác nhận lịch hẹn (<= 5s) | Performance | High |
| 18 | LL-UC-07 | `TC_UC07_013` | Tính nguyên tố Transaction (Atomic) khi xảy ra lỗi kết nối lúc đặt | Reliability | High |
| 19 | LL-UC-08 | `TC_UC08_001` | Xem chi tiết lịch hẹn đã đặt (Thời gian, Địa điểm, QR code, Trạng thái) | Functional | High |
| 20 | LL-UC-08 | `TC_UC08_002` | Xem danh sách lịch sử lịch hẹn (Sắp tới, Đã hoàn thành, Đã hủy) | Functional | Medium |
| 21 | LL-UC-08 | `TC_UC08_003` | Kiểm tra phâm quyền: Người dùng không thể xem lịch hẹn của người khác | Security | High |
| 22 | LL-UC-09 | `TC_UC09_001` | Hủy lịch hẹn thành công trước thời hạn quy định (> 24 giờ) | Functional | High |
| 23 | LL-UC-09 | `TC_UC09_002` | Từ chối hủy lịch hẹn khi đã sát giờ hẹn (< 24 giờ) | Business Rule | High |
| 24 | LL-UC-09 | `TC_UC09_003` | Thao tác hủy đối với lịch hẹn đã bị hủy trước đó | Exception | Low |
| 25 | LL-UC-09 | `TC_UC09_004` | Kiểm tra hoàn trả capacity của chiến dịch ngay sau khi hủy thành công | Functional / BR | High |
| 26 | LL-UC-10 | `TC_UC10_001` | Tải xuống E-Ticket dạng tập tin PDF thành công | Functional | High |
| 27 | LL-UC-10 | `TC_UC10_002` | Xem mã QR E-ticket trực tiếp trên ứng dụng | Functional | High |
| 28 | LL-UC-10 | `TC_UC10_003` | Kiểm tra tính duy nhất và chữ ký số mật mã của QR Code E-ticket | Security / Algo | High |
| 29 | LL-UC-10 | `TC_UC10_004` | Kiểm tra thời gian sinh/xuất file E-ticket (<= 5s) | Performance | Medium |

---

## 2. CHI TIẾT CÁC TEST CASES

### UC-06: TÌM KIẾM & XEM ĐIỂM HIẾN MÁU (BROWSE LOCATIONS)

#### `TC_UC06_001`: Tìm điểm hiến máu gần nhất bằng định vị GPS tự động
- **Loại test:** Functional
- **Độ ưu tiên:** High
- **Tiền điều kiện:** 
  1. Người dùng đã mở ứng dụng.
  2. Quyền vị trí (GPS) trên thiết bị được BẬT (Granted).
- **Các bước thực hiện:**
  1. Vào màn hình "Đăng ký hiến máu / Tìm điểm hiến".
  2. Hệ thống yêu cầu xác định vị trí hiện tại.
  3. Chọn xác nhận cho phép lấy vị trí hiện tại.
- **Dữ liệu test:** Tọa độ GPS hiện tại (VD: 10.7769, 106.7009 - Q1, TP.HCM).
- **Kết quả mong đợi:** 
  - Bản đồ tự động canh giữa (center) tại tọa độ của người dùng.
  - Hiển thị danh sách và pin vị trí của các đợt/điểm hiến máu đang hoạt động gần nhất trên bản đồ.

---

#### `TC_UC06_002`: Tìm điểm hiến máu thủ công khi từ chối quyền truy cập GPS
- **Loại test:** Functional
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Quyền vị trí GPS bị TẮT (Denied).
- **Các bước thực hiện:**
  1. Vào màn hình "Tìm điểm hiến".
  2. Bỏ qua thông báo cấp quyền vị trí.
  3. Nhập từ khóa tìm kiếm vào ô địa chỉ/khu vực: "Quận 5, TP. Hồ Chí Minh".
  4. Bấm nút "Tìm kiếm".
- **Dữ liệu test:** Text input = `"Quận 5, TP. Hồ Chí Minh"`.
- **Kết quả mong đợi:**
  - Bản đồ di chuyển đến vị trí Quận 5.
  - Hiển thị đầy đủ danh sách các địa điểm hiến máu nằm trong khu vực Quận 5.

---

#### `TC_UC06_003`: Lọc địa điểm hiến máu theo Bán kính, Ngày, Nhóm máu, Mức độ đông đúc
- **Loại test:** Functional
- **Độ ưu tiên:** Medium
- **Tiền điều kiện:** Người dùng đang ở màn hình bản đồ điểm hiến máu.
- **Các bước thực hiện:**
  1. Mở bộ lọc tìm kiếm (Filter drawer/modal).
  2. Chọn Bán kính: `5km`.
  3. Chọn Ngày hiến: `28/07/2026`.
  4. Chọn Nhóm máu ưu tiên cần: `O+`.
  5. Chọn Mức độ đông đúc: `Thấp / Vừa phải`.
  6. Bấm "Áp dụng bộ lọc".
- **Dữ liệu test:** Radius = 5km, Date = 28/07/2026, BloodType = O+, Crowding = Low.
- **Kết quả mong đợi:**
  - Danh sách điểm hiến máu được cập nhật chính xác chỉ chứa các đợt hiến máu thỏa mãn đồng thời cả 4 điều kiện trên.

---

#### `TC_UC06_004`: Xử lý ngoại lệ: Không tìm thấy chiến dịch hiến máu nào trong bán kính chọn
- **Loại test:** Exception
- **Độ ưu tiên:** Medium
- **Tiền điều kiện:** Không có chiến dịch nào diễn ra ở khu vực lân cận trong khoảng thời gian lọc.
- **Các bước thực hiện:**
  1. Nhập vị trí hoặc chọn bán kính lọc nhỏ (`1km`) tại vùng không có chiến dịch.
  2. Bấm áp dụng.
- **Kết quả mong đợi:**
  - Hiển thị thông báo thân thiện: "Không tìm thấy điểm hiến máu phù hợp trong khu vực này. Vui lòng mở rộng bán kính hoặc chọn ngày khác."
  - Không bị crash hoặc màn hình trắng.

---

#### `TC_UC06_005`: Kiểm tra thời gian tải dữ liệu bản đồ (NFR-001)
- **Loại test:** Performance
- **Độ ưu tiên:** Medium
- **Tiền điều kiện:** Mạng ổn định (>= 10 Mbps).
- **Các bước thực hiện:**
  1. Mở màn hình bản đồ điểm hiến máu.
  2. Đo thời gian từ lúc gửi request API lấy danh sách vị trí đến khi toàn bộ marker/pin render xong trên bản đồ.
- **Kết quả mong đợi:** Tổng thời gian tải và hiển thị bản đồ <= **1.0 giây**.

---

### UC-07: ĐẶT LỊCH HẸN HIẾN MÁU (BOOK APPOINTMENT) & SYS-UC-01

#### `TC_UC07_001`: Yêu cầu đăng nhập trước khi thực hiện đặt lịch hẹn (BR-001)
- **Loại test:** Security / Business Rule
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Người dùng chưa đăng nhập tài khoản (Guest/Anonymous).
- **Các bước thực hiện:**
  1. Chọn 1 điểm hiến máu trên bản đồ.
  2. Chọn khung giờ hiến.
  3. Bấm nút "Đặt lịch hẹn".
- **Kết quả mong đợi:**
  - Hệ thống chuyển hướng người dùng đến màn hình Đăng nhập (Login form).
  - Hiển thị thông báo: "Vui lòng đăng nhập để thực hiện đặt lịch hiến máu."
  - Sau khi đăng nhập thành công, giữ nguyên thông tin điểm hiến đã chọn để người dùng tiếp tục.

---

#### `TC_UC07_002`: Đặt lịch hẹn thành công với thông tin & điều kiện hợp lệ
- **Loại test:** Functional (Happy Path)
- **Độ ưu tiên:** Critical
- **Tiền điều kiện:**
  1. Donor đã đăng nhập.
  2. Lần hiến máu gần nhất > 84 ngày (hoặc chưa từng hiến máu).
  3. Chiến dịch `CAMP_2026_01` còn slot (vd: còn 10/100 chỗ).
- **Các bước thực hiện:**
  1. Chọn chiến dịch `CAMP_2026_01`, địa điểm "Bệnh viện Chợ Rẫy".
  2. Chọn ngày `28/07/2026`, khung giờ `08:00 - 09:00`.
  3. Điền Form sàng lọc tiền hiến máu (Chọn tất cả câu trả lời là "Không").
  4. Xác nhận đăng ký.
- **Dữ liệu test:** Donor ID `DN_1001`, Campaign `CAMP_2026_01`, Slot `08:00-09:00 28/07/2026`.
- **Kết quả mong đợi:**
  - Tạo thành công record Appointment trạng thái `CONFIRMED`.
  - Giảm slot khả dụng của khung giờ từ 10 xuống 9.
  - Tự động sinh mã E-Ticket có gắn QR Code.
  - Hiển thị màn hình Xác nhận Đặt lịch thành công.

---

#### `TC_UC07_003`: Từ chối đặt lịch khi khoảng cách lần hiến máu gần nhất < 84 ngày (BR-004)
- **Loại test:** Business Rule
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Donor vừa hiến máu cách đây 50 ngày (ngày hiến gần nhất: 05/06/2026).
- **Các bước thực hiện:**
  1. Đăng nhập bằng tài khoản Donor trên.
  2. Chọn chiến dịch hiến máu ngày `28/07/2026`.
  3. Bấm "Đặt lịch hẹn".
- **Dữ liệu test:** LastDonationDate = `05/06/2026`, BookingDate = `28/07/2026` (Khoảng cách 53 ngày < 84 ngày).
- **Kết quả mong đợi:**
  - Hệ thống chặn không cho đặt lịch.
  - Hiển thị thông báo lỗi: "Bạn chưa đủ khoảng cách tối thiểu giữa 2 lần hiến máu (84 ngày). Ngày bạn có thể hiến máu tiếp theo là từ: 28/08/2026."

---

#### `TC_UC07_004`: Chặn đặt trùng/đè khoảng thời gian lịch hẹn đang có hiệu lực (BR-005)
- **Loại test:** Business Rule
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Donor đã có 1 lịch hẹn đang ở trạng thái `CONFIRMED` vào ngày `28/07/2026` lúc `09:00 - 10:00`.
- **Các bước thực hiện:**
  1. Đăng nhập tài khoản.
  2. Chọn một chiến dịch/điểm hiến khác cùng ngày `28/07/2026` khung giờ `09:30 - 10:30`.
  3. Tiến hành đặt lịch.
- **Kết quả mong đợi:**
  - Hệ thống kiểm tra trùng lịch (Overlap check) và báo lỗi: "Bạn đã có lịch hẹn hiến máu trùng khung giờ vào ngày 28/07/2026. Vui lòng kiểm tra lại danh sách lịch hẹn."

---

#### `TC_UC07_005`: Chặn đặt lịch vào đợt/khung giờ hiến máu đã hết slot (BR-003)
- **Loại test:** Business Rule
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Khung giờ `10:00 - 11:00` của chiến dịch A đã đạt tối đa số lượng (AvailableSlots = 0).
- **Các bước thực hiện:**
  1. Chọn chiến dịch A, ngày hiến.
  2. Quan sát khung giờ `10:00 - 11:00`.
  3. Thử chọn và bấm Đặt lịch (nếu giao diện chưa disabled) hoặc gọi API đăng ký khung giờ này.
- **Kết quả mong đợi:**
  - Trên UI: Khung giờ hết chỗ hiển thị nhãn "Đã hết chỗ / Full" và bị disable không click được.
  - Trên API: Trả về HTTP status 400/409 với message: "Khung giờ được chọn đã hết chỗ."

---

#### `TC_UC07_006`: Kiểm tra đồng thời (Race Condition) khi 2 người cùng chọn 1 slot cuối
- **Loại test:** Concurrency / Reliability
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Khung giờ `14:00 - 15:00` chỉ còn duy nhất **1 slot** cuối cùng.
- **Các bước thực hiện:**
  1. Hai Donor A và B cùng mở màn hình đặt lịch ở khung giờ trên.
  2. Donor A và Donor B nhấn nút "Xác nhận đặt lịch" gần như đồng thời (cách nhau milisecond).
- **Kết quả mong đợi:**
  - Chỉ 1 Donor (VD: Donor A) đặt lịch thành công.
  - Donor còn lại (Donor B) nhận thông báo lỗi: "Slot vừa chọn đã có người đăng ký trước. Vui lòng chọn khung giờ khác."
  - Số slot khả dụng không bị âm (AvailableSlots = 0).

---

#### `TC_UC07_007`: Điền Form sàng lọc đạt (PASS) -> Cho phép xác nhận lịch hẹn (SYS-UC-01)
- **Loại test:** Functional
- **Độ ưu tiên:** Critical
- **Tiền điều kiện:** Đang ở bước điền Form sàng lọc tiền hiến máu (Pre-donation Screening Form).
- **Các bước thực hiện:**
  1. Chọn tất cả các câu hỏi sức khỏe là "Không" (Không mắc bệnh truyền nhiễm, không dùng kháng sinh 7 ngày qua, cân nặng > 45kg,...).
  2. Bấm nút "Gửi form & Xác nhận".
- **Kết quả mong đợi:**
  - Ghi nhận trạng thái kết quả Form sàng lọc: `PASS`.
  - Cho phép hệ thống thực hiện bước tiếp theo là chốt đặt lịch hẹn và sinh E-ticket.

---

#### `TC_UC07_008`: Điền Form sàng lọc cần đánh giá (REVIEW) (FR-009d)
- **Loại test:** Functional
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Đang ở bước điền Form sàng lọc.
- **Các bước thực hiện:**
  1. Ở câu hỏi "Bạn có đang sử dụng thuốc điều trị nào không?", chọn "Có / Khác" và ghi rõ "Thuốc bổ vitamin C".
  2. Các câu hỏi nguy cơ khác chọn "Không".
  3. Bấm nút "Gửi form".
- **Kết quả mong đợi:**
  - Trạng thái Screening Form được lưu là `REVIEW` (Cần bác sĩ tư vấn tại điểm hiến).
  - Lịch hẹn vẫn được tạo nhưng kèm lưu ý: "Cần tham vấn y tế trực tiếp trước khi hiến máu."

---

#### `TC_UC07_009`: Điền Form sàng lọc không đạt (REJECT) -> Chặn đặt lịch hẹn (FR-009d)
- **Loại test:** Functional / Business Rule
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Đang ở bước điền Form sàng lọc.
- **Các bước thực hiện:**
  1. Tích "Có" ở câu hỏi: "Bạn có mới xăm hình trong vòng 6 tháng qua không?" hoặc "Đang bị sốt / nhiễm trùng".
  2. Bấm "Gửi form & Đặt lịch".
- **Kết quả mong đợi:**
  - Kết quả đánh giá Form sàng lọc: `REJECT` (Tạm hoãn hiến máu).
  - Hệ thống ngăn chặn việc tạo lịch hẹn.
  - Hiển thị thông tin giải thích: "Theo quy định hiến máu, bạn chưa đủ điều kiện hiến máu đợt này do mới xăm hình dưới 6 tháng. Cảm ơn tấm lòng của bạn!"

---

#### `TC_UC07_010`: Bỏ trống câu hỏi bắt buộc trong Form sàng lọc tiền hiến máu
- **Loại test:** Boundary / Validation
- **Các bước thực hiện:**
  1. Mở Form sàng lọc.
  2. Bỏ qua 2 câu hỏi bắt buộc (không chọn Có cũng không chọn Không).
  3. Bấm nút "Tiếp tục".
- **Kết quả mong đợi:**
  - Hệ thống cuộn đến vị trí câu hỏi chưa điền và highlight viền đỏ.
  - Hiển thị thông báo: "Vui lòng trả lời đầy đủ các câu hỏi sàng lọc sức khỏe bắt buộc."

---

#### `TC_UC07_011`: Cố gắng đặt lịch hẹn cho chiến dịch đã kết thúc hoặc bị vô hiệu hóa
- **Loại test:** Exception
- **Tiền điều kiện:** Chiến dịch `CAMP_OLD` đã hết hạn đăng ký từ ngày hôm qua hoặc bị Admin ẩn.
- **Các bước thực hiện:**
  1. Thao tác gọi API đặt lịch gửi mã `CAMP_OLD`.
- **Kết quả mong đợi:**
  - Hệ thống từ chối yêu cầu và trả về thông báo lỗi: "Chiến dịch hiến máu này đã đóng đăng ký hoặc không còn hoạt động."

---

#### `TC_UC07_012`: Kiểm tra thời gian hoàn tất xác nhận lịch hẹn (NFR-002)
- **Loại test:** Performance
- **Độ ưu tiên:** High
- **Các bước thực hiện:**
  1. Thực hiện bấm nút "Xác nhận đặt lịch" ở bước cuối cùng.
  2. Đo thời gian phản hồi API (bao gồm lưu DB, lưu Form sàng lọc và tạo E-ticket).
- **Kết quả mong đợi:** Thời gian phản hồi hoàn tất <= **5.0 giây**.

---

#### `TC_UC07_013`: Tính nguyên tố Transaction (Atomic) khi xảy ra lỗi mid-booking (NFR-004)
- **Loại test:** Reliability / Transaction Integrity
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Giả lập lỗi ở bước cuối (VD: Service QR Code bị die/timeout hoặc rớt mạng khi đang ghi DB).
- **Các bước thực hiện:**
  1. Tiến hành đặt lịch hẹn.
  2. Hệ thống gặp sự cố ở bước sinh E-ticket.
- **Kết quả mong đợi:**
  - Cơ chế Rollback tự động kích hoạt.
  - Slot đã giữ được hoàn trả lại cho chiến dịch.
  - Không tạo ra bất kỳ dữ liệu rác (Orphaned Appointment / Unlinked Screening Form) nào trong cơ sở dữ liệu.

---

### UC-08: XEM CHI TIẾT & LỊCH SỬ LỊCH HẸN (VIEW APPOINTMENT)

#### `TC_UC08_001`: Xem chi tiết lịch hẹn đã đặt thành công
- **Loại test:** Functional
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Donor có 1 lịch hẹn trạng thái `CONFIRMED`.
- **Các bước thực hiện:**
  1. Vào menu "Lịch hẹn của tôi".
  2. Nhấp vào thẻ lịch hẹn sắp tới.
- **Kết quả mong đợi:**
  - Giao diện hiển thị đầy đủ các thông tin:
    - Tên chiến dịch / Bệnh viện
    - Địa điểm chi tiết (Địa chỉ, đường đi)
    - Ngày & Khung giờ hẹn
    - Trạng thái lịch hẹn (`Đã xác nhận`)
    - Mã lịch hẹn / Mã E-ticket
    - Hiển thị QR Code để check-in

---

#### `TC_UC08_002`: Xem danh sách lịch sử lịch hẹn
- **Loại test:** Functional
- **Độ ưu tiên:** Medium
- **Tiền điều kiện:** Donor đã có 3 lịch hẹn: 1 Sắp tới, 1 Đã hoàn thành, 1 Đã hủy.
- **Các bước thực hiện:**
  1. Mở màn hình "Lịch sử lịch hẹn".
  2. Chuyển đổi giữa các tab lọc: "Sắp tới", "Đã hoàn thành", "Đã hủy".
- **Kết quả mong đợi:**
  - Mỗi tab hiển thị chính xác các lịch hẹn tương ứng với đúng trạng thái.
  - Thông tin hiển thị rõ ràng, sắp xếp theo thời gian mới nhất lên đầu.

---

#### `TC_UC08_003`: Kiểm tra phân quyền truy cập lịch hẹn (NFR-006)
- **Loại test:** Security
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Donor A có `Appointment_ID_A = 1001`. Donor B đang đăng nhập.
- **Các bước thực hiện:**
  1. Donor B thử thay đổi URL/API ID thành `GET /api/v1/appointments/1001` để xem lịch hẹn của Donor A.
- **Kết quả mong đợi:**
  - Hệ thống trả về lỗi `HTTP 403 Forbidden` hoặc `HTTP 404 Not Found`.
  - Hiển thị thông báo: "Bạn không có quyền truy cập thông tin lịch hẹn này."

---

### UC-09: HỦY LỊCH HẸN (CANCEL APPOINTMENT)

#### `TC_UC09_001`: Hủy lịch hẹn thành công trước thời hạn quy định (> 24 giờ)
- **Loại test:** Functional
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Lịch hẹn diễn ra vào lúc `09:00 ngày 28/07/2026`. Thời điểm thực hiện hủy: `10:00 ngày 25/07/2026` (Trước 71 giờ > 24 giờ).
- **Các bước thực hiện:**
  1. Vào Chi tiết lịch hẹn.
  2. Bấm nút "Hủy lịch hẹn".
  3. Chọn lý do hủy (VD: "Có việc đột xuất") và xác nhận.
- **Kết quả mong đợi:**
  - Lịch hẹn cập nhật trạng thái thành `CANCELLED`.
  - Tự động cộng lại 1 slot khả dụng cho chiến dịch.
  - Mã E-ticket tương ứng bị vô hiệu hóa (Invalidated).
  - Hiển thị thông báo hủy lịch thành công.

---

#### `TC_UC09_002`: Từ chối hủy lịch hẹn khi đã sát giờ hẹn (< 24 giờ) (BR-006)
- **Loại test:** Business Rule
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Lịch hẹn diễn ra vào `08:00 ngày 26/07/2026`. Thời điểm bấm hủy: `14:00 ngày 25/07/2026` (Còn 18 giờ < 24 giờ).
- **Các bước thực hiện:**
  1. Mở màn hình Chi tiết lịch hẹn.
  2. Nhấn "Hủy lịch hẹn".
- **Kết quả mong đợi:**
  - Nút Hủy bị ẩn/disabled hoặc hiển thị cảnh báo: "Lịch hẹn chỉ được phép hủy trước 24 giờ so với thời điểm hiến máu. Vui lòng liên hệ hotline ban tổ chức nếu cần hỗ trợ khẩn cấp."

---

#### `TC_UC09_003`: Thao tác hủy đối với lịch hẹn đã bị hủy trước đó
- **Loại test:** Exception
- **Các bước thực hiện:**
  1. Gửi request API hủy lại một lịch hẹn đã có trạng thái `CANCELLED`.
- **Kết quả mong đợi:**
  - Hệ thống trả lỗi `HTTP 400 Bad Request`: "Lịch hẹn này đã được hủy trước đó."

---

#### `TC_UC09_004`: Kiểm tra hoàn trả capacity của chiến dịch ngay sau khi hủy thành công (BR-007)
- **Loại test:** Functional / Data Integrity
- **Các bước thực hiện:**
  1. Kiểm tra số slot khả dụng đợt hiến X (VD: 5 slot).
  2. Donor thực hiện hủy 1 lịch hẹn thuộc đợt hiến X thành công.
  3. Kiểm tra lại số slot khả dụng đợt hiến X.
- **Kết quả mong đợi:** Số slot khả dụng tăng chính xác lên 6 slot ngay lập tức.

---

### UC-10: TẢI & HIỂN THỊ E-TICKET (DOWNLOAD E-TICKET) & SYS-UC-02

#### `TC_UC10_001`: Tải xuống E-Ticket dạng tập tin PDF thành công
- **Loại test:** Functional
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Lịch hẹn đã ở trạng thái `CONFIRMED`.
- **Các bước thực hiện:**
  1. Mở Chi tiết lịch hẹn.
  2. Bấm nút "Tải E-Ticket (PDF)".
- **Kết quả mong đợi:**
  - Tập tin PDF được tải về thiết bị thành công (tên file chứa mã ticket).
  - Nội dung file PDF chứa: Họ tên donor, Nhóm máu, Ngày/Giờ/Địa điểm hiến máu, Mã QR Code rõ nét và thông tin hướng dẫn chuẩn bị trước khi hiến.

---

#### `TC_UC10_002`: Xem mã QR E-ticket trực tiếp trên ứng dụng
- **Loại test:** Functional
- **Độ ưu tiên:** High
- **Các bước thực hiện:**
  1. Nhấp vào mục "Xem vé E-ticket" trong chi tiết lịch hẹn.
- **Kết quả mong đợi:**
  - Hiển thị E-ticket dạng pop-up/fullscreen với độ sáng màn hình tự động tăng để quét QR thuận tiện.

---

#### `TC_UC10_003`: Kiểm tra tính duy nhất và chữ ký số mật mã của QR Code E-ticket (NFR-007)
- **Loại test:** Security / Algorithm
- **Độ ưu tiên:** High
- **Tiền điều kiện:** Đã tạo 2 E-ticket cho 2 lịch hẹn khác nhau.
- **Các bước thực hiện:**
  1. Dùng công cụ quét mã QR đọc nội dung raw chuỗi mã hóa của 2 QR code.
  2. Dùng Staff App giải mã kiểm tra chữ ký số (Signed QR Payload).
- **Kết quả mong đợi:**
  - Hai chuỗi payload QR hoàn toàn khác biệt và là duy nhất.
  - Chữ ký số khớp với public key của hệ thống, không bị làm giả hay chỉnh sửa thông tin bên trong.

---

#### `TC_UC10_004`: Kiểm tra thời gian sinh/xuất file E-ticket (NFR-003)
- **Loại test:** Performance
- **Độ ưu tiên:** Medium
- **Các bước thực hiện:**
  1. Đo thời gian từ lúc bấm "Tải E-Ticket" đến khi file PDF được tải hoàn tất.
- **Kết quả mong đợi:** Thời gian thực thi <= **5.0 giây**.

---

## 3. MA TRẬN PHỦ YÊU CẦU TRONG TEST SUITE (TEST COVERAGE MATRIX)

| Mã Yêu cầu (Requirement ID) | Các Test Case tương ứng |
| :--- | :--- |
| **FR-001** (Map display) | `TC_UC06_001`, `TC_UC06_002` |
| **FR-002** (Search & Filter) | `TC_UC06_003`, `TC_UC06_004` |
| **FR-003** (GPS & Manual location) | `TC_UC06_001`, `TC_UC06_002` |
| **FR-004** (Authentication validation) | `TC_UC07_001` |
| **FR-005** (Eligibility validation) | `TC_UC07_002`, `TC_UC07_003`, `TC_UC07_007`, `TC_UC07_009` |
| **FR-006** (Prevent overlap) | `TC_UC07_004` |
| **FR-007** (Reserve slot) | `TC_UC07_002`, `TC_UC07_006` |
| **FR-008** (Update capacity) | `TC_UC07_002`, `TC_UC09_001`, `TC_UC09_004` |
| **FR-009 / SYS-UC-01** (Screening Form) | `TC_UC07_007`, `TC_UC07_008`, `TC_UC07_009`, `TC_UC07_010` |
| **FR-010 / SYS-UC-02** (E-Ticket generation) | `TC_UC07_002`, `TC_UC10_001`, `TC_UC10_003` |
| **FR-011 & FR-012** (View appointment details & history) | `TC_UC08_001`, `TC_UC08_002` |
| **FR-013, 014, 015** (Cancel appointment) | `TC_UC09_001`, `TC_UC09_002`, `TC_UC09_003`, `TC_UC09_004` |
| **FR-016, 017, 018** (Download & View E-ticket) | `TC_UC10_001`, `TC_UC10_002`, `TC_UC10_003` |
| **NFR-001 đến NFR-008** (Performance, Security, Atomic) | `TC_UC06_005`, `TC_UC07_012`, `TC_UC07_013`, `TC_UC08_003`, `TC_UC10_003`, `TC_UC10_004` |
