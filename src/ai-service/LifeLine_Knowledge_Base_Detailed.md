# LifeLine — Knowledge Base Specification for Donor AI

Version: 1.0

This package contains 25 curated knowledge documents for the current LifeLine RAG system.

## Source policy
- Primary local medical source: Viện Huyết học – Truyền máu Trung ương (NIHBT).
- General international reference: World Health Organization (WHO).
- Product behavior: LifeLine Project Plan / Use Case Specification.
- Medical rules must be reviewed when the official source changes.

## Critical AI safety rules
1. The chatbot provides information and guidance; it does not make a medical diagnosis or replace donor screening.
2. A booking/e-ticket is not proof of medical eligibility.
3. Never tell a donor to stop, reduce, or change medication to become eligible.
4. Never invent a waiting period when the KB does not contain a verified rule.
5. If a question depends on a specific disease, medicine, vaccine, procedure, pregnancy/postpartum status, tattoo/piercing, or exposure and no verified rule is retrieved, route to medical staff.
6. For current campaign, appointment, donor profile, blood inventory, or other changing data, use structured MongoDB retrieval instead of static KB.
7. If retrieval confidence is insufficient, use the application's safe fallback instead of guessing.

## Documents

## KB-EL-001 — Điều kiện chung để hiến máu
**Category:** `Eligibility`

Mục đích: Cung cấp thông tin nền tảng để donor hiểu rằng việc đủ điều kiện hiến máu phải được đánh giá theo tiêu chuẩn của cơ sở tiếp nhận và kết quả khám tuyển tại thời điểm hiến.

Nội dung:
- Người hiến máu cần ở trạng thái sức khỏe phù hợp tại thời điểm đăng ký và không có yếu tố khiến việc hiến máu gây nguy cơ không phù hợp cho bản thân hoặc người nhận máu.
- Donor phải khai báo trung thực về tiền sử bệnh, tình trạng sức khỏe hiện tại, thuốc đang sử dụng, các can thiệp y tế gần đây, tiêm chủng, xăm/xỏ khuyên, phơi nhiễm và các yếu tố liên quan.
- Cơ sở tiếp nhận sẽ thực hiện đăng ký, khai thác tiền sử, khám/sàng lọc và các xét nghiệm cần thiết trước khi quyết định donor có được hiến hay không.
- Theo hướng dẫn của Viện Huyết học – Truyền máu Trung ương đang được sử dụng làm nguồn tham khảo cho LifeLine, tiêu chuẩn cơ bản bao gồm tuổi, cân nặng, huyết sắc tố và các yếu tố nguy cơ lây truyền qua đường máu. Một tài liệu hướng dẫn của Viện nêu độ tuổi 18–60, cân nặng từ 42 kg với nữ và 45 kg với nam; khoảng cách hiến máu toàn phần là 12 tuần. Khi triển khai thực tế, các ngưỡng này phải được cấu hình theo quy định hiện hành của cơ sở tiếp nhận.
- Không được coi việc vượt qua một vài điều kiện cơ bản là bằng chứng chắc chắn rằng donor được phép hiến. Kết luận cuối cùng thuộc về nhân viên y tế tại điểm hiến.
- Nếu donor đang không khỏe, đang điều trị bệnh, vừa trải qua thủ thuật/phẫu thuật, đang dùng thuốc hoặc có tình trạng đặc biệt, chatbot không được tự kết luận đủ điều kiện nếu KB không có quy định phù hợp.
- LifeLine có thể sử dụng dateOfBirth, lastDonationDate và các thông tin screening cần thiết để hỗ trợ cá nhân hóa, nhưng không được thay thế khám tuyển trực tiếp.

Nguyên tắc trả lời:
1. Phân biệt "điều kiện tham khảo" và "kết luận đủ điều kiện".
2. Không khẳng định donor chắc chắn được hiến chỉ từ thông tin tự khai.
3. Nếu thiếu thông tin quan trọng, hỏi thêm hoặc hướng donor tới sàng lọc tại điểm hiến.
4. Nếu câu hỏi liên quan đến một bệnh/thuốc/vaccine cụ thể, ưu tiên KB-EL-004/005/006.

---

## KB-EL-002 — Khoảng cách giữa các lần hiến máu
**Category:** `Eligibility`

Mục đích: Giải thích khoảng thời gian tối thiểu giữa các lần hiến và cách LifeLine kiểm tra điều kiện theo lịch sử donor.

Nội dung:
- Việc được hiến lại phụ thuộc vào loại hiến, lần hiến gần nhất, tình trạng sức khỏe hiện tại và quy định của cơ sở tiếp nhận.
- Trong thiết kế LifeLine hiện tại, lịch hẹn hiến máu toàn phần kiểm tra khoảng cách 84 ngày kể từ lần hiến máu gần nhất. Use Case Schedule Appointment của LifeLine quy định hệ thống không cho tiếp tục đặt lịch nếu chưa đủ khoảng thời gian này.
- Một số tài liệu của Viện Huyết học – Truyền máu Trung ương diễn đạt khoảng cách hiến máu toàn phần là 12 tuần; một số nội dung của Viện cũng sử dụng mốc 84 ngày. Vì vậy, hệ thống nên lưu một cấu hình eligibility thay vì rải con số trong code.
- Không được áp dụng quy tắc 84 ngày cho mọi loại hiến nếu loại hiến khác có quy định riêng.
- Nếu donor hỏi "tôi được hiến lại ngày nào", chatbot phải lấy lastDonationDate từ dữ liệu được phép truy cập và tính ngày đủ điều kiện theo rule hiện hành; không tự đoán từ lịch sử hội thoại.
- Nếu không có lastDonationDate hoặc dữ liệu lịch sử không chắc chắn, chatbot không được tự tạo ngày.
- Nếu donor đã đủ khoảng cách nhưng đang có bệnh, dùng thuốc, mới tiêm vaccine hoặc có yếu tố trì hoãn khác, vẫn phải kiểm tra các điều kiện còn lại.
- Nếu donor có appointment đã đặt trong thời gian chưa đủ điều kiện, hệ thống đặt lịch phải chặn theo business rule thay vì để chatbot quyết định.

Ví dụ:
- "Tôi hiến ngày 1/6, bao giờ hiến lại?" → lấy lastDonationDate thực tế, áp dụng configured donation interval, trả ngày đủ điều kiện và nhắc rằng còn phải qua sàng lọc.
- "Tôi hiến tiểu cầu bao lâu được hiến lại?" → không áp dụng rule whole-blood 84 ngày; phải dùng rule riêng nếu hệ thống có cấu hình.

