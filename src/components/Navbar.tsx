
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Calendar, 
  LogOut, 
  User, 
  Menu, 
  Building2, 
  Users, 
  Stethoscope, 
  ClipboardList, 
  Activity, 
  BookUser, 
  KeyRound
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  // Add debugging to help diagnose issues
  console.log("Navbar - Auth state:", { user: !!user, isAdmin, path: location.pathname });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Modificamos los navItems para incluir iconos
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

  // If no user, don't render the navbar
  if (!user) {
    console.log("Navbar - No user, not rendering");
    return null;
  }

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 text-xl font-bold text-primary">
              Planning Médico
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              {navItems.map((item) => {
                if (item.adminOnly && !isAdmin) return null;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1.5",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 hover:bg-gray-200">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{user?.full_name}</span>
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {user?.role === "admin" ? "Administrador" : "Lectura"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navItems.map((item) => {
                  if (item.adminOnly && !isAdmin) return null;
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium truncate">{user?.full_name}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
