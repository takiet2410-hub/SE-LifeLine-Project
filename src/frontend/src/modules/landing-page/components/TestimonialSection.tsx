import React from 'react';
import { IconQuote } from '../../../shared/components/Icons/IconQuote';

export const TestimonialSection: React.FC = () => {
  const testimonials = [
    {
      id: '1',
      authorName: 'Hoàng Minh',
      donorRoleKey: 'Regular Donor',
      quoteKey: '"The app made finding a donation center so easy. I was in and out in 30 minutes, and I love seeing how many people my blood helped!"',
      avatarUrl: 'https://i.pravatar.cc/150?u=1'
    },
    {
      id: '2',
      authorName: 'Trần Linh',
      donorRoleKey: 'Student Volunteer',
      quoteKey: '"Using the AI chatbot to check if I was eligible saved me a trip when I was on medication. It\'s truly a modern way to save lives."',
      avatarUrl: 'https://i.pravatar.cc/150?u=2'
    },
    {
      id: '3',
      authorName: 'Nguyễn Khánh',
      donorRoleKey: 'Corporate Donor',
      quoteKey: '"The E-ticket feature is a game changer. No more paperwork at the hospital. I just show my QR code and I\'m ready to donate."',
      avatarUrl: 'https://i.pravatar.cc/150?u=3'
    }
  ];

  return (
    <section className="w-full bg-[#FFF8F7] py-24 px-6 lg:px-12">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-16">
        <h2 className="text-4xl font-bold text-gray-900 text-center">What Our Donors Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="bg-white border border-[#F1F3F5] rounded-2xl p-8 shadow-sm relative flex flex-col gap-8">
              <div className="absolute top-6 right-6 text-gray-200">
                <IconQuote className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-[#5B403D] text-base leading-relaxed italic z-10 flex-grow">
                {testimonial.quoteKey}
              </p>
              <div className="flex items-center gap-4">
                <img src={testimonial.avatarUrl} alt={testimonial.authorName} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 text-base">{testimonial.authorName}</span>
                  <span className="text-[#5B403D] font-medium text-xs">{testimonial.donorRoleKey}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