---

## KB-EL-003 — Sàng lọc sức khỏe trước khi hiến máu
**Category:** `Eligibility`

Mục đích: Giải thích vai trò của screening và những thông tin donor cần khai báo.

Nội dung:
- Sàng lọc trước hiến nhằm bảo vệ cả donor và người nhận máu.
- Donor cần trả lời trung thực các câu hỏi về tiền sử bệnh, sức khỏe hiện tại, thuốc đang sử dụng, can thiệp y tế, tiêm chủng, đi lại/phơi nhiễm và các yếu tố liên quan.
- Theo Use Case của LifeLine, khi đặt appointment hệ thống tạo pre-donation health screening form; donor hoàn thành thông tin medical history, current health status, recent travel và medication trước khi xác nhận booking.
- Kết quả screening là một phần của quá trình đánh giá eligibility; chatbot không được tự biến câu trả lời của donor thành chẩn đoán hoặc giấy xác nhận đủ điều kiện.
- Donor có thể được kiểm tra các chỉ số sức khỏe theo quy trình của cơ sở tiếp nhận, trong đó nguồn của LifeLine có đề cập đến huyết sắc tố và các tiêu chí thể chất.
- Nếu donor trả lời rằng đang sốt, mệt, có triệu chứng nhiễm trùng, đang điều trị hoặc có tình trạng y tế đặc biệt, chatbot nên hướng donor tới đánh giá y tế thay vì khuyến khích hiến.
- Nếu screening của LifeLine trả về trạng thái rejected/ineligible, chatbot phải tôn trọng trạng thái hệ thống; không được suy diễn ngược để nói donor "thực ra vẫn có thể hiến".
- Khi có sự khác biệt giữa dữ liệu donor tự khai và kết quả khám tại điểm hiến, kết quả đánh giá y tế tại điểm hiến có giá trị quyết định.

Nguyên tắc bảo mật:
- Chỉ retrieve những trường donor cần thiết cho câu hỏi.
- Không đưa toàn bộ hồ sơ sức khỏe vào prompt Gemini.
- Không hiển thị dữ liệu sức khỏe của donor trong câu trả lời nếu không cần thiết.

---

## KB-EL-004 — Thuốc và việc hiến máu
**Category:** `Eligibility`

Mục đích: Trả lời câu hỏi về thuốc mà không đưa ra kết luận thiếu căn cứ.

Nội dung:
- Không phải mọi loại thuốc đều dẫn đến cùng một quyết định. Việc trì hoãn phụ thuộc vào hoạt chất, lý do sử dụng, thời gian sử dụng, tác động của thuốc và tình trạng sức khỏe liên quan.
- Donor phải khai báo thuốc đang sử dụng trong quá trình screening.
- Donor không nên tự ngừng thuốc kê đơn hoặc thay đổi điều trị chỉ để đủ điều kiện hiến máu. WHO khuyến nghị không bỏ thuốc thường xuyên chỉ để đến buổi hiến.
- Nguồn Viện Huyết học – Truyền máu Trung ương hiện liệt kê một số thuốc có thời gian trì hoãn cụ thể: thuốc chứa dutasteride: 12 tháng; finasteride, isotretinoin/13-cis-retinoic acid và tretinoin: 3 tháng sau khi ngừng; acid acetylsalicylic, clopidogrel, ticlopidine và piroxicam: 7 ngày. Đây là các ví dụ theo nguồn tham khảo và phải được cập nhật nếu quy định thay đổi.
- Không suy luận rằng mọi thuốc cùng nhóm hoặc mọi tên thương mại đều có cùng thời gian trì hoãn.
- Nếu donor chỉ cung cấp tên thương mại, cần xác định hoạt chất bằng nguồn đáng tin cậy hoặc yêu cầu donor cung cấp thông tin thuốc; nếu không xác định được thì không kết luận.
- Nếu câu hỏi là "tôi đang uống thuốc X có hiến được không?", chatbot phải kiểm tra KB/nguồn thuốc phù hợp; nếu không có dữ liệu đủ chắc chắn, trả lời rằng cần được nhân viên y tế đánh giá.
- Không khuyên donor ngừng thuốc, giảm liều hoặc đổi thuốc để hiến máu.

Mẫu an toàn:
"Khả năng hiến máu phụ thuộc vào loại thuốc, hoạt chất và lý do sử dụng. Bạn không nên tự ngừng thuốc. Hãy khai báo thuốc khi screening để nhân viên y tế xác định thời điểm phù hợp." 

---

## KB-EL-005 — Bệnh và tình trạng sức khỏe ảnh hưởng đến việc hiến máu
**Category:** `Eligibility`

Mục đích: Bao quát các tình trạng sức khỏe phổ biến mà donor thường hỏi.

Nội dung:
- Donor không nên hiến khi đang cảm thấy không khỏe hoặc đang mắc bệnh cấp tính nếu việc hiến có thể ảnh hưởng đến sức khỏe donor hoặc an toàn máu.
- Các tình trạng cần được khai báo gồm bệnh cấp tính, nhiễm trùng, thiếu máu/huyết sắc tố thấp, bệnh mạn tính, bệnh truyền nhiễm, thai kỳ/sau sinh, phẫu thuật hoặc can thiệp y tế, và các tình trạng khác được cơ sở tiếp nhận yêu cầu.
- WHO nêu rằng người đang không khỏe, thiếu máu, mang thai, mới mang thai trong thời gian quy định, đang cho con bú hoặc có một số bệnh lý/thuốc nhất định có thể phải trì hoãn.
- Không được biến câu hỏi "tôi bị bệnh X có hiến được không?" thành chẩn đoán. Câu trả lời phải dựa trên rule chính thức nếu có; nếu không có thì chuyển sang nhân viên y tế.
- Một số bệnh sau khi khỏi có thời gian trì hoãn cụ thể theo nguồn Viện Huyết học – Truyền máu Trung ương; xem KB-EL-006.
- Nếu donor có triệu chứng hiện tại như sốt, cảm, đau họng, mệt hoặc dấu hiệu nhiễm trùng, ưu tiên an toàn: không khuyến khích hiến ngay và hướng tới đánh giá tại điểm hiến.
- Nếu donor đang mang thai hoặc vừa sinh/chấm dứt thai kỳ, phải áp dụng quy định trì hoãn hiện hành; không tự tính nếu không có rule được xác minh.
- Nếu donor có bệnh mạn tính nhưng đang ổn định, không tự kết luận đủ điều kiện; quyết định phụ thuộc bệnh, thuốc, tình trạng hiện tại và tiêu chuẩn của cơ sở tiếp nhận.

