import { lazy, ReactNode } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Lazy loading de componentes con prefetch
const Login = lazy(() => import('./pages/Login'));
const Planning = lazy(() => import('./pages/Planning'));
const Register = lazy(() => import('./pages/Register'));
const Users = lazy(() => import('./pages/Users'));
const Activities = lazy(() => import('./pages/Activities'));
const Centers = lazy(() => import('./pages/Centers'));
const Specialties = lazy(() => import('./pages/Specialties'));
const Consultations = lazy(() => import('./pages/Consultations'));
const Access = lazy(() => import('./pages/Access'));
const VisitCounters = lazy(() => import('./pages/VisitCounters'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Rutas públicas
const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: <Login />
  }
];

// Rutas protegidas
const protectedRoutes: RouteObject[] = [
  {
    path: 'planning',
    element: <Planning />
  }
];

// Rutas de administración
const adminRoutes: RouteObject[] = [
  {
    path: 'register',
    element: <Register />
  },
  {
    path: 'users',
    element: <Users />
  },
  {
    path: 'activities',
    element: <Activities />
  },
  {
    path: 'centers',
    element: <Centers />
  },
  {
    path: 'specialties',
    element: <Specialties />
  },
  {
    path: 'consultations',
    element: <Consultations />
  },
  {
    path: 'access',
    element: <Access />
  }
];

export const routes: RouteObject[] = [
  ...publicRoutes,
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      ...protectedRoutes,
      {
        element: <AdminRoute />,
        children: adminRoutes
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]; 