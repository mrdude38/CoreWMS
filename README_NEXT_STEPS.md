# 🎉 CoreWMS - Configuración Completada

Tu sistema de gestión de almacén (WMS) con V0 está listo para ejecutarse!

## ✅ Lo que ya se ha configurado

1. **Dependencias instaladas**:
   - Supabase para la base de datos
   - shadcn/ui para componentes UI
   - date-fns para manejo de fechas
   - lucide-react para iconos

2. **Archivos creados**:
   - ✅ [src/app/reports/page.tsx](src/app/reports/page.tsx) - Página de reportes de V0
   - ✅ [src/lib/supabase/client.ts](src/lib/supabase/client.ts) - Cliente de Supabase
   - ✅ [src/lib/types.ts](src/lib/types.ts) - Definiciones de tipos
   - ✅ [src/lib/utils.ts](src/lib/utils.ts) - Utilidades
   - ✅ [components.json](components.json) - Configuración de shadcn/ui
   - ✅ [tailwind.config.ts](tailwind.config.ts) - Configuración de Tailwind
   - ✅ [src/app/globals.css](src/app/globals.css) - Estilos globales con variables de shadcn/ui
   - ✅ [.env.local](.env.local) - Variables de entorno

## 🚀 Próximos Pasos

### 1. Configurar Supabase

Ve a tu proyecto en [Supabase](https://supabase.com) y:

1. Copia tu **Project URL**
2. Copia tu **anon/public key**
3. Edita el archivo [.env.local](.env.local) y reemplaza:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 2. Crear las Tablas en Supabase

En Supabase, ve a **SQL Editor** y ejecuta el siguiente script:

```sql
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

-- Insertar datos de ejemplo (opcional)
INSERT INTO clients (name, email, phone) VALUES
  ('Cliente Demo', 'demo@example.com', '555-0100'),
  ('Acme Corp', 'contact@acme.com', '555-0200');

INSERT INTO suppliers (name, contact) VALUES
  ('Proveedor ABC', 'abc@example.com'),
  ('Supplier XYZ', 'xyz@example.com');

INSERT INTO carriers (name, contact) VALUES
  ('FedEx', 'fedex@example.com'),
  ('UPS', 'ups@example.com');

INSERT INTO package_types (name, description) VALUES
  ('Pallet', 'Tarima estándar'),
  ('Box', 'Caja individual'),
  ('Container', 'Contenedor completo');
```

### 3. Ejecutar el Servidor

En tu terminal de VSCode (`Control + \``), ejecuta:

```bash
npm run dev
```

Luego abre tu navegador en:
- **Página principal**: http://localhost:3000
- **Página de reportes**: http://localhost:3000/reports

## 📊 Funcionalidades de la Página de Reportes

La página de reportes incluye 4 secciones:

1. **Inventory** - Inventario actual filtrado por cliente
2. **Entries Report** - Reporte detallado de entradas con filtros avanzados
3. **Exits Report** - Reporte de salidas con filtros por fecha y tipo
4. **Performance** - Métricas y analytics del almacén

Todas las secciones permiten:
- Filtrar por múltiples criterios
- Exportar a CSV
- Vista de datos en tiempo real

## 🎨 Estructura del Proyecto

```
corewms/
├── src/
│   ├── app/
│   │   ├── globals.css           # Estilos globales
│   │   ├── layout.tsx            # Layout principal
│   │   ├── page.tsx              # Página de inicio
│   │   └── reports/
│   │       └── page.tsx          # 🆕 Página de reportes (V0)
│   ├── components/
│   │   └── ui/                   # Componentes de shadcn/ui
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       └── tabs.tsx
│   └── lib/
│       ├── utils.ts              # Utilidades
│       ├── types.ts              # Tipos TypeScript
│       └── supabase/
│           └── client.ts         # Cliente de Supabase
├── .env.local                    # ⚠️ Configurar con tus credenciales
├── components.json               # Config de shadcn/ui
└── tailwind.config.ts            # Config de Tailwind

## 🔧 Troubleshooting

### Error: "process.env is not defined"
- Asegúrate de que tu archivo `.env.local` tenga las variables correctas
- Reinicia el servidor de desarrollo

### Error de conexión a Supabase
- Verifica que las credenciales en `.env.local` sean correctas
- Asegúrate de que las tablas estén creadas en Supabase
- Revisa las políticas de seguridad (RLS) en Supabase

### Componentes no se ven bien
- Verifica que `tailwindcss-animate` esté instalado
- Asegúrate de que el archivo `globals.css` tenga las variables de color

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de shadcn/ui](https://ui.shadcn.com)
- [V0 by Vercel](https://v0.dev)

## ✨ ¿Qué sigue?

Ahora puedes:
1. Personalizar los estilos y colores
2. Agregar más páginas del sistema
3. Implementar autenticación
4. Agregar más funcionalidades del WMS

¡Disfruta tu aplicación! 🚀
