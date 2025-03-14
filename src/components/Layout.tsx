import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const getBreadcrumbName = (path: string) => {
  const names: Record<string, string> = {
    planning: "Planificación",
    register: "Registro",
    users: "Usuarios",
    activities: "Actividades",
    centers: "Centros",
    specialties: "Especialidades",
    consultations: "Consultas",
    access: "Acceso"
  };
  return names[path] || path;
};

const Breadcrumbs = () => {
  const location = useLocation();
  const paths = location.pathname.split("/").filter(Boolean);
  
  if (paths.length === 0) return null;
  
  return (
    <div className="mb-4 flex items-center text-sm text-gray-500">
      {paths.map((path, index) => (
        <div key={path} className="flex items-center">
          {index > 0 && <span className="mx-2">/</span>}
          <span className={index === paths.length - 1 ? "font-medium text-gray-900" : ""}>
            {getBreadcrumbName(path)}
          </span>
        </div>
      ))}
    </div>
  );
};

const Layout = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 py-6 px-4 sm:px-6">
            <Breadcrumbs />
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[calc(100vh-12rem)]">
              <Outlet />
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
