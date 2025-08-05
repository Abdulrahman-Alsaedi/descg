import React, { useState, useRef } from 'react';
import { Upload, X, Image, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Use the URL as returned by the backend (already includes the full URL)
        onChange(data.url);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
    setError('');
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Product Image
      </label>
      
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Product preview"
            className="w-full h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openFileDialog}
                disabled={disabled || uploading}
                className="bg-white text-gray-700 hover:bg-gray-50"
                icon={Upload}
              >
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRemove}
                disabled={disabled}
                className="bg-white text-red-600 hover:bg-red-50"
                icon={X}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={openFileDialog}
          className={`
            border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer
            hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Uploading image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Image className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Click to upload image</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
};
