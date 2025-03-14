
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
import { Activity } from "@/types";

interface ActivityFormData {
  name: string;
  description: string;
}

const defaultActivityForm: ActivityFormData = {
  name: "",
  description: "",
};

const Activities = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>(defaultActivityForm);

  // Fetch activities
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Activity[];
    }
  });

  // Create/update activity mutation
  const saveActivity = useMutation({
    mutationFn: async () => {
      if (currentActivity) {
        // Update existing activity
        const { data, error } = await supabase
          .from("activities")
          .update({
            name: formData.name,
            description: formData.description,
          })
          .eq("id", currentActivity.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        // Create new activity
        const { data, error } = await supabase
          .from("activities")
          .insert([{
            name: formData.name,
            description: formData.description,
          }])
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: currentActivity ? "Actividad actualizada" : "Actividad creada",
        description: currentActivity 
          ? "La actividad ha sido actualizada correctamente" 
          : "La actividad ha sido creada correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      closeDialog();
    },
    onError: (error) => {
      handleError(error);
    }
  });

  // Delete activity mutation
  const deleteActivity = useMutation({
    mutationFn: async () => {
      if (!currentActivity) return;
      
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", currentActivity.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Actividad eliminada",
        description: "La actividad ha sido eliminada correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      closeDeleteDialog();
    },
    onError: (error) => {
      handleError(error);
    }
  });

  const openDialog = (activity: Activity | null = null) => {
    if (activity) {
      setCurrentActivity(activity);
      setFormData({
        name: activity.name,
        description: activity.description || "",
      });
    } else {
      setCurrentActivity(null);
      setFormData(defaultActivityForm);
    }
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setCurrentActivity(null);
    setFormData(defaultActivityForm);
  };

  const openDeleteDialog = (activity: Activity) => {
    setCurrentActivity(activity);
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setCurrentActivity(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveActivity.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Actividades</h1>
        
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Actividad
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Actividades</CardTitle>
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
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities?.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.name}</TableCell>
                      <TableCell>{activity.description || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDialog(activity)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(activity)}
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
            <DialogTitle>{currentActivity ? "Editar Actividad" : "Crear Actividad"}</DialogTitle>
            <DialogDescription>
              {currentActivity 
                ? "Modifica los datos de la actividad" 
                : "Rellena el formulario para crear una nueva actividad"}
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
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveActivity.isPending}>
                {saveActivity.isPending ? (
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
              ¿Estás seguro de que quieres eliminar la actividad{" "}
              <strong>{currentActivity?.name}</strong>?
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
              onClick={() => deleteActivity.mutate()} 
              disabled={deleteActivity.isPending}
            >
              {deleteActivity.isPending ? (
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

export default Activities;
