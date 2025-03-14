import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, handleError } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, addDays, parseISO, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { ViewMode, Specialty, User, PlanningRecord, UserAbsence } from "@/types";

const Planning = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [showAbsences, setShowAbsences] = useState<boolean>(true);

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

  // Fetch users
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*, specialty:specialties(*)")
        .eq("is_active", true)
        .order("full_name");
      
      if (error) throw error;
      return data as User[];
    }
  });

  // Calculate date range based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case "daily":
        return {
          start: selectedDate,
          end: selectedDate
        };
      case "weekly":
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 1 })
        };
      case "monthly":
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        return {
          start: new Date(year, month, 1),
          end: new Date(year, month + 1, 0)
        };
      case "yearly":
        const yearValue = selectedDate.getFullYear();
        return {
          start: new Date(yearValue, 0, 1),
          end: new Date(yearValue, 11, 31)
        };
    }
  };

  const dateRange = getDateRange();
  const startDate = format(dateRange.start, "yyyy-MM-dd");
  const endDate = format(dateRange.end, "yyyy-MM-dd");

  // Fetch planning records
  const { 
    data: planningRecords, 
    isLoading: loadingPlanning,
    refetch: refetchPlanning
  } = useQuery({
    queryKey: ["planningRecords", startDate, endDate, selectedSpecialty, selectedUser],
    queryFn: async () => {
      let query = supabase
        .from("planning_records")
        .select(`
          *,
          user:users(*, specialty:specialties(*)),
          specialty:specialties(*),
          activity:activities(*),
          consultation:consultations(*)
        `)
        .gte("record_date", startDate)
        .lte("record_date", endDate);
      
      if (selectedSpecialty) {
        query = query.eq("specialty_id", selectedSpecialty);
      }

      if (selectedUser) {
        query = query.eq("user_id", selectedUser);
      }

      const { data, error } = await query.order("record_date");
      
      if (error) throw error;
      return data as PlanningRecord[];
    }
  });

  // Fetch user absences
  const { data: absences, isLoading: loadingAbsences } = useQuery({
    queryKey: ["absences", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_absences")
        .select(`
          *,
          user:users(*)
        `)
        .or(`end_date.gte.${startDate},start_date.lte.${endDate}`);
      
      if (error) throw error;
      return data as UserAbsence[];
    },
    enabled: showAbsences
  });

  // Generate days for the date range
  const generateDays = () => {
    const days = [];
    let currentDate = new Date(dateRange.start);

    while (currentDate <= dateRange.end) {
      days.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }

    return days;
  };
  
  const days = generateDays();

  // Handle refresh
  const handleRefresh = () => {
    refetchPlanning();
    toast({
      title: "Actualizado",
      description: "Los datos de planning han sido actualizados",
    });
  };

  // Filter users by specialty
  const filteredUsers = users?.filter(user => 
    !selectedSpecialty || user.specialty_id === selectedSpecialty
  );

  // Check if user is absent for a specific date
  const isUserAbsent = (userId: string, date: Date) => {
    if (!showAbsences || !absences) return false;
    
    const dateStr = format(date, "yyyy-MM-dd");
    return absences.some(absence => 
      absence.user_id === userId && 
      isWithinInterval(parseISO(dateStr), {
        start: parseISO(absence.start_date),
        end: parseISO(absence.end_date)
      })
    );
  };

  // Group records by specialty and shift
  const groupedRecords = (date: Date, shift: 'morning' | 'afternoon') => {
    if (!planningRecords) return [];

    const dateStr = format(date, "yyyy-MM-dd");
    const records = planningRecords.filter(
      record => record.record_date === dateStr && record.shift === shift
    );

    // Group by specialty code
    const grouped = records.reduce((acc, record) => {
      const code = record.specialty?.code || "OTHER";
      if (!acc[code]) {
        acc[code] = [];
      }
      acc[code].push(record);
      return acc;
    }, {} as Record<string, PlanningRecord[]>);

    return Object.entries(grouped).map(([code, records]) => ({
      code,
      specialty: records[0].specialty,
      records
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
      
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <CardTitle>
            {format(dateRange.start, "dd MMM yyyy", { locale: es })} - {format(dateRange.end, "dd MMM yyyy", { locale: es })}
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Modo de vista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="grid gap-2">
              <Label htmlFor="specialty-filter">Especialidad</Label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger id="specialty-filter" className="w-full sm:w-56">
                  <SelectValue placeholder="Todas las especialidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas las especialidades</SelectItem>
                  {specialties?.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="user-filter">Usuario</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user-filter" className="w-full sm:w-56">
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos los usuarios</SelectItem>
                  {filteredUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-absences" 
                  checked={showAbsences} 
                  onCheckedChange={(checked) => setShowAbsences(checked as boolean)}
                />
                <Label htmlFor="show-absences">Mostrar ausencias</Label>
              </div>
            </div>
          </div>
          
          {loadingPlanning || loadingSpecialties || loadingUsers ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border px-4 py-2 bg-gray-100 w-24"></th>
                    {days.map(day => (
                      <th key={day.toString()} className="border px-4 py-2 bg-gray-100 min-w-32">
                        <div>{format(day, "EEEE", { locale: es })}</div>
                        <div>{format(day, "dd MMM", { locale: es })}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Morning Shift */}
                  <tr>
                    <td className="border px-4 py-2 font-bold bg-blue-50" colSpan={days.length + 1}>
                      Turno Mañana
                    </td>
                  </tr>
                  
                  {specialties?.map(specialty => {
                    if (selectedSpecialty && selectedSpecialty !== "_all" && specialty.id !== selectedSpecialty) return null;
                    
                    return (
                      <tr key={`morning-${specialty.id}`}>
                        <td className="border px-4 py-2 font-semibold bg-gray-50">
                          {specialty.code}
                        </td>
                        
                        {days.map(day => {
                          const specialtyRecords = groupedRecords(day, 'morning')
                            .find(g => g.code === specialty.code);
                            
                          return (
                            <td key={`morning-${specialty.id}-${day.toString()}`} className="border px-2 py-2 align-top">
                              {specialtyRecords?.records.map(record => {
                                const isAbsent = isUserAbsent(record.user_id, day);
                                
                                if (isAbsent && !showAbsences) return null;
                                
                                return (
                                  <div 
                                    key={record.id} 
                                    className={`mb-1 p-1 text-xs rounded ${
                                      isAbsent 
                                        ? 'bg-red-100 text-red-800 line-through' 
                                        : 'bg-blue-50'
                                    }`}
                                  >
                                    <div className="font-medium">{record.user?.full_name}</div>
                                    <div className="flex justify-between">
                                      <span>{record.activity?.name}</span>
                                      {record.consultation?.extension && (
                                        <span className="text-gray-500">{record.consultation.extension}</span>
                                      )}
                                    </div>
                                    {record.notes && <div className="text-gray-500 italic">{record.notes}</div>}
                                  </div>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  
                  {/* Afternoon Shift */}
                  <tr>
                    <td className="border px-4 py-2 font-bold bg-green-50" colSpan={days.length + 1}>
                      Turno Tarde
                    </td>
                  </tr>
                  
                  {specialties?.map(specialty => {
                    if (selectedSpecialty && selectedSpecialty !== "_all" && specialty.id !== selectedSpecialty) return null;
                    
                    return (
                      <tr key={`afternoon-${specialty.id}`}>
                        <td className="border px-4 py-2 font-semibold bg-gray-50">
                          {specialty.code}
                        </td>
                        
                        {days.map(day => {
                          const specialtyRecords = groupedRecords(day, 'afternoon')
                            .find(g => g.code === specialty.code);
                            
                          return (
                            <td key={`afternoon-${specialty.id}-${day.toString()}`} className="border px-2 py-2 align-top">
                              {specialtyRecords?.records.map(record => {
                                const isAbsent = isUserAbsent(record.user_id, day);
                                
                                if (isAbsent && !showAbsences) return null;
                                
                                return (
                                  <div 
                                    key={record.id} 
                                    className={`mb-1 p-1 text-xs rounded ${
                                      isAbsent 
                                        ? 'bg-red-100 text-red-800 line-through' 
                                        : 'bg-green-50'
                                    }`}
                                  >
                                    <div className="font-medium">{record.user?.full_name}</div>
                                    <div className="flex justify-between">
                                      <span>{record.activity?.name}</span>
                                      {record.consultation?.extension && (
                                        <span className="text-gray-500">{record.consultation.extension}</span>
                                      )}
                                    </div>
                                    {record.notes && <div className="text-gray-500 italic">{record.notes}</div>}
                                  </div>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Planning;