---

## KB-EL-006 — Các trường hợp cần trì hoãn hiến máu
**Category:** `Eligibility`

Mục đích: Là KB tra cứu thời gian trì hoãn cụ thể. Các mốc dưới đây lấy từ trang hướng dẫn của Viện Huyết học – Truyền máu Trung ương; phải cập nhật khi nguồn chính thức thay đổi.

TRÌ HOÃN 12 THÁNG:
- Phục hồi hoàn toàn sau can thiệp ngoại khoa.
- Khỏi sốt rét, giang mai, lao, uốn ván, viêm não hoặc viêm màng não.
- Sau sinh hoặc chấm dứt thai nghén.
- Sau tiêm vaccine phòng bệnh dại.
- Sau tiêm/truyền máu, chế phẩm máu hoặc chế phẩm sinh học có nguồn gốc từ máu.
- Sau tiêm/truyền kháng thể chống viêm gan B.
- Sử dụng thuốc chứa dutasteride.

TRÌ HOÃN 6 THÁNG:
- Xăm trổ trên da.
- Bấm tai, mũi, rốn hoặc vị trí khác trên cơ thể.
- Phơi nhiễm với máu/dịch cơ thể từ người có nguy cơ hoặc đã nhiễm bệnh lây truyền qua đường máu.
- Khỏi thương hàn, nhiễm trùng huyết, bị rắn cắn, viêm tắc động mạch, viêm tắc tĩnh mạch, viêm tủy xương hoặc viêm tụy.

TRÌ HOÃN 3 THÁNG SAU KHI NGỪNG THUỐC:
- Finasteride.
- Isotretinoin hoặc 13-cis-retinoic acid.
- Tretinoin.

TRÌ HOÃN 4 TUẦN:
- Khỏi viêm dạ dày ruột, viêm đường tiết niệu, viêm da nhiễm trùng, viêm phế quản, viêm phổi, sởi, ho gà, quai bị, sốt xuất huyết, kiết lỵ, rubella hoặc tả.
- Sau khi hoàn thành một số vaccine: rubella, sởi, thương hàn, tả, quai bị, thủy đậu, BCG.
- Có kết quả huyết sắc tố thấp trong lần xét nghiệm gần nhất tại điểm hiến.

TRÌ HOÃN 7 NGÀY:
- Khỏi cúm, cảm lạnh, dị ứng mũi họng, viêm họng hoặc migraine.
- Sau các vaccine khác ngoài nhóm vaccine đã liệt kê ở mốc 4 tuần/12 tháng.
- Sau sử dụng thuốc chứa acid acetylsalicylic, clopidogrel, ticlopidine hoặc piroxicam.

QUY TẮC AN TOÀN:
- Các trường hợp cụ thể khác phải do bác sĩ/nhân viên y tế tại điểm hiến xem xét.
- Không tự cộng/trừ thời gian nếu nguồn không nói rõ cách tính.
- Không dùng KB này để kết luận y khoa cho tình huống phức tạp.
- Nếu có nguồn quốc gia/cơ sở tiếp nhận mới hơn, nguồn mới hơn phải thay thế dữ liệu cũ.
- Không khuyên donor ngừng thuốc để rút ngắn thời gian trì hoãn.

---

## KB-PRE-001 — Chuẩn bị trước khi hiến máu
**Category:** `PreDonation`

Mục đích: Giúp donor chuẩn bị an toàn trước ngày và trước giờ hiến.

Nội dung:
- Nghỉ ngơi đầy đủ vào đêm trước. Viện Huyết học – Truyền máu Trung ương khuyến nghị không thức quá khuya và ngủ ít nhất 6 giờ.
- Chuẩn bị tâm lý thoải mái, tránh đến điểm hiến khi đang quá mệt hoặc cảm thấy không khỏe.
- Uống đủ nước trước khi hiến theo hướng dẫn của cơ sở tiếp nhận.
- Ăn nhẹ trước khi hiến; nguồn của Viện khuyến nghị không ăn các đồ ăn nhiều đạm, nhiều mỡ ngay trước khi hiến.
- Không uống rượu bia trước khi hiến.
- Mang giấy tờ tùy thân; nguồn Viện khuyến nghị căn cước gắn chip hoặc VNeID định danh mức 2.
- Nếu đặt lịch trên LifeLine, kiểm tra đúng campaign, địa điểm, ngày và giờ; mang e-ticket/QR nếu hệ thống yêu cầu.
- Chuẩn bị thông tin chính xác về bệnh, thuốc, vaccine, phẫu thuật, xăm/xỏ khuyên và lịch sử hiến máu để khai báo screening.
- Không tự uống thuốc, thực phẩm bổ sung hoặc sản phẩm "bổ máu" với mục đích làm thay đổi kết quả screening.
- Nếu có câu hỏi về tình trạng sức khỏe cụ thể, ưu tiên tư vấn nhân viên y tế.

---

## KB-PRE-002 — Ăn uống trước khi hiến máu
**Category:** `PreDonation`

Mục đích: Hướng dẫn donor về ăn uống trước khi hiến mà không đưa ra chế độ ăn cứng nhắc.

Nội dung:
- Donor không nên nhịn đói nếu cơ sở tiếp nhận yêu cầu ăn trước khi hiến; hãy tuân thủ hướng dẫn của điểm hiến.
- Viện Huyết học – Truyền máu Trung ương khuyến nghị ăn nhẹ trước hiến và tránh đồ ăn nhiều đạm, nhiều mỡ ngay trước khi hiến.
- Uống đủ nước; nguồn Viện khuyến nghị uống nhiều nước trước hiến.
- Không uống rượu bia trước khi hiến.
- Không tự dùng thuốc hoặc thực phẩm bổ sung để "đủ điều kiện" nếu chưa được nhân viên y tế hướng dẫn.
- Nếu donor có bệnh lý cần chế độ ăn/uống đặc biệt, hướng dẫn của bác sĩ/cơ sở điều trị có ưu tiên cao hơn KB chung.
- Nếu donor hỏi về một món cụ thể, chatbot chỉ trả lời nếu KB có căn cứ rõ; nếu không, nói rằng lựa chọn thực phẩm cụ thể phụ thuộc tình trạng cá nhân và hướng dẫn tại điểm hiến.
- Không khẳng định rằng một loại thực phẩm có thể "làm tăng huyết sắc tố ngay lập tức" hoặc đảm bảo donor được hiến.

