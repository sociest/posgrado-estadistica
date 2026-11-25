# Portal Académico de Posgrado — Carrera de Estadística UMSA

Sistema integral web para la gestión, difusión y administración de programas de posgrado (Maestrías y Diplomados), convocatorias, defensas de grado, planta docente, personal administrativo y usuarios de la Carrera de Estadística e Instituto de Estadística Teórica y Aplicada (IETA) de la Universidad Mayor de San Andrés (UMSA).

---

## 🏗️ Arquitectura del Sistema

- **Backend:** Laravel 13 + Laravel Sanctum + PHP 8.3+ en contenedor Docker.
- **Base de Datos:** PostgreSQL 16.x con persistencia en volumen Docker.
- **Frontend:** React 19 + Vite 6 + Lucide Icons + cliente `apiJson` unificado.
- **Servidor Web Frontend:** Nginx Alpine para servir la SPA y resolver rutas mediante HTML5 History mode.
- **Orquestación:** Docker Compose (`compose.yaml` + `compose.local.yaml`).

---

## 🚀 Cómo Levantar los Contenedores (Paso a Paso)

### Requisitos Previos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución (en Windows, macOS o Linux).
- Git instalado.

---

### Paso 1. Clonar el Repositorio y Ubicarse en la Rama Principal
```bash
git clone --branch main https://github.com/RebecaQO/posgradoest.git
cd posgradoest
```

---

### Paso 2. Configurar el Archivo de Entorno (`.env`)
Copia la plantilla de variables de entorno en la raíz del proyecto:

**En Linux / macOS / WSL2:**
```bash
cp .env.example .env
```

**En Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

> **Importante:** la plantilla no incluye claves ni contraseñas. Antes de iniciar Compose, genera y configura `APP_KEY` y una contraseña segura para la base de datos. Genera una clave Laravel con:
> ```bash
> docker run --rm serversideup/php:8.5-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
> ```
> Copia el valor en `APP_KEY` dentro de `.env` y define `DB_PASSWORD` con una contraseña única. No subas `.env` al repositorio.

Variables necesarias para el despliegue:

| Variable | Uso |
| --- | --- |
| `APP_KEY` | Clave Laravel generada para el entorno |
| `APP_URL` | URL pública de la API |
| `FRONTEND_URL` | URL pública del sitio |
| `VITE_API_URL` | Origen de API incluido en el bundle del frontend |
| `SANCTUM_STATEFUL_DOMAINS` | Host del frontend sin esquema ni ruta |
| `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Credenciales PostgreSQL; contraseña obligatoria y única |
| `TZ` | Zona horaria; usar `America/La_Paz` |

Las URL de la plantilla apuntan a `localhost` para desarrollo. En Dokploy, reemplázalas por los dominios HTTPS públicos antes de construir el frontend.

---

### Paso 3. Levantar los Contenedores con Docker Compose
Ejecuta el siguiente comando en la raíz del proyecto:

```bash
docker compose -f compose.yaml -f compose.local.yaml up -d --build
```

**¿Por qué dos archivos?**
- `compose.yaml`: Define los servicios `app`, `frontend`, `db`, redes y volúmenes para Dokploy. No publica puertos al host.
- `compose.local.yaml`: Solo para desarrollo; publica los puertos en loopback (`127.0.0.1:3000` y `127.0.0.1:8080`) y guarda los archivos en `./files/storage`.

---

### Paso 4. Verificar el Estado de los Contenedores
```bash
docker compose -f compose.yaml -f compose.local.yaml ps
```
Deberás ver los 3 servicios activos:
- `portal-postgrado-api` (`app`) — Estado: `Up` (healthy) en el puerto `8080`
- `portal-postgrado-frontend` (`frontend`) — Estado: `Up` en el puerto `3000`
- `postgres:16-alpine` (`db`) — Estado: `Up` (healthy) en el puerto `5432` (red interna)

---

### Paso 5. Direcciones de Acceso
| Servicio | URL Local | Descripción |
|---|---|---|
| **Frontend (Portal Web)** | [http://localhost:3000](http://localhost:3000) | Portal público, catálogo y panel administrativo |
| **Backend (API REST)** | [http://localhost:8080/api](http://localhost:8080/api) | Endpoints JSON de la API |
| **Salud del Backend** | [http://localhost:8080/up](http://localhost:8080/up) | Health check del framework Laravel |

---

## 🛠️ Comandos de Mantenimiento Frecuentes

### Ejecutar Migraciones o Seeders en la Base de Datos
Las migraciones se ejecutan automáticamente al iniciar el contenedor `app`. Si deseas forzarlas manualmente:
```bash
docker compose -f compose.yaml -f compose.local.yaml exec app php artisan migrate --force
```

Para sembrar datos iniciales:
```bash
docker compose -f compose.yaml -f compose.local.yaml exec app php artisan db:seed --force
```
El seeder de producción no crea usuarios de demostración ni credenciales predeterminadas. Los catálogos administrables se crean desde el panel; la migración de institución inicializa los datos institucionales necesarios.

### Ver Rutas de la API Backend
```bash
docker compose -f compose.yaml -f compose.local.yaml exec app php artisan route:list --path=api
```

### Ver Logs en Tiempo Real
```bash
# Ver todos los logs
docker compose -f compose.yaml -f compose.local.yaml logs -f

# Ver solo logs del backend
docker compose -f compose.yaml -f compose.local.yaml logs -f app

# Ver solo logs del frontend
docker compose -f compose.yaml -f compose.local.yaml logs -f frontend
```

### Recompilar el Frontend Tras Modificaciones
Si realizas cambios en el código de `frontend/src`:
```bash
# Opción A (Local con Node instalado):
cd frontend
npm run build
docker cp dist/. postgrado_estadistica-avance-gary-frontend-1:/usr/share/nginx/html/

