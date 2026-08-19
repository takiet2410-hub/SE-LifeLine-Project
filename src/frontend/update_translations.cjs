const fs = require('fs');
const path = require('path');
const enPath = 'src/i18n/locales/en/landing.json';
const viPath = 'src/i18n/locales/vi/landing.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));

const updatedEn = {
  ...en.healthTips,
  featured: {
    ...en.healthTips.featured,
    readMoreContent: "Thorough preparation before blood donation is key to a safe and smooth experience. Make sure you get 7-9 hours of sleep the night before. Avoid alcohol for 24 hours. Eat a light, low-fat meal 2-3 hours before donating to keep blood sugar stable. If you feel unwell, have flu symptoms, please reschedule."
  },
  categories: {
    ...en.healthTips.categories,
    nutrition: { ...en.healthTips.categories.nutrition, readMoreContent: "Before donating, eat a healthy, low-fat meal. Avoid greasy foods as high fat in the blood can affect routine blood tests. After donating, rest and replenish your energy with snacks and juice provided at the site to help your body recover quickly." },
    hydration: { ...en.healthTips.categories.hydration, readMoreContent: "Half of your blood is water. Drinking plenty of fluids (around 500ml) before donating helps maintain blood volume and prevents dizziness. After donating, continue to drink more water than usual for the next 24 hours. Minimize caffeinated or alcoholic drinks during this time." },
    recovery: { ...en.healthTips.categories.recovery, readMoreContent: "After donating, keep the bandage on your arm for at least 4 hours. Avoid standing for too long, taking very hot showers, or changing postures suddenly. Prioritize resting and gently relaxing for the rest of the day." },
    iron: { ...en.healthTips.categories.iron, readMoreContent: "Iron is an essential mineral needed for your body to regenerate red blood cells after donating. Increase iron-rich foods in your daily diet for the next few weeks. Good sources include beef, liver, spinach, broccoli, beans, and whole grains. Pair them with vitamin C rich foods for optimal absorption." },
    sleep: { ...en.healthTips.categories.sleep, readMoreContent: "A deep and adequate sleep plays a crucial role in restoring energy and preparing the body before blood donation. Lack of sleep can increase the risk of low blood pressure and feelings of fatigue after donating. Ensure you get 7-9 hours of sleep." },
    exercise: { ...en.healthTips.categories.exercise, readMoreContent: "You must absolutely avoid heavy physical activities, high-intensity gym workouts, or endurance sports for at least 24 to 48 hours after donating blood. Overexertion too early can increase heart rate and lead to dizziness or fainting." }
  },
  faq: {
    ...en.healthTips.faq,
    q1: {
      question: "Can I donate if I'm taking medication?",
      answer: "Depending on the medication you are taking. Most vitamins, supplements, and birth control pills are safe. However, if you are taking antibiotics, blood thinners, or specific acne medications, you may need a waiting period. Please bring your prescription and consult directly with the screening doctor."
    },
    q2: {
      question: "What is the minimum interval between two blood donations?",
      answer: "According to Ministry of Health regulations, the minimum interval between two whole blood donations is 12 weeks (84 days). This interval ensures your body has enough time to completely regenerate red blood cells and iron."
    },
    q3: {
      question: "What are the minimum age and weight requirements?",
      answer: "Donors need to be between 18 and 60 years old. For weight, females must be at least 42kg and males 45kg (donating 350ml usually requires over 50kg). You also need to have normal health, stable heart rate and blood pressure."
    }
  }
};

