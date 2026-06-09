import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { supabase } from '../config/supabase';
import sharp from 'sharp';

// Используем оперативную память для хранения загружаемых файлов перед отправкой в Supabase
const storage = multer.memoryStorage();

const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/avif',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.avif', '.gif', '.bmp', '.tiff', '.tif', '.mp4', '.webm', '.mov'];

const IMAGE_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/avif', 'image/gif', 'image/bmp', 'image/tiff'];
const IMAGE_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.avif', '.gif', '.bmp', '.tiff', '.tif'];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMETYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый формат файла. Разрешены: JPEG, PNG, WebP, HEIC, AVIF, GIF, BMP, TIFF, MP4, WebM, MOV'));
  }
};

const uploadInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB (allow larger input since we compress to AVIF)
  },
});

export const uploadSingle = (fieldName: string) => uploadInstance.single(fieldName);
export const uploadArray = (fieldName: string, maxCount: number) =>
  uploadInstance.array(fieldName, maxCount);

/**
 * Converts an image buffer to AVIF format using sharp.
 * Returns the converted buffer or the original if conversion fails.
 */
async function convertToAvif(
  buffer: Buffer,
  mimetype: string,
  originalname: string,
  options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
): Promise<{ buffer: Buffer; ext: string; mimetype: string }> {
  const ext = path.extname(originalname).toLowerCase();
  const isImage = IMAGE_MIMETYPES.includes(mimetype) || IMAGE_EXTENSIONS.includes(ext);

  if (!isImage) {
    // Not an image (e.g. video), return as-is
    return { buffer, ext, mimetype };
  }

  try {
    const { quality = 65, maxWidth = 2048, maxHeight = 2048 } = options;

    let pipeline = sharp(buffer);

    // Get metadata to apply smart resizing
    const metadata = await pipeline.metadata();
    if (metadata.width && metadata.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true });
    }

    const avifBuffer = await pipeline
      .avif({ quality, effort: 4 })
      .toBuffer();

    console.log(`📸 AVIF conversion: ${originalname} (${(buffer.length / 1024).toFixed(0)}KB) → (${(avifBuffer.length / 1024).toFixed(0)}KB) — ${((1 - avifBuffer.length / buffer.length) * 100).toFixed(0)}% smaller`);

    return { buffer: avifBuffer, ext: '.avif', mimetype: 'image/avif' };
  } catch (err) {
    console.warn('⚠️ AVIF conversion failed, using original format:', err);
    return { buffer, ext, mimetype };
  }
}

/**
 * Загружает файл в Supabase Storage и возвращает публичный URL.
 * Изображения автоматически конвертируются в AVIF для экономии места.
 */
export async function uploadToSupabase(
  file: Express.Multer.File,
  folder: string = 'uploads',
  avifOptions?: { quality?: number; maxWidth?: number; maxHeight?: number }
): Promise<string> {
  // Convert images to AVIF
  const converted = await convertToAvif(file.buffer, file.mimetype, file.originalname, avifOptions);

  const filename = `${uuidv4()}${converted.ext}`;
  const filePath = `${folder}/${filename}`;

  const { data, error } = await supabase.storage
    .from('sport-lounge')
    .upload(filePath, converted.buffer, {
      contentType: converted.mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Ошибка загрузки в Supabase Storage: ${error.message}`);
  }

  // Получаем публичную ссылку на файл
  const { data: publicUrlData } = supabase.storage
    .from('sport-lounge')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Удаляет файл из Supabase Storage по его публичному URL.
 */
export async function deleteFromSupabase(url: string): Promise<void> {
  try {
    const bucket = 'sport-lounge';
    const searchString = `/storage/v1/object/public/${bucket}/`;
    const index = url.indexOf(searchString);
    if (index === -1) return;
    const filePath = url.substring(index + searchString.length);

    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      console.error(`Ошибка при удалении ${filePath} из Supabase Storage:`, error.message);
    }
  } catch (error) {
    console.error('Ошибка удаления из Supabase Storage:', error);
  }
}

export { convertToAvif };
export default uploadInstance;
