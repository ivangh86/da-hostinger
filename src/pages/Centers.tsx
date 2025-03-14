
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Center } from "@/types";

interface CenterFormData {
  name: string;
  address: string;
}

const defaultCenterForm: CenterFormData = {
  name: "",
  address: "",
};

const Centers = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<Center | null>(null);
  const [formData, setFormData] = useState<CenterFormData>(defaultCenterForm);

  // Fetch centers
  const { data: centers, isLoading } = useQuery({
    queryKey: ["centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("centers")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Center[];
    }
  });

  // Create/update center mutation
  const saveCenter = useMutation({
    mutationFn: async () => {
      if (currentCenter) {
        // Update existing center
        const { data, error } = await supabase
          .from("centers")
          .update({
            name: formData.name,
            address: formData.address,
          })
          .eq("id", currentCenter.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        // Create new center
        const { data, error } = await supabase
          .from("centers")
          .insert([{
            name: formData.name,
            address: formData.address,
          }])
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: currentCenter ? "Centro actualizado" : "Centro creado",
        description: currentCenter 
          ? "El centro ha sido actualizado correctamente" 
          : "El centro ha sido creado correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      closeDialog();
    },
    onError: (error) => {
      handleError(error);
    }
  });

  // Delete center mutation
  const deleteCenter = useMutation({
    mutationFn: async () => {
      if (!currentCenter) return;
      
      const { error } = await supabase
        .from("centers")
        .delete()
        .eq("id", currentCenter.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Centro eliminado",
        description: "El centro ha sido eliminado correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      closeDeleteDialog();
    },
    onError: (error) => {
      handleError(error);
    }
  });

  const openDialog = (center: Center | null = null) => {
    if (center) {
      setCurrentCenter(center);
      setFormData({
        name: center.name,
        address: center.address || "",
      });
    } else {
      setCurrentCenter(null);
      setFormData(defaultCenterForm);
    }
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setCurrentCenter(null);
    setFormData(defaultCenterForm);
  };

  const openDeleteDialog = (center: Center) => {
    setCurrentCenter(center);
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setCurrentCenter(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCenter.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Centros Médicos</h1>
        
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Centro
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Centros</CardTitle>
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
                    <TableHead>Dirección</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centers?.map((center) => (
                    <TableRow key={center.id}>
                      <TableCell className="font-medium">{center.name}</TableCell>
                      <TableCell>{center.address || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDialog(center)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(center)}
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
            <DialogTitle>{currentCenter ? "Editar Centro" : "Crear Centro"}</DialogTitle>
            <DialogDescription>
              {currentCenter 
                ? "Modifica los datos del centro" 
                : "Rellena el formulario para crear un nuevo centro"}
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
                <Label htmlFor="address">Dirección (opcional)</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveCenter.isPending}>
                {saveCenter.isPending ? (
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
              ¿Estás seguro de que quieres eliminar el centro{" "}
              <strong>{currentCenter?.name}</strong>?
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
              onClick={() => deleteCenter.mutate()} 
              disabled={deleteCenter.isPending}
            >
              {deleteCenter.isPending ? (
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

export default Centers;
