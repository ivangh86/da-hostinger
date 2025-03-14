import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, handleError, verifyUserRole } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
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
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Specialty } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SpecialtyFormData {
  name: string;
  code: string;
}

const defaultSpecialtyForm: SpecialtyFormData = {
  name: "",
  code: "",
};

const Specialties = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentSpecialty, setCurrentSpecialty] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState<SpecialtyFormData>(defaultSpecialtyForm);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Acceso restringido",
        description: "No tienes permisos para modificar especialidades",
        variant: "destructive",
      });
    }
    setIsAdminVerified(isAdmin);
  }, [isAdmin]);

  const { data: specialties, isLoading, error: fetchError } = useQuery({
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

  const saveSpecialty = useMutation({
    mutationFn: async () => {
      const isUserAdmin = await verifyUserRole();
      
      if (!isUserAdmin) {
        throw new Error("No tienes permisos para realizar esta acción. Se requiere rol de administrador.");
      }
      
      if (currentSpecialty) {
        const { data, error } = await supabase
          .from("specialties")
          .update({
            name: formData.name,
            code: formData.code,
          })
          .eq("id", currentSpecialty.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("specialties")
          .insert([{
            name: formData.name,
            code: formData.code,
          }])
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: currentSpecialty ? "Especialidad actualizada" : "Especialidad creada",
        description: currentSpecialty 
          ? "La especialidad ha sido actualizada correctamente" 
          : "La especialidad ha sido creada correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
      closeDialog();
    },
    onError: (error) => {
      handleError(error);
    }
  });

  const deleteSpecialty = useMutation({
    mutationFn: async () => {
      if (!currentSpecialty) return;
      
      const isUserAdmin = await verifyUserRole();
      
      if (!isUserAdmin) {
        throw new Error("No tienes permisos para realizar esta acción. Se requiere rol de administrador.");
      }
      
      const { error } = await supabase
        .from("specialties")
        .delete()
        .eq("id", currentSpecialty.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Especialidad eliminada",
        description: "La especialidad ha sido eliminada correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
      closeDeleteDialog();
    },
    onError: (error) => {
      handleError(error);
    }
  });

  const openDialog = (specialty: Specialty | null = null) => {
    if (!isAdminVerified) {
      toast({
        title: "Acceso restringido",
        description: "No tienes permisos para modificar especialidades",
        variant: "destructive",
      });
      return;
    }
    
    if (specialty) {
      setCurrentSpecialty(specialty);
      setFormData({
        name: specialty.name,
        code: specialty.code,
      });
    } else {
      setCurrentSpecialty(null);
      setFormData(defaultSpecialtyForm);
    }
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setCurrentSpecialty(null);
    setFormData(defaultSpecialtyForm);
  };

  const openDeleteDialog = (specialty: Specialty) => {
    if (!isAdminVerified) {
      toast({
        title: "Acceso restringido",
        description: "No tienes permisos para eliminar especialidades",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentSpecialty(specialty);
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setCurrentSpecialty(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSpecialty.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Especialidades</h1>
        
        {isAdminVerified && (
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Especialidad
          </Button>
        )}
      </div>
      
      {!isAdmin && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso limitado</AlertTitle>
          <AlertDescription>
            Solo los administradores pueden crear, editar o eliminar especialidades.
          </AlertDescription>
        </Alert>
      )}
      
      {fetchError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar especialidades</AlertTitle>
          <AlertDescription>
            {fetchError instanceof Error ? fetchError.message : 'Error desconocido'}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Especialidades</CardTitle>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialties?.map((specialty) => (
                    <TableRow key={specialty.id}>
                      <TableCell className="font-medium">{specialty.name}</TableCell>
                      <TableCell>{specialty.code}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDialog(specialty)}
                            disabled={!isAdminVerified}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(specialty)}
                            disabled={!isAdminVerified}
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
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentSpecialty ? "Editar Especialidad" : "Crear Especialidad"}</DialogTitle>
            <DialogDescription>
              {currentSpecialty 
                ? "Modifica los datos de la especialidad" 
                : "Rellena el formulario para crear una nueva especialidad"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  maxLength={10}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveSpecialty.isPending}>
                {saveSpecialty.isPending ? (
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
      
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la especialidad{" "}
              <strong>{currentSpecialty?.name}</strong>?
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
              onClick={() => deleteSpecialty.mutate()} 
              disabled={deleteSpecialty.isPending}
            >
              {deleteSpecialty.isPending ? (
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

export default Specialties;