# Opción B (Reconstrucción completa de imagen Docker):
docker compose -f compose.yaml -f compose.local.yaml up -d --build frontend
```

### Detener los Contenedores
Para pausar los contenedores preservando la base de datos y archivos:
```bash
docker compose -f compose.yaml -f compose.local.yaml down
```

Para detener y reiniciar desde cero limpiando volúmenes:
```bash
docker compose -f compose.yaml -f compose.local.yaml down -v
```

---

## 📌 Módulos del Sistema

### 1. Portal Administrativo (`/admin` / Modal Login)
- **Gestión de Programas de Posgrado:** Creación y edición integral de **Maestrías** (malla modular, materias, créditos, carga horaria) y **Diplomados** (módulos directos).
- **Activación / Desactivación:** Control en tiempo real del estado público de los programas (`PATCH /api/programas/{id}/desactivar` y `reactivar`).
- **Gestión de Ediciones:** Fechas de inicio, duración, modalidad, aranceles, enlaces a convocatorias y formularios de preinscripción.
- **Defensas de Tesis y Grado:** Registro, programación de fechas, tribunales evaluadores y estados académicos.
- **Planta Docente y Personal Administrativo:** Mantenimiento de perfiles profesionales, especialidades, grado académico y datos de contacto.
- **Noticias y Publicaciones:** Módulo de comunicados y noticias del posgrado.
- **Usuarios y Roles:** Control de credenciales de acceso administrativo y privilegios del sistema.

### 2. Portal Público y Catálogo
- `/#programa/:id` — Ficha oficial del programa académico (malla curricular, materias, perfil del postulante, egreso, requisitos y horarios).
- `/#programas` — Catálogo general con filtros en vivo por tipo de programa (Maestría / Diplomado), área y modalidad.
- `/#institucion` — Identidad institucional, principios de misión/visión oficial, directorio de personal y línea de tiempo histórica.
- `/#convocatorias` — Convocatorias y afiches oficiales descargables.
- `/#contacto` — Sedes institucionales (Campus Cota Cota y Edificio Monoblock), canales de contacto presencial y WhatsApp.
- `/#inicio` — Página principal con banners destacados, estadísticas, indicadores clave y sección de **Preguntas Frecuentes**.

---

## 🌿 Flujo de Trabajo en Git

Para proponer cambios, trabaja en una rama separada y abre un pull request hacia `main` del repositorio personal. La publicación oficial no se realiza desde este repositorio personal.

```bash
# 1. Crear una rama de trabajo desde main
git checkout main
git pull origin main
git checkout -b feature/nombre-del-cambio

# 2. Revisar el estado de archivos modificados
git status

# 3. Agregar cambios para commit
git add .

# 4. Crear el commit descriptivo
git commit -m "feat/fix: descripcion clara de los cambios realizados"

# 5. Publicar la rama para revisión
git push -u origin feature/nombre-del-cambio
```

## Despliegue oficial en Dokploy

El despliegue productivo debe configurarse desde el repositorio de la organización `github.com/sociest` después de la revisión y aprobación institucional. En Dokploy se selecciona `compose.yaml`, se configura la red externa `dokploy-network` y se enrutan los dominios al servicio `frontend` (puerto interno 80) y a `app` (puerto interno 8080). Los volúmenes nombrados `db_data` y `public_storage` conservan PostgreSQL y los archivos públicos, respectivamente.

La aplicación actualmente no envía correos desde el servidor. Si se agrega envío de restablecimiento de contraseña o notificaciones, se debe coordinar un SMTP externo y configurar sus credenciales únicamente en Dokploy.

## Calidad y dependencias

`composer.lock` y `frontend/package-lock.json` fijan las versiones de dependencias. El workflow de GitHub Actions ejecuta auditoría de Composer y npm, pruebas PHP, Vitest, Playwright con axe y la compilación del frontend. Para comprobaciones locales:

```bash
cd backend && composer audit --locked
cd ../frontend && npm audit --audit-level=high && npm test && npm run test:e2e && npm run build
```

---

## 📂 Estructura Limpia del Repositorio

```text
posgradoest/
├── backend/                  # API REST en Laravel 13 (PHP 8.3+)
│   ├── app/                  # Controladores, Modelos, Recursos y Middleware
│   ├── config/               # Configuración de base de datos, auth y cors
│   ├── database/             # Migraciones y seeders de la base de datos
│   ├── routes/api.php        # Endpoints de la API pública y administrativa
│   ├── composer.json         # Dependencias PHP
│   ├── composer.lock
│   └── Dockerfile            # Imagen de backend para producción
│
├── frontend/                 # Aplicación SPA en React 19 + Vite
│   ├── src/                  # Componentes, vistas, hooks y servicios API
│   ├── src/assets/images/    # Catálogo limpio de assets gráficos
│   ├── package.json          # Dependencias JavaScript
│   ├── package-lock.json
│   ├── nginx.conf            # Servidor Nginx para rutas SPA
│   └── Dockerfile            # Construcción multi-stage de producción
│
├── files/                    # Almacenamiento local ignorado por Git
│   └── storage/              # Banners, fotos y folletos subidos (.gitkeep)
│
├── compose.yaml              # Especificación Docker Compose base
├── compose.local.yaml        # Mapeo de puertos para desarrollo local (3000 / 8080)
├── .env.example              # Plantilla sin secretos (completar antes de iniciar)
├── .gitignore                # Exclusiones de Git
├── DEPLOY.md                 # Guía para despliegue en servidor / Dokploy
└── README.md                 # Este manual general de referencia
```
