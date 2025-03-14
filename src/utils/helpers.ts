import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { APP_CONFIG } from '@/config/constants';

export const formatDate = (date: Date | string, formatStr: string = APP_CONFIG.DATE_FORMAT): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: esLocale });
};

export const formatTime = (date: Date | string, formatStr: string = APP_CONFIG.TIME_FORMAT): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: esLocale });
};

export const formatDateTime = (date: Date | string, formatStr: string = APP_CONFIG.DATETIME_FORMAT): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: esLocale });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isValidFileType = (file: File): boolean => {
  return APP_CONFIG.ALLOWED_FILE_TYPES.includes(file.type as typeof APP_CONFIG.ALLOWED_FILE_TYPES[number]);
};

export const isValidFileSize = (file: File): boolean => {
  return file.size <= APP_CONFIG.MAX_FILE_SIZE;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}; 