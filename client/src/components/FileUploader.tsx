import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
import clsx from 'clsx';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  preview?: boolean;
  className?: string;
}

function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only downscale, never upscale
      if (width <= maxWidth && height <= maxHeight) {
        resolve(file);
        return;
      }

      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const resizedFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function FileUploader({
  onFileSelect,
  accept = 'image/*,video/*',
  maxSize = 10 * 1024 * 1024,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85,
  preview = true,
  className,
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [objectFit, setObjectFit] = useState<'cover' | 'contain'>('cover');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.size > maxSize) {
        setError(`Файл слишком большой. Максимум: ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }

      try {
        setProcessing(true);

        let processedFile = file;
        if (file.type.startsWith('image/')) {
          processedFile = await resizeImage(file, maxWidth, maxHeight, quality);
        }

        if (preview && processedFile.type.startsWith('image/')) {
          const url = URL.createObjectURL(processedFile);
          setPreviewUrl(url);
        } else if (preview && processedFile.type.startsWith('video/')) {
          const url = URL.createObjectURL(processedFile);
          setPreviewUrl(url);
        }

        onFileSelect(processedFile);
      } catch {
        setError('Ошибка обработки изображения');
      } finally {
        setProcessing(false);
      }
    },
    [maxSize, maxWidth, maxHeight, quality, onFileSelect, preview]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  return (
    <div className={className}>
      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-glass-border">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48"
            style={{ objectFit }}
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <motion.button
              className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-colors"
              onClick={() => setObjectFit(f => f === 'cover' ? 'contain' : 'cover')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={objectFit === 'cover' ? 'Показать целиком' : 'Заполнить'}
            >
              {objectFit === 'cover' ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </motion.button>
            <motion.button
              className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white border border-white/20 hover:bg-red-500/60 transition-colors"
              onClick={clearPreview}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      ) : (
        <motion.div
          className={clsx(
            'relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer',
            processing
              ? 'border-accent-gold bg-accent-gold/5'
              : isDragOver
                ? 'border-accent-cyan bg-accent-cyan/10 shadow-glow-cyan'
                : 'border-glass-border bg-glass-bg hover:border-accent-cyan/40 hover:bg-accent-cyan/5'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !processing && inputRef.current?.click()}
          whileHover={processing ? {} : { scale: 1.01 }}
          animate={isDragOver ? { scale: 1.02 } : { scale: 1 }}
        >
          <motion.div
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center',
              processing ? 'bg-accent-gold/20' : isDragOver ? 'bg-accent-cyan/20' : 'bg-glass-bg'
            )}
            animate={isDragOver ? { y: -4 } : { y: 0 }}
          >
            {processing ? (
              <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
            ) : isDragOver ? (
              <Upload className="w-6 h-6 text-accent-cyan" />
            ) : (
              <ImageIcon className="w-6 h-6 text-white/40" />
            )}
          </motion.div>

          <div className="text-center">
            <p className="text-sm text-white/60">
              {processing
                ? 'Обработка изображения...'
                : isDragOver
                  ? 'Отпустите файл'
                  : 'Перетащите файл или нажмите для выбора'}
            </p>
            <p className="text-xs text-white/30 mt-1">
              {processing
                ? 'Автоматический подгон размера'
                : `Макс. ${Math.round(maxSize / 1024 / 1024)}MB · Авто-ресайз до ${maxWidth}×${maxHeight}`}
            </p>
          </div>
        </motion.div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
