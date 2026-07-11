import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { supabase } from '../config/supabase';

// Используем оперативную память для хранения загружаемых файлов перед отправкой в Supabase
const storage = multer.memoryStorage();

const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.mp4', '.webm', '.mov'];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMETYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый формат файла. Разрешены: JPEG, PNG, WebP, HEIC, MP4, WebM, MOV'));
  }
};

const uploadInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export const uploadSingle = (fieldName: string) => uploadInstance.single(fieldName);
export const uploadArray = (fieldName: string, maxCount: number) =>
  uploadInstance.array(fieldName, maxCount);

/**
 * Загружает файл в Supabase Storage и возвращает публичный URL.
 */
export async function uploadToSupabase(
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${uuidv4()}${ext}`;
  const filePath = `${folder}/${filename}`;

  const { data, error } = await supabase.storage
    .from('sport-lounge')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
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

export default uploadInstance;
