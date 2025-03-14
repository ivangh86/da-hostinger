import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, handleError } from "@/lib/supabase";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Center, Specialty, Activity, User, Consultation } from "@/types";
import { cn } from "@/lib/utils";

const Register = () => {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [centerId, setCenterId] = useState<string>("");
  const [specialtyId, setSpecialtyId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [activityId, setActivityId] = useState<string>("");
  const [consultationId, setConsultationId] = useState<string>("");
  const [shift, setShift] = useState<"morning" | "afternoon">("morning");
  const [notes, setNotes] = useState<string>("");

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

  // Set default center when data is loaded
  useState(() => {
    if (centers && centers.length > 0 && !centerId) {
      setCenterId(centers[0].id);
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

  // Fetch users filtered by specialty
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users", specialtyId],
    queryFn: async () => {
      let query = supabase
        .from("users")
        .select("*")
        .eq("is_active", true);
      
      if (specialtyId) {
        query = query.eq("specialty_id", specialtyId);
      }
      
      const { data, error } = await query.order("full_name");
      
      if (error) throw error;
      return data as User[];
    },
    enabled: !!specialtyId
  });

  // Fetch activities for selected specialty
  const { data: activities, isLoading: loadingActivities } = useQuery({
    queryKey: ["activities", specialtyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialty_activities")
        .select(`
          activity_id,
          activities(*)
        `)
        .eq("specialty_id", specialtyId);
      
      if (error) throw error;
      
      // Extract the activities from the nested data
      return data.map(item => item.activities) as unknown as Activity[];
    },
    enabled: !!specialtyId
  });

  // Fetch consultations for selected specialty and center
  const { data: consultations, isLoading: loadingConsultations } = useQuery({
    queryKey: ["consultations", specialtyId, centerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("specialty_id", specialtyId)
        .eq("center_id", centerId)
        .order("consultation_number");
      
      if (error) throw error;
      return data as Consultation[];
    },
    enabled: !!specialtyId && !!centerId
  });

  // Create planning record mutation
  const createRecord = useMutation({
    mutationFn: async () => {
      if (!dateRange?.from || !dateRange?.to) {
        throw new Error("Por favor, selecciona un rango de fechas completo (fecha inicio y fin)");
      }

      const dates = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to
      });

      if (dates.length === 0) {
        throw new Error("El rango de fechas seleccionado no es válido");
      }

      const records = dates.map(date => ({
        user_id: userId,
        specialty_id: specialtyId,
        activity_id: activityId,
        center_id: centerId,
        consultation_id: consultationId || null,
        record_date: format(date, "yyyy-MM-dd"),
        shift,
        notes
      }));

      const { data, error } = await supabase
        .from("planning_records")
        .insert(records)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Reset form except for date range and shift
      setSpecialtyId("");
      setUserId("");
      setActivityId("");
      setConsultationId("");
      setNotes("");
      
      // Refresh planning data
      queryClient.invalidateQueries({ queryKey: ["planningRecords"] });
      
      toast({
        title: "Registros creados",
        description: "Los registros han sido creados correctamente para el rango de fechas seleccionado",
      });
    },
    onError: (error) => {
      handleError(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRecord.mutate();
  };

  const isLoading = loadingCenters || loadingSpecialties || loadingUsers || loadingActivities || loadingConsultations || createRecord.isPending;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Registro de Planning</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Crear nuevo registro</CardTitle>
          <CardDescription>
            Añade nuevos registros al planning para asignar actividades a los usuarios. Puedes seleccionar un rango de fechas para crear múltiples registros a la vez.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Rango de fechas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "PPP", { locale: es })} -{" "}
                            {format(dateRange.to, "PPP", { locale: es })}
                          </>
                        ) : (
                          format(dateRange.from, "PPP", { locale: es })
                        )
                      ) : (
                        <span>Selecciona un rango de fechas</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shift">Turno</Label>
                <RadioGroup 
                  id="shift" 
                  value={shift} 
                  onValueChange={(value) => setShift(value as "morning" | "afternoon")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="morning" id="morning" />
                    <Label htmlFor="morning">Mañana</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="afternoon" id="afternoon" />
                    <Label htmlFor="afternoon">Tarde</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="center">Centro</Label>
              <Select value={centerId} onValueChange={setCenterId} disabled={loadingCenters}>
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
            
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad</Label>
              <Select value={specialtyId} onValueChange={setSpecialtyId} disabled={loadingSpecialties}>
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
            
            <div className="space-y-2">
              <Label htmlFor="user">Usuario</Label>
              <Select 
                value={userId} 
                onValueChange={setUserId} 
                disabled={loadingUsers || !specialtyId}
              >
                <SelectTrigger id="user">
                  <SelectValue placeholder={
                    !specialtyId 
                      ? "Primero selecciona una especialidad" 
                      : "Selecciona un usuario"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="activity">Actividad</Label>
              <Select 
                value={activityId} 
                onValueChange={setActivityId} 
                disabled={loadingActivities || !specialtyId}
              >
                <SelectTrigger id="activity">
                  <SelectValue placeholder={
                    !specialtyId 
                      ? "Primero selecciona una especialidad" 
                      : "Selecciona una actividad"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {activities?.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="consultation">Consulta (opcional)</Label>
              <Select 
                value={consultationId} 
                onValueChange={setConsultationId} 
                disabled={loadingConsultations || !specialtyId}
              >
                <SelectTrigger id="consultation">
                  <SelectValue placeholder="Selecciona una consulta (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguna">Ninguna consulta</SelectItem>
                  {consultations?.map((consultation) => (
                    <SelectItem key={consultation.id} value={consultation.id}>
                      {consultation.consultation_number} 
                      {consultation.extension && ` (Ext: ${consultation.extension})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Añade notas adicionales..." 
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isLoading || !specialtyId || !userId || !activityId} 
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar registro"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
