import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ERROR_MESSAGES } from "@/config/constants";

interface Consultation {
  id: string;
  consultation_number: string;
  extension?: string;
  specialty: string;
  center: string;
  is_active: boolean;
}

const VisitCounters = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Cargar consultas
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        // Aquí iría la llamada a la API para obtener las consultas
        // Por ahora usamos datos de ejemplo
        const mockData: Consultation[] = [
          {
            id: "1",
            consultation_number: "1",
            specialty: "ENFERMERIA",
            center: "Centro 1",
            is_active: true
          },
          {
            id: "2",
            consultation_number: "2",
            specialty: "ENFERMERIA",
            center: "Centro 1",
            is_active: true
          },
          {
            id: "3",
            consultation_number: "3",
            specialty: "MEDICINA",
            center: "Centro 1",
            is_active: true
          },
          {
            id: "4",
            consultation_number: "4",
            specialty: "MEDICINA",
            center: "Centro 1",
            is_active: true
          }
        ];
        setConsultations(mockData);
      } catch (error) {
        console.error("Error al cargar consultas:", error);
        toast({
          title: "Error",
          description: ERROR_MESSAGES.VISIT_COUNTERS.LOAD_ERROR,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  // Función para cambiar el estado de una consulta
  const handleToggleConsultation = async (consultationId: string) => {
    try {
      // Aquí iría la llamada a la API para actualizar el estado
      setConsultations(prevConsultations =>
        prevConsultations.map(consultation =>
          consultation.id === consultationId
            ? { ...consultation, is_active: !consultation.is_active }
            : consultation
        )
      );

      toast({
        title: "Estado actualizado",
        description: ERROR_MESSAGES.VISIT_COUNTERS.UPDATE_SUCCESS,
      });
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      toast({
        title: "Error",
        description: ERROR_MESSAGES.VISIT_COUNTERS.UPDATE_ERROR,
        variant: "destructive",
      });
    }
  };

  // Función para activar/desactivar todas las consultas de una especialidad
  const handleToggleSpecialty = async (specialty: string, newState: boolean) => {
    try {
      // Aquí iría la llamada a la API para actualizar el estado
      setConsultations(prevConsultations =>
        prevConsultations.map(consultation =>
          consultation.specialty === specialty
            ? { ...consultation, is_active: newState }
            : consultation
        )
      );

      toast({
        title: "Estado actualizado",
        description: `Todas las consultas de ${specialty} han sido ${newState ? 'activadas' : 'desactivadas'}`,
      });
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      toast({
        title: "Error",
        description: ERROR_MESSAGES.VISIT_COUNTERS.UPDATE_ERROR,
        variant: "destructive",
      });
    }
  };

  // Agrupar consultas por especialidad
  const groupedConsultations = consultations.reduce((acc, consultation) => {
    if (!acc[consultation.specialty]) {
      acc[consultation.specialty] = [];
    }
    acc[consultation.specialty].push(consultation);
    return acc;
  }, {} as Record<string, Consultation[]>);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Contadores de Visitas</h1>
      
      {Object.entries(groupedConsultations).map(([specialty, specialtyConsultations]) => (
        <Card key={specialty}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{specialty}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleSpecialty(specialty, true)}
              >
                Activar Todas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleSpecialty(specialty, false)}
              >
                Desactivar Todas
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[100px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {specialtyConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">
                        Consulta {consultation.consultation_number}
                        {consultation.extension && ` - ${consultation.extension}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {consultation.center}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`consultation-${consultation.id}`}
                        checked={consultation.is_active}
                        onCheckedChange={() => handleToggleConsultation(consultation.id)}
                      />
                      <Label htmlFor={`consultation-${consultation.id}`}>
                        {consultation.is_active ? "ON" : "OFF"}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VisitCounters; 