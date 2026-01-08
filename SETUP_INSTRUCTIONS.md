# Instrucciones de Configuración - CoreWMS

## Paso 1: Instalar Dependencias

Abre la terminal en VSCode (`Control + \``) y ejecuta los siguientes comandos:

\`\`\`bash
# Instalar dependencias principales
npm install @supabase/supabase-js @supabase/ssr date-fns lucide-react class-variance-authority clsx tailwind-merge

# Instalar shadcn/ui CLI globalmente (opcional pero recomendado)
npm install -D tailwindcss-animate

# Instalar componentes de shadcn/ui
npx shadcn@latest add card button input label select table tabs
\`\`\`

## Paso 2: Configurar Supabase

1. Ve a [Supabase](https://supabase.com) y crea un proyecto (o usa uno existente)
2. En el dashboard de tu proyecto, ve a Settings → API
3. Copia tu `Project URL` y tu `anon/public key`
4. Abre el archivo `.env.local` en la raíz del proyecto
5. Reemplaza los valores:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
   \`\`\`

## Paso 3: Crear la Base de Datos

En Supabase, ve a SQL Editor y ejecuta este script para crear las tablas necesarias:

\`\`\`sql
-- Crear tabla de clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de proveedores
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de transportistas
CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de tipos de paquete
CREATE TABLE package_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de entradas
CREATE TABLE entries (
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
CREATE TABLE load_orders (
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
CREATE INDEX idx_entries_client_id ON entries(client_id);
CREATE INDEX idx_entries_entry_date ON entries(entry_date);
CREATE INDEX idx_entries_status ON entries(status);
CREATE INDEX idx_load_orders_client_id ON load_orders(client_id);
CREATE INDEX idx_load_orders_created_at ON load_orders(created_at);
\`\`\`

## Paso 4: Ejecutar el Servidor de Desarrollo

\`\`\`bash
npm run dev
\`\`\`

Abre [http://localhost:3000/reports](http://localhost:3000/reports) para ver la página de reportes.

## Estructura de Archivos Creados

\`\`\`
corewms/
├── .env.local                    # Variables de entorno (configurar Supabase aquí)
├── components.json               # Configuración de shadcn/ui
├── tailwind.config.ts            # Configuración de Tailwind CSS
├── src/
│   ├── lib/
│   │   ├── utils.ts             # Utilidades (función cn para clases)
│   │   ├── types.ts             # Definiciones de tipos TypeScript
│   │   └── supabase/
│   │       └── client.ts        # Cliente de Supabase
│   ├── components/ui/           # Componentes de shadcn/ui (se crearán al instalar)
│   └── app/
│       ├── globals.css          # Estilos globales con variables de shadcn/ui
│       └── reports/
│           └── page.tsx         # Página de reportes (pendiente)
\`\`\`

## Siguientes Pasos

1. Instalar las dependencias
2. Configurar las variables de entorno de Supabase
3. Crear las tablas en Supabase
4. Instalar los componentes de shadcn/ui
5. Crear la página de reportes

¿Listo para continuar?
