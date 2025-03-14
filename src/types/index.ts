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
  specialty_id?: string;
  center_id: string;
  created_at?: string;
  updated_at?: string;
  specialties?: Specialty;
  centers?: Center;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  specialty_id?: string;
  role: UserRole;
  is_active: boolean;
  consultation_id?: string;
  auth_id?: string;
  created_at?: string;
  updated_at?: string;
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
