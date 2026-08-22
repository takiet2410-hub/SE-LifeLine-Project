import React from 'react';

export const OurStory: React.FC = () => {
  return (
    <section className="bg-[#FCF9F9] py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 w-full">
          <div className="rounded-3xl shadow-2xl overflow-hidden aspect-[4/3] w-full">
             <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000" alt="App interface" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-start text-left">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#2D3748] mb-6">
            Câu Chuyện Của Chúng Tôi
          </h2>
          <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
            <p>Được thành lập vào năm 2024, LifeLine khởi nguồn từ một mục tiêu giản dị: hiện đại hóa toàn diện quy trình hiến máu và quản lý ngân hàng máu tại Việt Nam. Chúng tôi từng chứng kiến những thời khắc cấp bách khi các gia đình phải loay hoay tìm người hiến máu qua mạng xã hội trong tâm trạng âu lo.</p>
            <p>Chúng tôi quyết tâm xây dựng một giải pháp công nghệ số hóa toàn diện giúp việc hiến máu trở nên dễ dàng, minh bạch và ý nghĩa hơn. Bằng cách kết nối quy trình điều phối của bệnh viện với trải nghiệm di động thân thiện cho tình nguyện viên, LifeLine đang từng bước kiến tạo mạng lưới y tế vững chắc cho tương lai.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
