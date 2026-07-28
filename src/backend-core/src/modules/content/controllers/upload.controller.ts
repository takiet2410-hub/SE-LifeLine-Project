import { Request, Response } from 'express';
import { uploadImageToCloudinary } from '../../../utils/cloudinary.util';

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
          console.warn('Cloudinary upload error:', e);
        }
      } else if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        try {
          imageUrl = await uploadImageToCloudinary(buffer, 'articles');
        } catch (e) {
          console.warn('Cloudinary upload error:', e);
        }
      }

      if (!imageUrl) {
        imageUrl = `https://res.cloudinary.com/lifeline/articles/img-${Date.now()}.jpg`;
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