---

## KB-PRE-003 — Nghỉ ngơi trước khi hiến máu
**Category:** `PreDonation`

Mục đích: Giải thích vai trò của nghỉ ngơi trước hiến.

Nội dung:
- Đêm trước hiến, nên ngủ đủ và tránh thức quá khuya.
- Nguồn Viện Huyết học – Truyền máu Trung ương khuyến nghị ngủ ít nhất 6 giờ vào đêm trước hiến.
- Nếu donor thức quá khuya, thiếu ngủ hoặc đang cảm thấy mệt, nên thông báo với nhân viên y tế khi đến điểm hiến thay vì cố hiến.
- Không dùng cà phê, nước tăng lực hoặc chất kích thích như một cách để che cảm giác mệt và tự đánh giá rằng mình đã đủ sức khỏe.
- Trước giờ hiến, donor nên giữ trạng thái bình tĩnh và tránh hoạt động khiến cơ thể quá mệt.
- Quyết định cuối cùng vẫn thuộc về sàng lọc y tế.

---

## KB-PRE-004 — Những điều cần tránh trước khi hiến máu
**Category:** `PreDonation`

Mục đích: Tập hợp các hành vi donor nên tránh trước hiến.

Nội dung:
- Tránh uống rượu bia trước khi hiến.
- Tránh thức quá khuya và thiếu ngủ; cố gắng ngủ ít nhất 6 giờ theo hướng dẫn của Viện.
- Không đến hiến nếu đang cảm thấy không khỏe mà không khai báo.
- Không che giấu bệnh, thuốc, vaccine, xăm/xỏ khuyên hoặc yếu tố phơi nhiễm.
- Không tự ngừng thuốc đang điều trị để đủ điều kiện hiến.
- Không tự dùng thuốc hoặc thực phẩm bổ sung nhằm thay đổi kết quả xét nghiệm.
- Không coi việc uống nhiều nước là cách bảo đảm được chấp nhận hiến; nước chỉ là một phần của chuẩn bị.
- Không cố hiến nếu nhân viên y tế yêu cầu trì hoãn.
- Nếu donor vừa phẫu thuật, xăm, xỏ khuyên, tiêm vaccine, bị bệnh hoặc có phơi nhiễm, phải kiểm tra thời gian trì hoãn tương ứng trong KB Eligibility.

---

## KB-PRE-005 — Quy trình trước khi hiến máu
**Category:** `PreDonation`

Mục đích: Giúp donor hiểu quy trình từ chuẩn bị đến lúc bắt đầu hiến.

Quy trình khái quát:
1. Donor chọn điểm/campaign và có thể đặt appointment trên LifeLine.
2. Hệ thống kiểm tra các điều kiện dữ liệu có thể kiểm tra tự động, chẳng hạn khoảng cách kể từ lần hiến gần nhất và tình trạng appointment trùng.
3. LifeLine tạo pre-donation screening form.
4. Donor khai báo medical history, current health status, recent travel và medication.
5. Donor kiểm tra thông tin booking.
6. Hệ thống lưu appointment và tạo e-ticket/QR theo flow của LifeLine.
7. Khi đến điểm hiến, donor xuất trình giấy tờ/e-ticket theo yêu cầu.
8. Cơ sở tiếp nhận thực hiện đăng ký, khai thác tiền sử, khám/sàng lọc và xét nghiệm cần thiết.
9. Nhân viên y tế xác định donor có đủ điều kiện tại thời điểm đó.
10. Chỉ sau khi được xác nhận đủ điều kiện donor mới tiếp tục bước hiến.

Nguyên tắc:
- Booking trên LifeLine không đồng nghĩa với đã được y tế phê duyệt.
- Kết quả screening tại điểm hiến có thể khiến appointment không được thực hiện.
- Chatbot chỉ hướng dẫn quy trình, không thay thế bước khám tuyển.

---

## KB-POST-001 — Chăm sóc ngay sau khi hiến máu
**Category:** `PostDonation`

Mục đích: Hướng dẫn donor trong thời gian ngay sau khi kết thúc lấy máu.

Nội dung theo hướng dẫn của Viện Huyết học – Truyền máu Trung ương:
- Duỗi thẳng và hơi nâng cao cánh tay trong khoảng 15 phút.
- Hạn chế gập tay trong thời gian nghỉ sau hiến.
- Nghỉ tại điểm hiến tối thiểu 15 phút.
- Uống nhiều nước.
- Chỉ rời điểm hiến khi cảm thấy thực sự thoải mái.
- Nếu vết băng cầm máu chảy lại: nâng cánh tay, ấn nhẹ vào vị trí bông và báo nhân viên y tế.
- Nếu mệt, chóng mặt hoặc vã mồ hôi: ngồi hoặc nằm ngay, tốt nhất nâng cao chân; giữ bình tĩnh, hít sâu/thở chậm; tìm người hỗ trợ và báo nhân viên y tế; chỉ đứng dậy khi hết triệu chứng.
- Không tự rời điểm hiến nếu đang có triệu chứng bất thường.

Chatbot phải ưu tiên hành động an toàn ngay lập tức hơn là giải thích dài.

---

## KB-POST-002 — Dinh dưỡng sau khi hiến máu
**Category:** `PostDonation`

Mục đích: Hướng dẫn dinh dưỡng sau hiến ở mức thông tin chung.

Nội dung:
- Tiếp tục uống đủ nước sau khi rời điểm hiến để hỗ trợ bù dịch.
- Duy trì chế độ ăn uống bình thường theo hướng dẫn của cơ sở tiếp nhận.
- Nguồn Viện Huyết học – Truyền máu Trung ương khuyến nghị tăng cường thực phẩm giàu chất dinh dưỡng tạo máu như thịt, gan, trứng và sữa.
- Không tự coi thực phẩm hoặc thuốc bổ máu là bắt buộc đối với mọi donor.
- Nếu donor có bệnh lý hoặc chế độ ăn đặc biệt, hướng dẫn của bác sĩ/dinh dưỡng có ưu tiên cao hơn KB chung.
- Không tuyên bố rằng một thực phẩm có thể "tái tạo máu ngay lập tức".
- Nếu donor hỏi "tôi cần uống bao nhiêu nước?", chatbot nên ưu tiên hướng dẫn của cơ sở tiếp nhận và tình trạng cá nhân thay vì đưa một con số cứng nếu không có nguồn phù hợp.
- Nếu có dấu hiệu bất thường sau hiến, dinh dưỡng không thay thế đánh giá y tế.

