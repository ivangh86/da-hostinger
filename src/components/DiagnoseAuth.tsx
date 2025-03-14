
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { diagnosisAuthIssues } from "@/lib/authUtils";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export const DiagnoseAuth = () => {
  const [isChecking, setIsChecking] = useState(false);
  
  const handleDiagnose = async () => {
    setIsChecking(true);
    try {
      const result = await diagnosisAuthIssues();
      console.log("Diagnóstico de autenticación:", result);
      
      if (result.success) {
        toast({
          title: "Diagnóstico completado",
          description: "La autenticación está funcionando correctamente",
        });
      }
    } catch (error) {
      console.error("Error al diagnosticar:", error);
      toast({
        title: "Error",
        description: "No se pudo completar el diagnóstico",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      onClick={handleDiagnose}
      disabled={isChecking}
    >
      {isChecking ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Verificando...
        </>
      ) : (
        "Diagnosticar Autenticación"
      )}
    </Button>
  );
};

export default DiagnoseAuth;
