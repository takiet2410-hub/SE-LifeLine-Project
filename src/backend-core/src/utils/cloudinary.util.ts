import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.config';

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

// Link ảnh avatar mặc định (Bạn có thể upload 1 logo/icon lên Cloudinary của bạn và lấy link dán vào đây)
export const DEFAULT_AVATAR_URL = "https://res.cloudinary.com/ioqwrsde/image/upload/v1784635061/images_org0cq.jpg"; 

export const uploadImageToCloudinary = async (fileBuffer: Buffer, folder: string = 'lifeline'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url as string);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const verifyCloudinaryConnection = async (): Promise<boolean> => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) return false;

  try {
    await Promise.race([
      cloudinary.api.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cloudinary health check timed out')), 5000)),
    ]);
    return true;
  } catch (error) {
    console.error('[Cloudinary] Connection verification failed:', error);
    return false;
  }
};

export default cloudinary;
