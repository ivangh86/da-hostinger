
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, handleError } from "@/lib/supabase";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Loader2, 
  Plus, 
  RefreshCw, 
  UserPlus, 
  Mail, 
  UserCheck 
} from "lucide-react";
import { User } from "@/types";
import { toast } from "@/hooks/use-toast";

const Access = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    role: "user",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users with auth accounts
  const { data: users, isLoading: queryLoading, refetch, isError, error } = useQuery({
    queryKey: ["users-auth"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .not("auth_id", "is", null)
          .order("full_name");
        
        if (error) throw error;
        return data as User[];
      } catch (error) {
        console.error("Error al cargar usuarios con acceso:", error);
        handleError(error);
        return [];
      }
    },
    retry: false,
    placeholderData: []
  });

  // Función para crear un nuevo acceso
  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.full_name || !newUser.email || !newUser.password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: { full_name: newUser.full_name, role: newUser.role }
      });
      
      if (authError) throw authError;
      
      if (authData?.user) {
        // 2. Crear perfil en tabla users
        const { error: userError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id,
            email: newUser.email,
            full_name: newUser.full_name,
            role: newUser.role,
            is_active: true
          });
          
        if (userError) throw userError;
        
        // Éxito
        toast({
          title: "Acceso creado",
          description: `Se ha creado el acceso para ${newUser.full_name}`,
        });
        
        // Cerrar diálogo y limpiar form
        setIsDialogOpen(false);
        setNewUser({
          full_name: "",
          email: "",
          role: "user",
          password: ""
        });
        
        // Refrescar lista
        refetch();
      }
    } catch (error) {
      console.error("Error al crear nuevo acceso:", error);
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para refrescar datos manualmente
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      toast({
        title: "Datos actualizados",
        description: "La lista de usuarios con acceso ha sido actualizada",
      });
    } catch (refreshError) {
      console.error("Error al refrescar datos:", refreshError);
      handleError(refreshError);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Accesos</h1>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={queryLoading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button onClick={() => setIsDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Acceso
          </Button>
        </div>
      </div>
      
      <Card className="shadow-md">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center text-primary">
            <UserCheck className="h-5 w-5 mr-2" />
            Usuarios con Acceso
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          {queryLoading || isRefreshing ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
              <p className="text-destructive mb-4">Error al cargar los datos</p>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Intentar de nuevo
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Activo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {user.role === "admin" ? "Administrador" : "Lectura"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No hay usuarios con acceso registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para crear nuevo acceso */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Acceso</DialogTitle>
            <DialogDescription>
              Introduce los datos del nuevo usuario para crear su acceso al sistema.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateAccess}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({...newUser, role: value})}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Lectura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Acceso
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Access;
