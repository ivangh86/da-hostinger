import { RouteObject } from 'react-router-dom';
import { ReactNode } from 'react';

export type UserRole = 'admin' | 'readonly';
export type ShiftType = 'morning' | 'afternoon';
export type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Center {
  id: string;
  name: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Specialty {
  id: string;
  name: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SpecialtyActivity {
  id: string;
  specialty_id: string;
  activity_id: string;
  created_at?: string;
}

export interface Consultation {
  id: string;
  consultation_number: string;
  extension?: string;
  specialty_id: string;
  center_id: string;
  is_active: boolean;
  specialties?: Specialty;
  centers?: Center;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  auth_id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'readonly';
  created_at: string;
  updated_at: string;
  // Relaciones
  specialty?: Specialty;
  consultation?: Consultation;
}

export interface PlanningRecord {
  id: string;
  user_id: string;
  specialty_id: string;
  activity_id: string;
  center_id: string;
  consultation_id?: string;
  record_date: string;
  shift: ShiftType;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Relaciones
  user?: User;
  specialty?: Specialty;
  activity?: Activity;
  center?: Center;
  consultation?: Consultation;
}

export interface UserAbsence {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at?: string;
  updated_at?: string;
  // Relaciones
  user?: User;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: number;
}

export interface AppRouteObject {
  path?: string;
  element?: ReactNode;
  children?: AppRouteObject[];
  index?: boolean;
  caseSensitive?: boolean;
}