---

## KB-POST-003 — Nghỉ ngơi và hoạt động sau khi hiến máu
**Category:** `PostDonation`

Mục đích: Hướng dẫn donor về nghỉ ngơi và vận động sau hiến.

Nội dung:
- Nghỉ tại điểm hiến tối thiểu 15 phút và chỉ rời đi khi cảm thấy ổn.
- Trong 48 giờ sau hiến, nguồn Viện Huyết học – Truyền máu Trung ương khuyến nghị tránh thức khuya, rượu bia, nâng vật nặng bằng tay vừa hiến và các hoạt động thể lực cao như thi đấu thể thao, đá bóng, tập thể hình, leo trèo cao.
- Không dùng cảm giác "khỏe" ngay sau hiến làm lý do để thực hiện hoạt động gắng sức.
- Nếu xuất hiện chóng mặt, mệt hoặc vã mồ hôi, dừng hoạt động và thực hiện hướng dẫn xử trí trong KB-POST-004.
- Nếu donor cần hướng dẫn cho một hoạt động cụ thể không có trong KB, chatbot không được tự tạo thời gian an toàn; nên hướng tới hướng dẫn của cơ sở tiếp nhận.
- Nếu vị trí lấy máu đau, sưng, tê hoặc bầm lan rộng, ưu tiên đánh giá y tế.

---

## KB-POST-004 — Các phản ứng thường gặp sau khi hiến máu
**Category:** `PostDonation`

Mục đích: Giúp chatbot nhận diện các phản ứng sau hiến và hướng dẫn bước đầu an toàn.

Nội dung:
- Một số donor có thể cảm thấy mệt, chóng mặt hoặc vã mồ hôi quanh thời điểm hiến.
- Khi có các biểu hiện này, donor nên ngồi hoặc nằm ngay, tốt nhất nâng cao chân; giữ bình tĩnh, hít sâu và thở chậm; tìm người hỗ trợ và báo ngay nhân viên y tế/tình nguyện viên.
- Chỉ ngồi dậy hoặc đứng lên khi triệu chứng đã hết.
- Chảy máu lại tại vị trí chọc kim: nâng cánh tay, ấn nhẹ vào vị trí bông và báo nhân viên y tế.
- Bầm tím tại vị trí lấy máu có thể xảy ra. Nguồn Viện hướng dẫn có thể chườm lạnh trong ngày đầu và chườm ấm từ ngày tiếp theo; vết bầm thường tự hết, nhưng nếu sưng to, lan rộng, đau hoặc tê cần liên hệ nhân viên y tế.
- Chatbot không được chẩn đoán nguyên nhân của triệu chứng.
- Nếu triệu chứng nặng, kéo dài, bất thường hoặc donor lo lắng, phải khuyến nghị tìm hỗ trợ y tế.
- Không dùng KB này để trấn an tuyệt đối rằng mọi triệu chứng đều bình thường.

---

## KB-POST-005 — Khi nào cần tìm hỗ trợ y tế sau khi hiến máu
**Category:** `PostDonation`

Mục đích: Xác định ranh giới giữa hướng dẫn tự chăm sóc cơ bản và tình huống cần nhân viên y tế.

Cần báo ngay cho nhân viên y tế tại điểm hiến nếu:
- Mệt, chóng mặt hoặc vã mồ hôi trong hoặc ngay sau hiến.
- Chảy máu trở lại tại vị trí chọc kim.
- Cảm thấy không đủ khỏe để đứng hoặc rời điểm hiến.

Sau khi rời điểm hiến, cần liên hệ cơ sở y tế/đơn vị tiếp nhận nếu:
- Vị trí chọc kim sưng to.
- Vết bầm lan rộng.
- Vị trí chọc kim đau hoặc tê.
- Có triệu chứng bất thường khiến donor lo lắng hoặc triệu chứng không cải thiện.

Nguyên tắc chatbot:
- Không chẩn đoán từ xa.
- Không đưa ra cam kết "không sao".
- Không yêu cầu donor tự xử trí một tình trạng nghiêm trọng chỉ bằng mẹo tại nhà.
- Khi có dấu hiệu cấp cứu hoặc nguy hiểm, ưu tiên gọi dịch vụ cấp cứu địa phương hoặc đến cơ sở y tế gần nhất.
- Nếu donor đang ở điểm hiến, ưu tiên báo nhân viên y tế tại điểm thay vì tiếp tục hỏi chatbot.

---

## KB-GEN-001 — Hiến máu là gì
**Category:** `General`

Mục đích: Cung cấp kiến thức nền tảng về hoạt động hiến máu.

Nội dung:
- Hiến máu là việc một người hiến một lượng máu hoặc thành phần máu theo quy trình của cơ sở tiếp nhận để phục vụ nhu cầu điều trị.
- Nguồn máu an toàn có vai trò quan trọng đối với cấp cứu, phẫu thuật, sản khoa, điều trị ung thư, thiếu máu nặng và nhiều tình trạng khác.
- Máu hiến có thể được xử lý thành các thành phần như hồng cầu, tiểu cầu và huyết tương để sử dụng cho các nhu cầu điều trị khác nhau.
- WHO nhấn mạnh rằng máu an toàn cứu sống người bệnh và nguồn máu cần được duy trì thường xuyên vì máu và các chế phẩm có thời hạn sử dụng.
- Quy trình hiến máu phải bảo vệ cả donor và người nhận: sàng lọc donor, lấy máu bằng vật tư vô khuẩn và sàng lọc đơn vị máu theo quy định.
- Hiến máu không đồng nghĩa donor có thể tự quyết định lượng máu hoặc tần suất hiến; tất cả phải theo quy trình và tiêu chuẩn của cơ sở tiếp nhận.

---

## KB-GEN-002 — Lợi ích và ý nghĩa của việc hiến máu
**Category:** `General`

Mục đích: Giải thích ý nghĩa của hiến máu mà không đưa ra các tuyên bố sức khỏe quá mức.

