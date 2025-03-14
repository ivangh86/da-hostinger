
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  Sidebar as SidebarComponent, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  LogOut, 
  User, 
  Building2, 
  Users, 
  Stethoscope, 
  ClipboardList, 
  Activity, 
  BookUser, 
  KeyRound,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const { isMobile, state, toggleSidebar } = useSidebar();

  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { 
      name: "Planning", 
      path: "/planning", 
      adminOnly: false, 
      icon: Calendar 
    },
    { 
      name: "Registro", 
      path: "/register", 
      adminOnly: true, 
      icon: ClipboardList 
    },
    { 
      name: "Usuarios", 
      path: "/users", 
      adminOnly: true, 
      icon: Users 
    },
    { 
      name: "Actividades", 
      path: "/activities", 
      adminOnly: true, 
      icon: Activity 
    },
    { 
      name: "Centros", 
      path: "/centers", 
      adminOnly: true, 
      icon: Building2 
    },
    { 
      name: "Especialidades", 
      path: "/specialties", 
      adminOnly: true, 
      icon: Stethoscope 
    },
    { 
      name: "Consultas", 
      path: "/consultations", 
      adminOnly: true, 
      icon: BookUser 
    },
    { 
      name: "Accesos", 
      path: "/access", 
      adminOnly: true, 
      icon: KeyRound 
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <SidebarComponent variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex flex-col p-4">
        <div className="flex items-center justify-between">
          <Link to="/" className={cn(
            "text-xl font-bold text-sidebar-primary flex items-center gap-2",
            isCollapsed ? "justify-center" : "flex-col items-start gap-0"
          )}>
            <Calendar className="h-7 w-7" />
            {!isCollapsed && (
              <>
                <span>Planning</span>
                <span>Médico</span>
              </>
            )}
          </Link>
          <Button 
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  asChild 
                  isActive={active}
                  tooltip={isCollapsed ? item.name : undefined}
                >
                  <Link to={item.path} className={cn(
                    "flex items-center gap-3 py-2.5",
                    active && "font-medium",
                    isCollapsed ? "justify-center" : "px-3"
                  )}>
                    <Icon className="h-6 w-6" />
                    {!isCollapsed && (
                      <>
                        <span className="text-base">{item.name}</span>
                        {active && <ChevronRight className="ml-auto h-5 w-5" />}
                      </>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4 space-y-4">
        {/* User information card with improved styling */}
        <div className={cn(
          "p-3 bg-sidebar-accent/40 rounded-md border border-sidebar-border shadow-sm flex items-center gap-3",
          isCollapsed ? "justify-center p-2" : "px-3"
        )}>
          <div className="bg-sidebar-primary/20 p-2 rounded-full">
            <User className="h-6 w-6 text-sidebar-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-medium text-sm text-sidebar-primary">{user?.full_name}</span>
              <span className="text-xs text-sidebar-foreground/90 font-medium">
                {user?.role === "admin" ? "Administrador" : "Lectura"}
              </span>
            </div>
          )}
        </div>
        
        {/* Logout button with improved styling */}
        <Button 
          variant="outline"
          className={cn(
            "w-full flex items-center gap-3 bg-red-500/10 text-red-100 hover:text-white border-red-400/30 hover:bg-red-600 transition-all py-5",
            isCollapsed ? "justify-center px-2" : "px-3"
          )}
          onClick={() => logout()}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="text-base">Cerrar sesión</span>}
        </Button>
      </SidebarFooter>
    </SidebarComponent>
  );
};

export default Sidebar;
