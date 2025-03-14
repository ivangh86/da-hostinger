
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true
  });
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Verificando sesión existente...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Sesión encontrada:', session);
          // Usuario está autenticado, obtener datos del perfil
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (userError) {
            console.error('Error obteniendo datos de usuario:', userError);
            await supabase.auth.signOut(); // Cerrar sesión si hay error
            setState({ user: null, isLoading: false });
            return;
          }

          console.log('Datos de usuario obtenidos:', userData);
          
          setState({ 
            user: userData as User,
            isLoading: false 
          });
          
          setIsAdmin(userData?.role === 'admin');
        } else {
          // No hay sesión activa
          console.log('No se encontró sesión activa');
          setState({ user: null, isLoading: false });
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
        setState({ user: null, isLoading: false });
        setIsAdmin(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setState({ ...state, isLoading: true });
      
      // Depurando el proceso de login
      console.log('Intentando iniciar sesión con:', email);
      
      // Verificar que las credenciales no estén vacías
      if (!email || !password) {
        throw new Error('Credenciales incompletas');
      }
      
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Error en signInWithPassword:', signInError);
        throw signInError;
      }

      console.log('Respuesta auth:', authData);

      if (!authData.user) {
        console.error('No se encontró usuario en la respuesta');
        throw new Error('No user data returned');
      }

      // Obtener datos del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single();

      if (userError) {
        console.error('Error obteniendo datos de usuario:', userError);
        throw userError;
      }

      console.log('Datos de usuario obtenidos:', userData);

      setState({ 
        user: userData as User,
        isLoading: false 
      });
      
      setIsAdmin(userData?.role === 'admin');
      
      toast({
        title: "Éxito",
        description: "Has iniciado sesión correctamente",
      });
      
    } catch (error: any) {
      console.error('Error completo en login:', error);
      setState({ ...state, isLoading: false });
      toast({
        title: "Error",
        description: "Error al iniciar sesión. Verifica tus credenciales.",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      setState({ ...state, isLoading: true });
      await supabase.auth.signOut();
      setState({ user: null, isLoading: false });
      setIsAdmin(false);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setState({ ...state, isLoading: false });
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