Nội dung:
- Ý nghĩa lớn nhất của hiến máu là góp phần cung cấp nguồn máu cho người bệnh cần truyền máu.
- Một đơn vị máu có thể được tách thành các thành phần để phục vụ các nhóm bệnh nhân khác nhau.
- Hiến máu tình nguyện, không vì lợi ích vật chất, góp phần xây dựng nguồn máu ổn định và an toàn.
- WHO nhấn mạnh vai trò của người hiến máu tình nguyện trong việc duy trì nguồn máu đầy đủ và an toàn.
- LifeLine bổ sung góc nhìn donor journey: lịch sử hiến máu, tổng số lần hiến, thành tích và tiến trình đóng góp giúp donor nhìn thấy tác động lâu dài của mình.
- Không nên nói rằng hiến máu chắc chắn "giải độc", "giảm cân", "trẻ hóa" hoặc mang lại một lợi ích sức khỏe cụ thể cho mọi người nếu không có bằng chứng phù hợp.
- Nếu donor hỏi lợi ích sức khỏe cá nhân, chatbot nên phân biệt giữa ý nghĩa xã hội của hiến máu và lợi ích y khoa; không biến hiến máu thành một phương pháp điều trị.

---

## KB-GEN-003 — Các nhóm máu và Quy tắc tương thích hiến máu
**Category:** `General`

Mục đích: Cung cấp kiến thức cơ bản về nhóm máu ABO/Rh và quy tắc tương thích truyền máu (ai hiến được cho ai, ai nhận được từ ai).

Nội dung:
- Hệ nhóm máu ABO gồm 4 nhóm chính: A, B, AB, và O.
- Hệ Rh gồm 2 kiểu: Rh+ (dương tính, có kháng nguyên D) và Rh- (âm tính, không có kháng nguyên D).
- Khi kết hợp, tạo thành 8 nhóm máu phổ biến: O+, O-, A+, A-, B+, B-, AB+, AB-.

**Quy tắc tương thích khi hiến máu toàn phần & khối hồng cầu (Who can donate to whom):**
1. **Nhóm máu O+ (O dương)**:
   - **Có thể hiến máu cho:** **O+, A+, B+, AB+** (tất cả các nhóm máu mang Rh dương).
   - **Có thể nhận máu từ:** O+ và O-.
   - Nhóm máu O+ rất phổ biến và có vai trò cực kỳ quan trọng trong cấp cứu và điều trị.

2. **Nhóm máu O- (O âm)**:
   - **Có thể hiến máu cho:** **Tất cả các nhóm máu (O+, O-, A+, A-, B+, B-, AB+, AB-)** — Đây là nhóm máu hiến hồng cầu phổ thông (Universal Donor).
   - **Có thể nhận máu từ:** Duy nhất nhóm máu O-.

3. **Nhóm máu A+ (A dương)**:
   - **Có thể hiến máu cho:** **A+ và AB+**.
   - **Có thể nhận máu từ:** A+, A-, O+, O-.

4. **Nhóm máu A- (A âm)**:
   - **Có thể hiến máu cho:** **A+, A-, AB+, AB-**.
   - **Có thể nhận máu từ:** A- và O-.

5. **Nhóm máu B+ (B dương)**:
   - **Có thể hiến máu cho:** **B+ và AB+**.
   - **Có thể nhận máu từ:** B+, B-, O+, O-.

6. **Nhóm máu B- (B âm)**:
   - **Có thể hiến máu cho:** **B+, B-, AB+, AB-**.
   - **Có thể nhận máu từ:** B- và O-.

7. **Nhóm máu AB+ (AB dương)**:
   - **Có thể hiến máu cho:** Duy nhất **AB+**.
   - **Có thể nhận máu từ:** **Tất cả các nhóm máu (Universal Recipient)**.

8. **Nhóm máu AB- (AB âm)**:
   - **Có thể hiến máu cho:** **AB+ và AB-**.
   - **Có thể nhận máu từ:** AB-, A-, B-, O-.

**Lưu ý:**
- Chatbot cần ghi nhớ thông tin nhóm máu mà người dùng đã cung cấp ở các lượt hội thoại trước (Turn Context) để trả lời ngay mà không cần hỏi lại.
- Luôn trả lời đầy đủ danh sách các nhóm máu nhận tương ứng theo quy tắc y khoa chuẩn xác.

---

## KB-GEN-004 — Quy trình hiến máu cơ bản
**Category:** `General`

Mục đích: Mô tả hành trình donor từ đăng ký đến sau hiến.

Quy trình tổng quát:
1. Tìm điểm/campaign phù hợp.
2. Đặt lịch nếu cơ sở/campaign hỗ trợ.
3. Kiểm tra điều kiện dữ liệu cơ bản và hoàn thành screening.
4. Đến điểm hiến đúng thời gian, xuất trình giấy tờ/e-ticket theo yêu cầu.
5. Đăng ký và khai thác tiền sử.
6. Khám/sàng lọc và xét nghiệm cần thiết.
7. Nhân viên y tế xác nhận đủ điều kiện.
8. Thực hiện hiến máu theo quy trình chuyên môn.
9. Nghỉ và theo dõi sau hiến.
10. Nhận hướng dẫn chăm sóc sau hiến.
11. LifeLine có thể cập nhật donation record/donation timeline sau khi dữ liệu từ cơ sở được xác nhận.

Lưu ý:
- Appointment hoặc e-ticket không đảm bảo donor chắc chắn được hiến.
- Donor có thể bị trì hoãn sau khi được khám/sàng lọc nếu phát hiện yếu tố không phù hợp.
- Chatbot chỉ giải thích quy trình, không thay thế nhân viên y tế.

---

## KB-GEN-005 — Máu sau khi hiến được sử dụng như thế nào
**Category:** `General`

Mục đích: Giải thích hành trình của máu sau hiến ở mức khái quát.

Nội dung:
- Sau khi thu thập, máu được kiểm tra/sàng lọc theo quy định an toàn trước khi sử dụng.
- WHO khuyến nghị tất cả đơn vị máu hiến phải được sàng lọc các bệnh lây truyền qua truyền máu phù hợp với hệ thống quốc gia; các xét nghiệm thường bao gồm HIV, viêm gan B, viêm gan C và giang mai.
- Máu toàn phần có thể được sử dụng hoặc được điều chế thành các thành phần như khối hồng cầu, tiểu cầu, huyết tương và cryoprecipitate tùy hệ thống.
- Việc tách thành phần giúp một đơn vị hiến có thể phục vụ nhu cầu của nhiều bệnh nhân khác nhau.
- Máu và chế phẩm máu được lưu trữ, quản lý và phân phối theo yêu cầu chất lượng và nhu cầu điều trị.
- LifeLine quản lý một phần hệ sinh thái gồm donor, blood center, campaign và blood inventory; chatbot không được tự tuyên bố một đơn vị máu cụ thể đã được truyền cho ai nếu database không có thông tin đó.
- Nếu donor hỏi về kết quả xét nghiệm của chính mình, phải lấy dữ liệu chính thức từ hệ thống nếu có; không suy đoán từ việc donor đã được nhận máu.

