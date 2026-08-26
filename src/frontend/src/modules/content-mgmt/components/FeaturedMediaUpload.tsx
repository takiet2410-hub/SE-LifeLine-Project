import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { articleApi } from '../services/articleApi';

interface FeaturedMediaUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

export const FeaturedMediaUpload: React.FC<FeaturedMediaUploadProps> = ({ value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setError('Định dạng ảnh phải là PNG, JPG hoặc WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Dung lượng tệp tối đa 5MB');
      return;
    }

    setLoading(true);
    try {
      const res = await articleApi.uploadImage(file);
      if (res.url) {
        setPreviewUrl(res.url);
        onChange(res.url);
      }
    } catch (e: any) {
      setError('Không thể tải ảnh lên');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Ảnh bìa bài viết
      </label>

      {previewUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-48 w-full max-w-lg group">
          <img src={previewUrl} alt="Cover preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 shadow transition-opacity cursor-pointer"
            title="Xóa ảnh bìa"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 hover:border-red-500 rounded-lg p-6 text-center cursor-pointer transition-colors bg-gray-50 max-w-lg"
        >
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
            id="cover-upload-input"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <label htmlFor="cover-upload-input" className="cursor-pointer block">
            <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-2">
              {loading ? <Upload className="w-6 h-6 animate-bounce" /> : <ImageIcon className="w-6 h-6" />}
            </div>
            <p className="text-sm font-medium text-gray-900">
              {loading ? 'Đang tải lên...' : 'Nhấn để tải lên hoặc kéo thả tệp vào đây'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Kích thước khuyến nghị 1200×630px (PNG, JPG tối đa 5MB)</p>
          </label>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};
