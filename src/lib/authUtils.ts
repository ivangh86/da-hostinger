
import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

// Verifica el estado actual de la sesión y devuelve información detallada
export const checkAuthState = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error al verificar sesión:", error);
      return {
        isAuthenticated: false,
        sessionInfo: null,
        error: error.message
      };
    }
    
    return {
      isAuthenticated: !!data.session,
      sessionInfo: data.session,
      error: null
    };
  } catch (err) {
    console.error("Error inesperado al verificar autenticación:", err);
    return {
      isAuthenticated: false,
      sessionInfo: null,
      error: "Error inesperado al verificar autenticación"
    };
  }
};

// Función para diagnosticar problemas de autenticación
export const diagnosisAuthIssues = async () => {
  const authState = await checkAuthState();
  
  if (!authState.isAuthenticated) {
    toast({
      title: "No hay sesión activa",
      description: authState.error || "No se detectó una sesión de usuario válida",
      variant: "destructive",
    });
    return {
      success: false,
      message: "No hay sesión activa",
      details: authState
    };
  }
  
  try {
    // Intentar una operación básica para verificar que la autenticación funciona correctamente
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, full_name, role')
      .limit(1);
    
    if (userError) {
      console.error("Error al acceder a datos:", userError);
      toast({
        title: "Error de acceso a datos",
        description: userError.message,
        variant: "destructive",
      });
      return {
        success: false,
        message: "Error de acceso a datos con la sesión actual",
        details: { authState, error: userError }
      };
    }
    
    toast({
      title: "Sesión válida",
      description: `Usuario autenticado: ${authState.sessionInfo?.user.email}`,
    });
    
    return {
      success: true,
      message: "Autenticación correcta",
      details: { authState, userData }
    };
  } catch (err) {
    console.error("Error en diagnóstico de autenticación:", err);
    return {
      success: false,
      message: "Error en diagnóstico de autenticación",
      details: { authState, error: err }
    };
  }
};
