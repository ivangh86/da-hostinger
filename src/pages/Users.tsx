
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, handleError } from "@/lib/supabase";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { User, Specialty, Consultation } from "@/types";

interface UserFormData {
  full_name: string;
  email: string;
  specialty_id: string;
  role: "admin" | "readonly";
  is_active: boolean;
  consultation_id: string | null;
}

const defaultUserForm: UserFormData = {
  full_name: "",
  email: "",
  specialty_id: "",
  role: "readonly",
  is_active: true,
  consultation_id: null,
};

const Users = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultUserForm);

  // Fetch users
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          specialty:specialties(*),
          consultation:consultations(*)
        `)
        .order("full_name");
      
      if (error) throw error;
      return data as User[];
    }
  });

  // Fetch specialties
  const { data: specialties, isLoading: loadingSpecialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Specialty[];
    }
  });

  // Fetch consultations
  const { data: consultations, isLoading: loadingConsultations } = useQuery({
    queryKey: ["consultations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select("*, specialty:specialties(*)")
        .order("consultation_number");
      
      if (error) throw error;
      return data as Consultation[];
    }
  });

  // Create/update user mutation
  const saveUser = useMutation({
    mutationFn: async () => {
      if (currentUser) {
        // Update existing user
        const { data, error } = await supabase
          .from("users")
          .update({
            full_name: formData.full_name,
            email: formData.email,
            specialty_id: formData.specialty_id || null,
            role: formData.role,
            is_active: formData.is_active,
            consultation_id: formData.consultation_id,
          })
          .eq("id", currentUser.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        // Create new user
        const { data, error } = await supabase
          .from("users")
          .insert([{
            full_name: formData.full_name,
            email: formData.email,
            specialty_id: formData.specialty_id || null,
            role: formData.role,
            is_active: formData.is_active,
            consultation_id: formData.consultation_id,
          }])
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: currentUser ? "Usuario actualizado" : "Usuario creado",
        description: currentUser 
          ? "El usuario ha sido actualizado correctamente" 
          : "El usuario ha sido creado correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeDialog();
    },
    onError: (error) => {
      handleError(error);
    }
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async () => {
      if (!currentUser) return;
      
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", currentUser.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeDeleteDialog();
    },
    onError: (error) => {
      handleError(error);
    }
  });

  const openDialog = (user: User | null = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        full_name: user.full_name,
        email: user.email,
        specialty_id: user.specialty_id || "",
        role: user.role,
        is_active: user.is_active,
        consultation_id: user.consultation_id || null,
      });
    } else {
      setCurrentUser(null);
      setFormData(defaultUserForm);
    }
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setCurrentUser(null);
    setFormData(defaultUserForm);
  };

  const openDeleteDialog = (user: User) => {
    setCurrentUser(user);
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setCurrentUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveUser.mutate();
  };

  const isLoading = loadingUsers || loadingSpecialties || loadingConsultations || saveUser.isPending || deleteUser.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
        </CardHeader>
        
        <CardContent>
          {loadingUsers ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead>Consulta</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.specialty?.name || "-"}</TableCell>
                      <TableCell>
                        {user.role === "admin" ? "Administrador" : "Lectura"}
                      </TableCell>
                      <TableCell>
                        {user.is_active ? "Sí" : "No"}
                      </TableCell>
                      <TableCell>
                        {user.consultation?.consultation_number || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentUser ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
            <DialogDescription>
              {currentUser 
                ? "Modifica los datos del usuario existente" 
                : "Rellena el formulario para crear un nuevo usuario"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="specialty">Especialidad</Label>
                <Select 
                  value={formData.specialty_id} 
                  onValueChange={(value) => setFormData({ ...formData, specialty_id: value })}
                >
                  <SelectTrigger id="specialty">
                    <SelectValue placeholder="Selecciona una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna especialidad</SelectItem>
                    {specialties?.map((specialty) => (
                      <SelectItem key={specialty.id} value={specialty.id}>
                        {specialty.name} ({specialty.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: "admin" | "readonly") => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="readonly">Lectura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="consultation">Consulta (opcional)</Label>
                <Select 
                  value={formData.consultation_id || "none"} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    consultation_id: value === "none" ? null : value 
                  })}
                >
                  <SelectTrigger id="consultation">
                    <SelectValue placeholder="Selecciona una consulta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna consulta</SelectItem>
                    {consultations?.map((consultation) => (
                      <SelectItem key={consultation.id} value={consultation.id}>
                        {consultation.consultation_number} 
                        {consultation.extension && ` (Ext: ${consultation.extension})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_active: checked as boolean })
                  } 
                />
                <Label htmlFor="is_active">Usuario activo</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar al usuario{" "}
              <strong>{currentUser?.full_name}</strong>?
              <br />
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDeleteDialog}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => deleteUser.mutate()} 
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
