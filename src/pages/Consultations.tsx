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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Consultation, Specialty, Center } from "@/types";
import VisitCounters from "./VisitCounters";

interface ConsultationFormData {
  consultation_number: string;
  extension: string;
  specialty_id: string;
  center_id: string;
}

const defaultConsultationForm: ConsultationFormData = {
  consultation_number: "",
  extension: "",
  specialty_id: "",
  center_id: "",
};

const Consultations = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [formData, setFormData] = useState<ConsultationFormData>(defaultConsultationForm);

  // Fetch consultations
  const { data: consultations, isLoading } = useQuery({
    queryKey: ["consultations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select(`
          *,
          specialties(*),
          centers(*)
        `)
        .order("consultation_number");
      
      if (error) throw error;
      return data as Consultation[];
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

  // Fetch centers
  const { data: centers, isLoading: loadingCenters } = useQuery({
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

  // Create/update consultation mutation
  const saveConsultation = useMutation({
    mutationFn: async () => {
      if (currentConsultation) {
        // Update existing consultation
        const { data, error } = await supabase
          .from("consultations")
          .update({
            consultation_number: formData.consultation_number,
            extension: formData.extension || null,
            specialty_id: formData.specialty_id,
            center_id: formData.center_id,
          })
          .eq("id", currentConsultation.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        // Create new consultation
        const { data, error } = await supabase
          .from("consultations")
          .insert([{
            consultation_number: formData.consultation_number,
            extension: formData.extension || null,
            specialty_id: formData.specialty_id,
            center_id: formData.center_id,
          }])
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: currentConsultation ? "Consulta actualizada" : "Consulta creada",
        description: currentConsultation 
          ? "La consulta ha sido actualizada correctamente" 
          : "La consulta ha sido creada correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      closeDialog();
    },
    onError: (error) => {
      handleError(error);
    }
  });

  // Delete consultation mutation
  const deleteConsultation = useMutation({
    mutationFn: async () => {
      if (!currentConsultation) return;
      
      const { error } = await supabase
        .from("consultations")
        .delete()
        .eq("id", currentConsultation.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Consulta eliminada",
        description: "La consulta ha sido eliminada correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      closeDeleteDialog();
    },
    onError: (error) => {
      handleError(error);
    }
  });

  const openDialog = (consultation: Consultation | null = null) => {
    if (consultation) {
      setCurrentConsultation(consultation);
      setFormData({
        consultation_number: consultation.consultation_number,
        extension: consultation.extension || "",
        specialty_id: consultation.specialty_id || "",
        center_id: consultation.center_id,
      });
    } else {
      setCurrentConsultation(null);
      setFormData(defaultConsultationForm);
    }
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setCurrentConsultation(null);
    setFormData(defaultConsultationForm);
  };

  const openDeleteDialog = (consultation: Consultation) => {
    setCurrentConsultation(consultation);
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setCurrentConsultation(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConsultation.mutate();
  };

  const isLoadingData = isLoading || loadingSpecialties || loadingCenters;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Consultas</h1>
        
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Consulta
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Consultas</CardTitle>
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
                    <TableHead>Consulta Número</TableHead>
                    <TableHead>Extensión</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Centro</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultations?.map((consultation) => (
                    <TableRow key={consultation.id}>
                      <TableCell>{consultation.consultation_number}</TableCell>
                      <TableCell>{consultation.extension || "-"}</TableCell>
                      <TableCell>{consultation.specialties?.name}</TableCell>
                      <TableCell>{consultation.centers?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog(consultation)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(consultation)}
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

      {/* Contadores de Visitas */}
      <VisitCounters />
      
      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentConsultation ? "Editar Consulta" : "Crear Consulta"}</DialogTitle>
            <DialogDescription>
              {currentConsultation 
                ? "Modifica los datos de la consulta" 
                : "Rellena el formulario para crear una nueva consulta"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="consultation_number">Número de Consulta</Label>
                <Input
                  id="consultation_number"
                  value={formData.consultation_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, consultation_number: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="extension">Extensión (opcional)</Label>
                <Input
                  id="extension"
                  value={formData.extension}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, extension: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="specialty">Especialidad</Label>
                <Select 
                  value={formData.specialty_id} 
                  onValueChange={(value: string) => setFormData({ ...formData, specialty_id: value })}
                  disabled={loadingSpecialties}
                >
                  <SelectTrigger id="specialty">
                    <SelectValue placeholder="Selecciona una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties?.map((specialty) => (
                      <SelectItem key={specialty.id} value={specialty.id}>
                        {specialty.name} ({specialty.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="center">Centro</Label>
                <Select 
                  value={formData.center_id} 
                  onValueChange={(value: string) => setFormData({ ...formData, center_id: value })}
                  disabled={loadingCenters}
                >
                  <SelectTrigger id="center">
                    <SelectValue placeholder="Selecciona un centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers?.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={saveConsultation.isPending || !formData.center_id || !formData.consultation_number}
              >
                {saveConsultation.isPending ? (
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
              ¿Estás seguro de que quieres eliminar la consulta{" "}
              <strong>{currentConsultation?.consultation_number}</strong>?
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
              onClick={() => deleteConsultation.mutate()} 
              disabled={deleteConsultation.isPending}
            >
              {deleteConsultation.isPending ? (
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

export default Consultations;