const updatedVi = {
  ...vi.healthTips,
  featured: {
    ...vi.healthTips.featured,
    readMoreContent: "Chuẩn bị kỹ lưỡng trước khi hiến máu là chìa khóa để có một trải nghiệm an toàn và suôn sẻ. Hãy đảm bảo bạn ngủ đủ 7-9 tiếng vào đêm trước ngày hiến. Tránh sử dụng thức uống có cồn trong vòng 24 giờ. Ăn một bữa nhẹ ít béo trước khi hiến khoảng 2-3 giờ để giữ đường huyết ổn định. Nếu bạn cảm thấy không khỏe, có dấu hiệu cảm cúm, hãy dời lịch hiến máu."
  },
  categories: {
    ...vi.healthTips.categories,
    nutrition: { ...vi.healthTips.categories.nutrition, readMoreContent: "Trước khi hiến máu, hãy ăn một bữa ăn lành mạnh, ít chất béo. Tránh thức ăn nhiều dầu mỡ (như khoai tây chiên, gà rán) vì lượng chất béo cao trong máu có thể ảnh hưởng đến kết quả các xét nghiệm máu định kỳ. Sau khi hiến, hãy nghỉ ngơi và bổ sung năng lượng bằng các món ăn nhẹ và nước trái cây được cung cấp tại điểm hiến máu để giúp cơ thể nhanh chóng phục hồi." },
    hydration: { ...vi.healthTips.categories.hydration, readMoreContent: "Một nửa lượng máu của bạn là nước. Việc uống nhiều nước (khoảng 500ml) trước khi hiến máu giúp duy trì thể tích máu, giúp tìm ven dễ hơn và ngăn ngừa chóng mặt, tụt huyết áp. Sau khi hiến máu, tiếp tục uống nhiều nước hơn bình thường (thêm khoảng 4 ly nước) trong 24 giờ tiếp theo. Hạn chế tối đa các đồ uống có chứa caffein như trà, cà phê hay cồn trong thời gian này vì chúng có tác dụng lợi tiểu." },
    recovery: { ...vi.healthTips.categories.recovery, readMoreContent: "Sau khi hiến máu, hãy giữ nguyên băng cá nhân trên tay ít nhất 4 giờ. Nếu vết kim tiêm bị chảy máu lại, hãy ấn chặt tay lên vùng tiêm và giơ tay lên cao trong 5-10 phút cho đến khi máu ngừng chảy. Tránh đứng quá lâu, tắm nước quá nóng hoặc thay đổi tư thế đột ngột. Hãy ưu tiên nghỉ ngơi, thư giãn nhẹ nhàng trong phần còn lại của ngày." },
    iron: { ...vi.healthTips.categories.iron, readMoreContent: "Sắt là khoáng chất thiết yếu cần thiết để cơ thể tái tạo hồng cầu sau khi hiến máu. Hãy tăng cường bổ sung các thực phẩm giàu sắt vào chế độ ăn hàng ngày trong vài tuần tiếp theo. Các nguồn thực phẩm dồi dào sắt bao gồm: thịt bò, gan, rau bina (cải bó xôi), bông cải xanh, các loại đậu, và ngũ cốc nguyên hạt. Để tối ưu hóa việc hấp thu sắt, hãy kết hợp ăn cùng thực phẩm giàu vitamin C (cam, chanh, ổi, dâu tây)." },
    sleep: { ...vi.healthTips.categories.sleep, readMoreContent: "Một giấc ngủ sâu và đủ giấc đóng vai trò cực kỳ quan trọng trong việc phục hồi năng lượng và chuẩn bị cho cơ thể trước khi hiến máu. Việc thiếu ngủ có thể làm tăng nguy cơ hạ huyết áp và cảm giác mệt mỏi, chóng mặt sau khi rút máu. Hãy duy trì thói quen ngủ sớm, đảm bảo ngủ đủ 7-9 tiếng và tránh sử dụng các thiết bị điện tử ngay sát giờ đi ngủ vào đêm trước ngày hiến máu." },
    exercise: { ...vi.healthTips.categories.exercise, readMoreContent: "Bạn cần tuyệt đối tránh các hoạt động thể chất nặng, tập gym cường độ cao, nâng tạ hoặc các môn thể thao đòi hỏi sức bền trong ít nhất 24 đến 48 giờ sau khi hiến máu. Việc gắng sức quá sớm có thể gây bục vết tiêm, làm tăng nhịp tim và dẫn đến tình trạng hoa mắt, chóng mặt hoặc ngất xỉu. Nếu muốn vận động, hãy ưu tiên các bài tập thư giãn nhẹ nhàng như đi bộ chậm." }
  },
  faq: {
    ...vi.healthTips.faq,
    q1: {
      question: "Tôi có thể hiến máu nếu đang dùng thuốc không?",
      answer: "Tùy thuộc vào loại thuốc bạn đang dùng. Hầu hết các loại vitamin, thực phẩm chức năng và thuốc tránh thai là an toàn. Tuy nhiên, nếu bạn đang dùng thuốc kháng sinh, thuốc làm loãng máu, hoặc thuốc điều trị mụn đặc trị, bạn có thể cần thời gian chờ (trì hoãn). Vui lòng mang theo đơn thuốc và tham vấn trực tiếp với bác sĩ khám sàng lọc tại Bệnh viện hoặc trung tâm truyền máu."
    },
    q2: {
      question: "Khoảng cách tối thiểu giữa hai lần hiến máu là bao lâu?",
      answer: "Theo quy định của Bộ Y tế, khoảng cách tối thiểu giữa hai lần hiến máu toàn phần là 12 tuần (84 ngày). Khoảng cách này đảm bảo cơ thể bạn có đủ thời gian để tái tạo hoàn toàn lượng hồng cầu và sắt đã cho đi. Đối với hiến thành phần máu (như tiểu cầu), thời gian chờ thường ngắn hơn, dao động từ 2 đến 4 tuần tùy thuộc vào quy định cụ thể của từng cơ sở y tế."
    },
    q3: {
      question: "Yêu cầu về độ tuổi và cân nặng tối thiểu là bao nhiêu?",
      answer: "Người hiến máu cần nằm trong độ tuổi từ 18 đến 60. Về cân nặng, đối với nữ giới cần đạt tối thiểu 42kg và nam giới là 45kg (tuy nhiên để hiến mức 350ml thường yêu cầu cân nặng trên 50kg). Ngoài ra, bạn cần có sức khỏe bình thường, nhịp tim và huyết áp ổn định, không mắc các bệnh mãn tính nguy hiểm hay các bệnh lây nhiễm qua đường máu."
    }
  }
};

en.healthTips = updatedEn;
vi.healthTips = updatedVi;

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2), 'utf8');
console.log("Done");
