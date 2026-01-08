-- ========================================
-- CoreWMS Database Schema
-- Execute this script in Supabase SQL Editor
-- ========================================

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de transportistas
CREATE TABLE IF NOT EXISTS carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de tipos de paquete
CREATE TABLE IF NOT EXISTS package_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de entradas
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  supplier_id UUID REFERENCES suppliers(id),
  carrier_id UUID REFERENCES carriers(id),
  package_type_id UUID REFERENCES package_types(id),
  entry_date DATE NOT NULL,
  total_packages INTEGER NOT NULL,
  total_weight DECIMAL,
  status TEXT CHECK (status IN ('pendiente', 'recibido', 'salida')) DEFAULT 'pendiente',
  is_damaged BOOLEAN DEFAULT false,
  damage_description TEXT,
  received_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de órdenes de carga
CREATE TABLE IF NOT EXISTS load_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  entry_id UUID REFERENCES entries(id),
  carrier_id UUID REFERENCES carriers(id),
  total_packages INTEGER NOT NULL,
  pedimento_invoice_number TEXT,
  status TEXT CHECK (status IN ('pendiente', 'salida')) DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_entries_client_id ON entries(client_id);
CREATE INDEX IF NOT EXISTS idx_entries_entry_date ON entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_load_orders_client_id ON load_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_load_orders_created_at ON load_orders(created_at);

-- ========================================
-- Datos de ejemplo (opcional)
-- ========================================

-- Insertar clientes de ejemplo
INSERT INTO clients (name, email, phone) VALUES
  ('Cliente Demo', 'demo@example.com', '555-0100'),
  ('Acme Corporation', 'contact@acme.com', '555-0200'),
  ('TechCorp Industries', 'info@techcorp.com', '555-0300')
ON CONFLICT DO NOTHING;

-- Insertar proveedores de ejemplo
INSERT INTO suppliers (name, contact) VALUES
  ('Proveedor ABC', 'abc@supplier.com'),
  ('Supplier XYZ Inc', 'contact@xyz.com'),
  ('Global Imports Ltd', 'info@globalimports.com')
ON CONFLICT DO NOTHING;

-- Insertar transportistas de ejemplo
INSERT INTO carriers (name, contact) VALUES
  ('FedEx', 'fedex@shipping.com'),
  ('UPS', 'ups@shipping.com'),
  ('DHL Express', 'dhl@shipping.com'),
  ('Transporte Local', 'local@transport.com')
ON CONFLICT DO NOTHING;

-- Insertar tipos de paquete de ejemplo
INSERT INTO package_types (name, description) VALUES
  ('Pallet', 'Tarima estándar (48x40)'),
  ('Box', 'Caja individual'),
  ('Container', 'Contenedor completo 20ft'),
  ('Container 40ft', 'Contenedor completo 40ft'),
  ('Half Pallet', 'Media tarima')
ON CONFLICT DO NOTHING;

-- Insertar usuarios de ejemplo
INSERT INTO users (name, email) VALUES
  ('Juan Pérez', 'juan@corewms.com'),
  ('María García', 'maria@corewms.com'),
  ('Carlos López', 'carlos@corewms.com')
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- Habilitar Row Level Security (RLS)
-- IMPORTANTE: Descomenta esto si necesitas seguridad a nivel de fila
-- ========================================

-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE package_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE load_orders ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública (ejemplo)
-- CREATE POLICY "Allow public read access" ON clients FOR SELECT USING (true);
-- (Repite para cada tabla según tus necesidades)

-- ========================================
-- Script completado
-- ========================================

SELECT 'Schema created successfully!' as status;
