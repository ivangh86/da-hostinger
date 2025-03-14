export const APP_CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  APP_NAME: 'DA Hostinger',
  APP_VERSION: '1.0.0',
  DEFAULT_LOCALE: 'es',
  SUPPORTED_LOCALES: ['es', 'en'],
  DATE_FORMAT: 'dd/MM/yyyy',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
  },
  CACHE: {
    STALE_TIME: 5 * 60 * 1000, // 5 minutos
    CACHE_TIME: 10 * 60 * 1000, // 10 minutos
    RETRY_COUNT: 2
  },
  AUTH: {
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'user_data',
    TOKEN_EXPIRY: 24 * 60 * 60 * 1000 // 24 horas
  }
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PLANNING: '/planning',
  REGISTER: '/register',
  USERS: '/users',
  ACTIVITIES: '/activities',
  CENTERS: '/centers',
  SPECIALTIES: '/specialties',
  CONSULTATIONS: '/consultations',
  ACCESS: '/access',
  VISIT_COUNTERS: '/visit-counters',
  NOT_FOUND: '*'
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me'
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`
  },
  ACTIVITIES: {
    BASE: '/activities',
    BY_ID: (id: string) => `/activities/${id}`
  },
  CENTERS: {
    BASE: '/centers',
    BY_ID: (id: string) => `/centers/${id}`
  },
  SPECIALTIES: {
    BASE: '/specialties',
    BY_ID: (id: string) => `/specialties/${id}`
  },
  CONSULTATIONS: {
    BASE: '/consultations',
    BY_ID: (id: string) => `/consultations/${id}`
  }
} as const;

export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    SESSION_EXPIRED: 'Sesión expirada',
    UNAUTHORIZED: 'No autorizado',
    FORBIDDEN: 'Acceso denegado'
  },
  VALIDATION: {
    REQUIRED_FIELD: 'Este campo es requerido',
    INVALID_EMAIL: 'Email inválido',
    INVALID_PASSWORD: 'La contraseña debe tener al menos 8 caracteres',
    PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden'
  },
  API: {
    NETWORK_ERROR: 'Error de conexión',
    SERVER_ERROR: 'Error del servidor',
    NOT_FOUND: 'Recurso no encontrado'
  },
  VISIT_COUNTERS: {
    LOAD_ERROR: 'Error al cargar las consultas',
    UPDATE_ERROR: 'Error al actualizar el estado de la consulta',
    UPDATE_SUCCESS: 'Estado de la consulta actualizado correctamente'
  }
} as const; 