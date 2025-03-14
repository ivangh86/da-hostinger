
-- Crear extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Centros
CREATE TABLE centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Especialidades
CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Actividades
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Relación entre Especialidades y Actividades
CREATE TABLE specialty_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialty_id UUID REFERENCES specialties(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(specialty_id, activity_id)
);

-- Tabla de Consultas
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_number VARCHAR(20) NOT NULL,
  extension VARCHAR(20),
  specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(consultation_number, center_id)
);

-- Roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'readonly');

-- Tabla de Usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
  role user_role NOT NULL DEFAULT 'readonly',
  is_active BOOLEAN DEFAULT true,
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  auth_id UUID UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tipos de turno
CREATE TYPE shift_type AS ENUM ('morning', 'afternoon');

-- Tabla de Registros de Planning
CREATE TABLE planning_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES specialties(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  record_date DATE NOT NULL,
  shift shift_type NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Ausencias de usuarios
CREATE TABLE user_absences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar Centro inicial
INSERT INTO centers (name) VALUES ('Centro A');

-- Insertar Especialidades iniciales
INSERT INTO specialties (name, code) VALUES 
('ENFERMERIA', 'INF'),
('ACUPUNTURA', 'ACU'),
('DERMATOLOGIA', 'DER'),
('DIGESTIVO', 'DIG'),
('FARMACIA', 'FAR'),
('FISIOTERAPIA', 'FTP'),
('GERIATRIA', 'GER'),
('GINECOLOGIA', 'GIN');

-- Insertar Actividades iniciales
INSERT INTO activities (name, description) VALUES 
('Consulta', 'Atención en consulta'),
('Domicilios', 'Visitas a domicilio'),
('Espiros', 'Espirometrías'),
('Gestora de casos', 'Gestión de casos'),
('Teletrabajo', 'Trabajo remoto'),
('Vitales', 'Medición de signos vitales');

-- Asociar actividades a especialidades
-- ENFERMERIA
INSERT INTO specialty_activities (specialty_id, activity_id)
SELECT 
  (SELECT id FROM specialties WHERE code = 'INF'),
  id
FROM activities;

-- Para otras especialidades, asociar al menos la actividad de Consulta
INSERT INTO specialty_activities (specialty_id, activity_id)
SELECT 
  s.id,
  (SELECT id FROM activities WHERE name = 'Consulta')
FROM specialties s
WHERE s.code != 'INF';

-- Configurar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialty_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_absences ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para administradores (acceso total)
CREATE POLICY admin_all_users ON users FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_all_planning ON planning_records FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_all_centers ON centers FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_all_specialties ON specialties FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_all_activities ON activities FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_all_consultations ON consultations FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_all_sp_activities ON specialty_activities FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_all_absences ON user_absences FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas de acceso para usuarios de solo lectura (solo SELECT)
CREATE POLICY readonly_select_users ON users FOR SELECT USING (true);
CREATE POLICY readonly_select_planning ON planning_records FOR SELECT USING (true);
CREATE POLICY readonly_select_centers ON centers FOR SELECT USING (true);
CREATE POLICY readonly_select_specialties ON specialties FOR SELECT USING (true);
CREATE POLICY readonly_select_activities ON activities FOR SELECT USING (true);
CREATE POLICY readonly_select_consultations ON consultations FOR SELECT USING (true);
CREATE POLICY readonly_select_sp_activities ON specialty_activities FOR SELECT USING (true);
CREATE POLICY readonly_select_absences ON user_absences FOR SELECT USING (true);

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_centers_updated_at BEFORE UPDATE ON centers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_specialties_updated_at BEFORE UPDATE ON specialties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_planning_updated_at BEFORE UPDATE ON planning_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Crear un usuario administrador inicial (después tendrán que cambiar la contraseña)
INSERT INTO auth.users (id, email, role, encrypted_password)
VALUES (
  uuid_generate_v4(),
  'admin@medical-center.com',
  'authenticated',
  crypt('adminpassword', gen_salt('bf'))
);

-- Insertar el usuario admin en nuestra tabla de usuarios
INSERT INTO users (
  full_name,
  email,
  role,
  auth_id
)
VALUES (
  'Administrador',
  'admin@medical-center.com',
  'admin',
  (SELECT id FROM auth.users WHERE email = 'admin@medical-center.com')
);