---

## KB-PROC-001 — Quy trình 6 bước hiến máu thông minh trên LifeLine
**Category:** `Process`

Mục đích: Hướng dẫn chi tiết cho người hiến máu về toàn bộ 6 bước từ khi mở ứng dụng LifeLine đến khi nhận kết quả xét nghiệm và vinh danh giọt máu cứu người.

Nội dung 6 bước:
1. **Bước 1: Tìm Điểm Hiến Máu & Chọn Lịch Hẹn Linh Hoạt**
   - Người hiến tra cứu các Trung tâm hiến máu cố định và Chiến dịch hiến máu lưu động trên Bản đồ GPS tương tác của LifeLine.
   - Tự do lựa chọn ngày hẹn và khung giờ tiếp nhận (Timeslot 30 phút) phù hợp với lịch trình cá nhân để không phải xếp hàng chờ đợi.
   - Xem thông tin các nhóm máu đang cần khẩn cấp (A+, B+, O+, AB+, Rh-) để ưu tiên hiến máu đúng lúc bệnh nhân cần.

2. **Bước 2: Điền Phiếu Khảo Sát Sàng Lọc Online (Pre-Screening)**
   - Trả lời bảng câu hỏi y tế sơ bộ ngay trên ứng dụng trước khi đến điểm hiến.
   - Hệ thống tự động kiểm tra quy chuẩn y tế: khoảng cách giãn cách tối thiểu 84 ngày giữa 2 lần hiến máu toàn phần, độ tuổi (18 - 60 tuổi), cân nặng (nữ ≥ 42kg, nam ≥ 45kg) và tiền sử bệnh lý / thuốc đang dùng.
   - Tiết kiệm hơn 80% thời gian làm thủ tục giấy tờ tại bàn tiếp đón.

3. **Bước 3: Nhận Thẻ E-Ticket & Check-in QR Siêu Tốc**
   - Sau khi Trung Tâm Hiến Máu phê duyệt đơn đăng ký, hệ thống tự động cấp Thẻ điện tử E-Ticket kèm mã QR cá nhân hóa qua email và ứng dụng.
   - Khi đến điểm hiến máu, chỉ cần đưa mã QR E-Ticket cho nhân viên y tế quét check-in trong vòng 10 giây mà không cần mang theo giấy tờ kê khai rườm rà.

4. **Bước 4: Khám Sàng Lọc Lâm Sàng & Lấy Máu An Toàn 100%**
   - Bác sĩ chuyên khoa đo huyết áp, mạch, cân nặng, test nhanh nhóm máu và kiểm tra nồng độ huyết sắc tố (Hb ≥ 120 g/l).
   - Quá trình lấy máu diễn ra trong môi trường vô trùng tuyệt đối, sử dụng kim tiêm và túi lấy máu tiệt trùng dùng 1 lần đạt chuẩn Bộ Y Tế.
   - Thời gian lấy máu thực tế chỉ mất 8 - 10 phút, người hiến có thể tùy chọn thể tích hiến 250ml, 350ml hoặc 450ml theo chỉ định bác sĩ.

5. **Bước 5: Nghỉ Dưỡng Hồi Phục & Nhận Quà Tri Ân**
   - Nghỉ ngơi 15 phút tại khu vực hồi sức thoáng mát, được phục vụ sữa tươi, trà đường ấm, bánh ngọt để bổ sung đường và dịch thể.
   - Nhận Giấy chứng nhận hiến máu tình nguyện, quà tặng lưu niệm và hỗ trợ chi phí đi lại theo quy định của Bộ Y Tế.

6. **Bước 6: Tích Lũy Điểm Thưởng XP & Theo Dõi Hành Trình Giọt Máu**
   - Mẫu máu được xét nghiệm sàng lọc an toàn 5 bệnh truyền nhiễm (HIV, HBV, HCV, Giang mai, Sốt rét) và xác định nhóm máu chính xác.
   - Tự động cập nhật Hồ Sơ Hiến Máu Số trọn đời trên LifeLine.
   - Cộng điểm thưởng XP (350ml = 100 XP, 450ml = 150 XP), nâng hạng cấp bậc Donor (Đồng, Bạc, Vàng, Bạch Kim, Kim Cương) và nhận thông báo khi giọt máu của bạn được chuyển đến bệnh viện cứu sống bệnh nhân.

---

## KB-PROC-002 — Cẩm nang chuẩn bị sức khỏe 3 giai đoạn (Trước, Trong và Sau khi hiến máu)
**Category:** `Preparation`

Mục đích: Cung cấp hướng dẫn y khoa chi tiết và thực tế giúp donor có trải nghiệm hiến máu khỏe khoắn, không mệt mỏi hay chóng mặt.

Nội dung:
1. **Giai đoạn 1: Trước ngày hiến máu (24h - 48h trước)**
   - Giấc ngủ: Ngủ sâu và đủ giấc từ 6 - 8 tiếng vào đêm hôm trước. Không thức khuya để giữ huyết áp và nhịp tim ổn định.
   - Chế độ ăn uống: Ăn bữa nhẹ (bánh mì, ngũ cốc, cháo, xôi, hoa quả...) trước khi hiến 2 - 3 tiếng. Tuyệt đối KHÔNG nhịn đói và KHÔNG ăn đồ nhiều dầu mỡ (thức ăn nhiều dầu mỡ làm huyết tương bị đục mỡ, không thể sử dụng để truyền cho người bệnh).
   - Nước uống: Uống đủ 500ml - 1 lít nước lọc hoặc nước trái cây trước khi đến điểm hiến.
   - Kiêng cữ: Tuyệt đối không uống rượu, bia, đồ uống có cồn trong vòng 24 giờ trước khi hiến máu.

