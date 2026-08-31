export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
];

export const ALLOWED_FILE_EXTENSIONS = ".pdf,.docx,.pptx,.png,.jpg,.jpeg";

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function isAllowedFileType(fileType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(fileType);
}

export function isAllowedFileSize(fileSize: number): boolean {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE_BYTES;
}