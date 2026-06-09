import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  preview?: boolean;
  className?: string;
}

export function FileUploader({
  onFileSelect,
  accept = 'image/*,video/*',
  maxSize = 10 * 1024 * 1024,
  preview = true,
  className,
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (file.size > maxSize) {
        setError(`Файл слишком большой. Максимум: ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }

      if (preview && file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else if (preview && file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }

      onFileSelect(file);
    },
    [maxSize, onFileSelect, preview]
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
            className="w-full h-48 object-cover"
          />
          <motion.button
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white border border-white/20 hover:bg-red-500/60 transition-colors"
            onClick={clearPreview}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      ) : (
        <motion.div
          className={clsx(
            'relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer',
            isDragOver
              ? 'border-accent-gold bg-accent-gold/10 shadow-glow-gold'
              : 'border-glass-border bg-glass-bg hover:border-accent-gold/40 hover:bg-accent-gold/5'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          whileHover={{ scale: 1.01 }}
          animate={isDragOver ? { scale: 1.02 } : { scale: 1 }}
        >
          <motion.div
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center',
              isDragOver ? 'bg-accent-gold/20' : 'bg-glass-bg'
            )}
            animate={isDragOver ? { y: -4 } : { y: 0 }}
          >
            {isDragOver ? (
              <Upload className="w-6 h-6 text-accent-gold" />
            ) : (
              <ImageIcon className="w-6 h-6 text-white/40" />
            )}
          </motion.div>

          <div className="text-center">
            <p className="text-sm text-white/60">
              {isDragOver ? 'Отпустите файл' : 'Перетащите файл или нажмите для выбора'}
            </p>
            <p className="text-xs text-white/30 mt-1">
              Максимум {Math.round(maxSize / 1024 / 1024)}MB
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

