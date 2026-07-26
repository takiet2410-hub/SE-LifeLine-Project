import axios from 'axios';

/**
 * Upload ảnh trực tiếp từ trình duyệt lên Cloudinary (Cách 1)
 * Trao quyền đẩy file cho Cloudinary để giảm tải cho Backend Server
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'lifeline_preset';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );
    return response.data.secure_url;
  } catch (error) {
    console.error('Failed to upload image to Cloudinary:', error);
    throw new Error('Image upload failed');
  }
}
