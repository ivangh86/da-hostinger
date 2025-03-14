
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

const supabaseUrl = 'https://ckelwaqizprogwvvedsd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZWx3YXFpenByb2d3dnZlZHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2OTEzMjEsImV4cCI6MjA1NzI2NzMyMX0.rtmnYzcJUxhLiRGZM6Co5Ma-EJj06R4Gf-ItErD-AIQ';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Cambiado a false para evitar problemas con la detección de URL
    storageKey: 'supabase.auth.token',
    storage: {
      getItem: (key) => {
        try {
          return window.localStorage.getItem(key);
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          window.localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          window.localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      },
    },
  },
  global: {
    fetch: (input, init) => fetch(input, init)
  },
});

export async function handleError(error: any) {
  console.error('Error:', error);
  
  // Asegurarse de que se muestre un mensaje de error significativo
  const errorMessage = error?.message || error?.error_description || 'Ha ocurrido un error inesperado';
  
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive',
  });
  
  // Devolver el error para poder manejarlo donde se llame a esta función
  return error;
}

// Función para limpiar la sesión en caso de problemas
export function clearAuthSession() {
  try {
    // Limpiar localStorage
    localStorage.removeItem('supabase.auth.token');
    
    // Recargar la aplicación para reiniciar todo el estado
    window.location.href = '/login';
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

// Función para verificar si el usuario es administrador según su JWT
export async function verifyUserRole() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('No hay sesión activa');
      return false;
    }
    
    // Verificar si el usuario tiene el rol de admin en la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single();
      
    if (userError) {
      console.error('Error al verificar rol de usuario:', userError);
      return false;
    }
    
    return userData?.role === 'admin';
  } catch (error) {
    console.error('Error al verificar rol:', error);
    return false;
  }
}

// Define a type for the diagnostic result
export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: {
    session: {
      active: boolean;
      info: {
        userId: string;
        userEmail: string;
        tokenExpiry: string;
        role: string;
      } | null;
    };
    userInfo: {
      success: boolean;
      data: any;
      error: string | null;
    };
    readAccess: {
      specialties: {
        success: boolean;
        data: string | null;
        error: string | null;
      };
    };
    userRole: {
      success: boolean;
      role: string;
      error: string | null;
    };
  };
}

export async function diagnosePolicyIssues(): Promise<DiagnosticResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        message: 'No hay sesión activa. El usuario no está autenticado.',
        details: undefined
      };
    }
    
    // Prueba 1: Obtener información del usuario actual
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', session.user.id)
      .single();
    
    // Prueba 2: Intentar leer especialidades (debería funcionar para todos los usuarios)
    const { data: specialties, error: specialtiesError } = await supabase
      .from('specialties')
      .select('*')
      .limit(1);
    
    // Prueba 3: Verificar rol específico en la base de datos
    const { data: roleData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single();
    
    // Información detallada del token JWT para depuración
    const jwtInfo = session ? {
      userId: session.user.id,
      userEmail: session.user.email,
      tokenExpiry: new Date(session.expires_at * 1000).toLocaleString(),
      role: session.user.role,
    } : null;
    
    return {
      success: true,
      message: 'Diagnóstico completado',
      details: {
        session: {
          active: !!session,
          info: jwtInfo
        },
        userInfo: {
          success: !userError,
          data: userData,
          error: userError ? userError.message : null
        },
        readAccess: {
          specialties: {
            success: !specialtiesError,
            data: specialties ? 'Datos recuperados correctamente' : null,
            error: specialtiesError ? specialtiesError.message : null
          }
        },
        userRole: {
          success: !roleError,
          role: roleData?.role || 'desconocido',
          error: roleError ? roleError.message : null
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al realizar diagnóstico',
      details: undefined
    };
  }
}
