import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.config';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Link ảnh avatar mặc định (Bạn có thể upload 1 logo/icon lên Cloudinary của bạn và lấy link dán vào đây)
export const DEFAULT_AVATAR_URL = "https://res.cloudinary.com/ioqwrsde/image/upload/v1784635061/images_org0cq.jpg"; 

export default cloudinary;