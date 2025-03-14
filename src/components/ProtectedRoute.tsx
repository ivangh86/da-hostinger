
import { ReactNode, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Si no hay usuario autenticado y no está cargando, redirigir a login
    if (!user && !isLoading) {
      console.log("No hay usuario autenticado, redirigiendo a login");
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    console.log("No hay usuario autenticado, renderizando Navigate");
    return <Navigate to="/login" replace />;
  }

  console.log("Usuario autenticado, renderizando children");
  return <>{children}</>;
};

export default ProtectedRoute;
