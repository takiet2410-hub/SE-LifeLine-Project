import { Request, Response } from 'express';
import { uploadImageToCloudinary, DEFAULT_AVATAR_URL } from '../../../utils/cloudinary.util';

export class ArticleUploadController {
  static async uploadImage(req: Request, res: Response) {
    try {
      const file = (req as any).file;
      const imageBase64 = req.body?.imageBase64 || req.body?.image;
      const imageUrlInput = req.body?.imageUrl;

      if (imageUrlInput) {
        return res.status(200).json({
          success: true,
          message: 'Image URL received',
          url: imageUrlInput
        });
      }

      let imageUrl = '';
      if (file && file.buffer) {
        try {
          imageUrl = await uploadImageToCloudinary(file.buffer, 'articles');
        } catch (e) {
          console.warn('Cloudinary upload failed, falling back to base64 data URL:', e);
          const mimeType = file.mimetype || 'image/png';
          imageUrl = `data:${mimeType};base64,${file.buffer.toString('base64')}`;
        }
      } else if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
        try {
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          imageUrl = await uploadImageToCloudinary(buffer, 'articles');
        } catch (e) {
          console.warn('Cloudinary upload failed, keeping base64 data URL:', e);
          imageUrl = imageBase64;
        }
      }

      if (!imageUrl) {
        imageUrl = DEFAULT_AVATAR_URL;
      }

      return res.status(200).json({
        success: true,
        message: 'Image processed successfully',
        url: imageUrl
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Image upload failed' });
    }
  }
}
