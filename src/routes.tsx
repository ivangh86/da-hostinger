import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Lazy loading de componentes
const Login = lazy(() => import('./pages/Login'));
const Planning = lazy(() => import('./pages/Planning'));
const Register = lazy(() => import('./pages/Register'));
const Users = lazy(() => import('./pages/Users'));
const Activities = lazy(() => import('./pages/Activities'));
const Centers = lazy(() => import('./pages/Centers'));
const Specialties = lazy(() => import('./pages/Specialties'));
const Consultations = lazy(() => import('./pages/Consultations'));
const Access = lazy(() => import('./pages/Access'));
const NotFound = lazy(() => import('./pages/NotFound'));

export const routes = [
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        path: 'planning',
        element: <Planning />
      },
      {
        element: <AdminRoute />,
        children: [
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
        ]
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]; 