2. **Giai đoạn 2: Trong khi đang hiến máu**
   - Tâm lý: Thả lỏng toàn thân trên ghế hiến máu, giữ tinh thần thoải mái, hít thở đều và sâu.
   - Động tác: Nắm và bóp nhẹ quả bóng cao su theo nhịp hướng dẫn của điều dưỡng để dòng máu chảy đều vào túi lấy máu.
   - Giao tiếp: Nếu cảm thấy có bất kỳ dấu hiệu lạ như chóng mặt, hoa mắt, vã mồ hôi, buồn nôn, cần thông báo ngay cho nhân viên y tế bên cạnh để được hỗ trợ kịp thời.

3. **Giai đoạn 3: Sau khi hiến máu (24h - 48h sau)**
   - Nghỉ ngơi tại chỗ: Nghỉ tối thiểu 15 phút tại khu vực hồi sức, uống trà đường hoặc sữa ấm và ăn nhẹ. Chỉ đứng dậy rời đi khi cảm thấy hoàn toàn khỏe khoắn.
   - Chăm sóc vết chọc kim: Giữ miếng băng dán sạch sẽ và khô ráo trong ít nhất 4 - 6 tiếng để tránh chảy máu lại hoặc nhiễm trùng. Nếu có vết bầm tím dưới da, chườm lạnh trong 24 giờ đầu, sau đó chườm ấm từ ngày thứ hai.
   - Bổ sung dinh dưỡng: Uống nhiều nước (2 - 3 lít nước trong ngày), ăn các thực phẩm giàu chất sắt và đạm (thịt bò, trứng, gan, các loại đậu đỗ, rau bina, mộc nhĩ).
   - Tránh vận động mạnh: Tuyệt đối không nâng vật nặng bằng tay vừa hiến máu, không chơi thể thao cường độ cao (đá bóng, tập tạ, bơi lội, chạy marathon) và không lái xe đường dài trong vòng 24 giờ.

---

## KB-FEAT-001 — Hướng dẫn sử dụng các tính năng dành cho Donor trên ứng dụng LifeLine
**Category:** `Features`

Mục đích: Giúp Chatbot AI giải đáp và hướng dẫn người dùng sử dụng đầy đủ các chức năng trên hệ thống LifeLine.

Nội dung:
- **Đăng ký tài khoản & Xác thực số CCCD (Citizen ID Verification)**:
  - Đăng ký tài khoản người hiến bằng số Căn cước công dân (12 chữ số) và thông tin cá nhân.
  - Hệ thống liên kết hồ sơ y tế định danh chính xác, bảo mật theo chuẩn y tế quốc gia.
- **Đặt lịch hiến máu (Booking & Scheduling)**:
  - Chọn địa điểm tiếp nhận trên Bản đồ tương tác (`/schedule/location`), chọn khung giờ trống phù hợp.
  - Điền phiếu khảo sát sàng lọc y tế trực tuyến (`/schedule/screening`).
  - Xác nhận và nhận mã vé điện tử E-Ticket (`/schedule/success`).
- **Quản lý Lịch hẹn của tôi (My Appointments)**:
  - Xem chi tiết lịch hẹn đã đặt, thời gian và địa điểm tiếp nhận.
  - Xem và tải thẻ E-Ticket kèm mã QR định danh.
  - Hủy lịch hẹn hoặc đổi lịch khi có việc bận đột xuất trước thời hạn quy định.
- **Hồ sơ hiến máu cá nhân (My Profile & Blood Record)**:
  - Tra cứu nhóm máu chính thức (Hệ ABO và Rh).
  - Xem nhật ký tổng số lần hiến máu, tổng thể tích máu đã đóng góp.
  - Đồng hồ đếm ngược ngày đủ điều kiện hiến lần tiếp theo (Next eligible donation date).
- **Hệ thống Điểm thưởng & Cấp bậc (Gamification & Rewards)**:
  - Mỗi lần hiến máu thành công được tích luỹ điểm XP: Hiến 250ml = 75 XP, 350ml = 100 XP, 450ml = 150 XP.
  - Cấp bậc vinh danh: Người Hiến Đồng, Bạc, Vàng, Bạch Kim, Kim Cương.
  - Huy hiệu thành tựu: Giọt Máu Đầu Tiên, Cứu Người Mùa Dịch, Trái Tim Vàng, Hiến Máu Khẩn Cấp.
- **Hộp thư thông báo & Cảnh báo khẩn cấp SOS**:
  - Nhận thông báo nhắc lịch hẹn trước ngày hiến.
  - Nhận thông báo khi máu được cấp phát tới bệnh viện điều trị.
  - Nhận lời kêu gọi hiến máu khẩn cấp khi ngân hàng máu thiếu hụt nhóm máu của bạn trong khu vực.

---

## KB-FEAT-002 — Quyền lợi y tế và xã hội của người hiến máu tình nguyện
**Category:** `Benefits`

Mục đích: Cung cấp thông tin chính xác về các quyền lợi theo quy định pháp luật và Bộ Y Tế dành cho người hiến máu tình nguyện.

Nội dung:
- **Khám và tư vấn sức khỏe miễn phí**: Được bác sĩ kiểm tra huyết áp, nhịp tim, tầm soát thiếu máu và tư vấn sức khỏe miễn phí tại bàn khám.
- **Xét nghiệm an toàn truyền máu miễn phí**: Được làm xét nghiệm định nhóm máu (ABO, Rh) và xét nghiệm 5 bệnh truyền nhiễm nguy hiểm (HIV, HBV, HCV, Giang mai, Sốt rét). Kết quả xét nghiệm được bảo mật tuyệt đối.
- **Giấy chứng nhận hiến máu tình nguyện & Quyền lợi bồi hoàn máu**:
  - Người hiến máu được cấp Giấy chứng nhận hiến máu tình nguyện của Ban chỉ đạo vận động hiến máu nhân đạo.
  - Trong trường hợp không may cần truyền máu trong tương lai tại bất kỳ bệnh viện công lập nào trên toàn quốc, người hiến máu sẽ được **bồi hoàn miễn phí lượng máu tương đương** tổng số máu mà mình đã từng hiến tặng.
- **Chế độ bồi dưỡng theo quy định của Bộ Y Tế**:
  - Được phục vụ suất ăn nhẹ, nước uống giải khát tại chỗ.
  - Nhận hỗ trợ chi phí đi lại bằng tiền mặt hoặc quà tặng hiện vật có giá trị tương đương theo Thông tư hiện hành của Bộ Y Tế.
  - Nhận các phần quà lưu niệm chăm sóc sức khỏe ý nghĩa.

---

