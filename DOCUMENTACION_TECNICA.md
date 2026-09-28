# 📚 Manual Técnico y Documentación de Rutas - Tienda de Componentes de PC (ARS)

Backend RESTful desarrollado con **Node.js**, **Express.js (v5)** y **MongoDB / Mongoose**, estructurado bajo arquitectura por capas, con control de acceso basado en roles (**RBAC**), autenticación **JWT**, contraseñas cifradas con **bcrypt**, deducción atómica de stock y precios expresados en **Pesos Argentinos (ARS)**.

---

## 📑 Tabla de Contenidos
1. [Guía de Ejecución de la Aplicación y Base de Datos](#1-guía-de-ejecución-de-la-aplicación-y-base-de-datos)
   - [A. Ejecución en este Dispositivo Actual](#a-ejecución-en-este-dispositivo-actual)
   - [B. Instalación y Ejecución Desde Cero (Cualquier Computadora)](#b-instalación-y-ejecución-desde-cero-cualquier-computadora)
2. [Roles de Usuario y Matriz de Permisos](#2-roles-de-usuario-y-matriz-de-permisos)
3. [Diagrama de Secuencia: Flujo de Autenticación (Login) y Acceso a Rutas Privadas](#3-diagrama-de-secuencia-flujo-de-autenticación-login-y-acceso-a-rutas-privadas)
4. [Documentación Exhaustiva de Rutas y Endpoints](#4-documentación-exhaustiva-de-rutas-y-endpoints)
   - [Módulo de Autenticación (`/api/auth`)](#módulo-de-autenticación-apiauth)
   - [Módulo de Catálogo de Productos (`/api/productos`)](#módulo-de-catálogo-de-productos-apiproductos)
   - [Módulo de Categorías (`/api/categorias`)](#módulo-de-categorías-apicategorias)
   - [Módulo de Marcas Fabricantes (`/api/marcas`)](#módulo-de-marcas-fabricantes-apimarcas)
   - [Módulo de Compras y Pedidos (`/api/ordenes`)](#módulo-de-compras-y-pedidos-apiordenes)
   - [Módulo de Usuarios y Gestión de Roles (`/api/usuarios`)](#módulo-de-usuarios-y-gestión-de-roles-apiusuarios)
   - [Módulo de Estado y Salud del Sistema (`/api/health`)](#módulo-de-estado-y-salud-del-sistema-apihealth)
5. [Estructura del Manejo de Errores](#5-estructura-del-manejo-de-errores)

---

## 1. Guía de Ejecución de la Aplicación y Base de Datos

### A. Ejecución en este Dispositivo Actual

Este equipo ya cuenta con las dependencias instaladas y el servicio de MongoDB en ejecución.

1. **Abrir una terminal** (PowerShell o CMD) en la raíz del proyecto:
   ```powershell
   cd d:\Programacion\ProyectoProgramacionIII
   ```

2. **Verificar el servicio de MongoDB:**
   MongoDB se ejecuta por defecto como servicio de Windows. Si estuviese detenido, iniciarlo con:
   ```powershell
   net start MongoDB
   ```

3. **(Opcional) Regenerar datos de prueba:**
   Para restablecer categorías, marcas, componentes con precios en ARS y los 3 usuarios de prueba con contraseñas:
   ```powershell
   npm run seed
   ```

4. **Iniciar el servidor en modo desarrollo (con auto-recarga al guardar cambios):**
   ```powershell
   npm run dev
   ```
   O para modo estándar:
   ```powershell
   npm start
   ```

5. **Verificar estado:**
   Abrir en el navegador: [http://localhost:4000/api/health](http://localhost:4000/api/health) o [http://localhost:4000/](http://localhost:4000/).

---

### B. Instalación y Ejecución Desde Cero (Cualquier Computadora)

Sigue estos pasos en una computadora nueva donde no se haya ejecutado el proyecto antes:

#### Paso 1: Instalar Requisitos de Software
1. **Node.js:**
   - Descargar e instalar **Node.js LTS (v18.x, v20.x o superior)** desde [nodejs.org](https://nodejs.org/).
   - Verificar instalación en la terminal:
     ```bash
     node -v
     npm -v
     ```
2. **MongoDB Database:**
   - **Opción Local (Recomendada):** Descargar e instalar **MongoDB Community Server** desde [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community). Durante el asistente, asegurarse de marcar la casilla *"Install MongoD as a Service"*.
   - **Opción Nube (Alternativa):** Crear un clúster gratuito en [MongoDB Atlas](https://www.mongodb.com/atlas) y copiar el String de Conexión (URI).

#### Paso 2: Obtener el Código Fuente
Clonar el repositorio o descomprimir los archivos en una carpeta de trabajo:
```bash
git clone <URL_DEL_REPOSITORIO>
cd ProyectoProgramacionIII
```

#### Paso 3: Instalar Dependencias de Node
Ejecutar el siguiente comando para descargar todos los paquetes (`express`, `mongoose`, `dotenv`, `cors`, `jsonwebtoken`, `bcryptjs`):
```bash
npm install
```

#### Paso 4: Configurar Variables de Entorno (`.env`)
Crear un archivo llamado `.env` en la raíz del proyecto (puedes duplicar `.env.example`):
```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/tienda_componentes
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_super_segura_2026
JWT_EXPIRES_IN=24h
```
> **Nota:** Si utilizas MongoDB Atlas en la nube, reemplaza `MONGO_URI` por tu cadena de conexión (ej: `mongodb+srv://usuario:password@cluster.mongodb.net/tienda_componentes?retryWrites=true&w=majority`).

#### Paso 5: Poblar la Base de Datos Inicial (Seeder)
Ejecuta el script de siembra para crear las categorías de hardware, marcas fabricantes, componentes con precios en ARS y los 3 usuarios de los diferentes roles:
```bash
npm run seed
```

#### Paso 6: Iniciar el Backend
```bash
# Modo desarrollo con observación de cambios
npm run dev

# Modo producción
npm start
```
La API estará lista y escuchando en `http://localhost:4000`.

---

## 2. Roles de Usuario y Matriz de Permisos

El sistema implementa 3 roles estrictamente diferenciados mediante Control de Acceso Basado en Roles (**RBAC**):

```
       [ Visitante / Público ]
                 │
      ┌──────────┼──────────┐
      ▼          ▼          ▼
  [ CLIENTE ] [ EMPLEADO ] [ ADMIN ]
```

| Rol | Descripción y Alcance | Acciones Permitidas |
| :--- | :--- | :--- |
| **`cliente`** | Usuario registrado que compra en la tienda. | - Registro (`POST /api/auth/register`) y Login.<br>- Consultar su propio perfil (`GET /api/auth/perfil`).<br>- Ver catálogo de productos, marcas y categorías.<br>- **Realizar compras** (`POST /api/ordenes`) con descuento automático de stock.<br>- Consultar únicamente sus propias compras (`GET /api/ordenes/mis-compras`). |
| **`empleado`** | Personal comercial y de depósito de la tienda. | - Todo lo de navegación del catálogo.<br>- **Administrar productos**: crear, modificar, desactivar y ajustar stock (`PATCH /api/productos/:id/stock`).<br>- **Administrar categorías y marcas** (crear, editar, eliminar).<br>- **Gestionar pedidos de la tienda**: ver todas las órdenes de todos los clientes y cambiar su estado (`pagado`, `enviado`, `cancelado`). |
| **`admin`** | Administrador de sistemas y directivo. | - Posee todos los permisos de gestión del empleado.<br>- **Gestión exclusiva de Usuarios y Roles**: listar usuarios, crear cuentas con roles asignados, **modificar el rol de cualquier usuario** (ej. ascender un cliente a empleado o admin), y desactivar o eliminar cuentas. |

### Credenciales Semilla para Pruebas Inmediatas

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| 🛡️ **Admin** | `admin@computech.com` | `Admin123!` |
| 📦 **Empleado** | `empleado@computech.com` | `Empleado123!` |
| 🛒 **Cliente** | `cliente@computech.com` | `Cliente123!` |

---

## 3. Diagrama de Secuencia: Flujo de Autenticación (Login) y Acceso a Rutas Privadas

El siguiente diagrama detalla cómo un usuario se autentica en `/api/auth/login`, recibe su token **JSON Web Token (JWT)**, y cómo dicho token es utilizado e inspeccionado por los middlewares [`authenticate`](file:///d:/Programacion/ProyectoProgramacionIII/middlewares/auth.js#L7) y [`authorizeRoles`](file:///d:/Programacion/ProyectoProgramacionIII/middlewares/auth.js#L59) para autorizar una acción protegida (por ejemplo, realizar una compra o modificar el stock).

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Usuario / Cliente
    participant App as Cliente HTTP (Postman/Frontend)
    participant Server as Servidor Express (server.js)
    participant AuthCtrl as authController.login
    participant Mongo as Base de Datos (MongoDB)
    participant MidAuth as Middleware: authenticate
    participant MidRole as Middleware: authorizeRoles
    participant OrderCtrl as ordenController.crearCompra

    Note over Cliente,Mongo: FASE 1: INICIO DE SESIÓN (LOGIN)
    Cliente->>App: Ingresa email y contraseña
    App->>Server: POST /api/auth/login { email, password }
    Server->>AuthCtrl: Ejecuta login(req, res, next)
    AuthCtrl->>Mongo: Usuario.findOne({ email }).select('+password')
    Mongo-->>AuthCtrl: Retorna documento de Usuario con Hash
    
    alt Usuario no existe o está inactivo
        AuthCtrl-->>App: 401 Unauthorized / 403 Forbidden
    else Usuario existe
        AuthCtrl->>AuthCtrl: bcrypt.compare(password, user.password)
        alt Contraseña incorrecta
            AuthCtrl-->>App: 401 Unauthorized { success: false, message: "Credenciales inválidas" }
        else Contraseña correcta
            AuthCtrl->>AuthCtrl: Genera JWT firmado con JWT_SECRET y payload { id, rol }
            AuthCtrl-->>App: 200 OK { success: true, token: "eyJh...", usuario: { id, nombre, rol: "cliente" } }
            App-->>Cliente: Sesión iniciada con éxito
        end
    end

    Note over Cliente,OrderCtrl: FASE 2: PETICIÓN A RUTA PROTEGIDA (EJ. COMPRAR)
    Cliente->>App: Hace clic en "Comprar Componente"
    App->>Server: POST /api/ordenes (Header: Authorization: Bearer eyJh...)
    Server->>MidAuth: Intercepta y valida cabecera Authorization
    
    alt Token ausente o malformado
        MidAuth-->>App: 401 Unauthorized { message: "Token no proporcionado o inválido" }
    else Token válido
        MidAuth->>MidAuth: jwt.verify(token, JWT_SECRET)
        MidAuth->>Mongo: Usuario.findById(decoded.id)
        Mongo-->>MidAuth: Retorna usuario autenticado
        MidAuth->>MidAuth: Inyecta usuario en req.usuario
        MidAuth->>MidRole: Pasa control con next()
        
        Note over MidRole: Verifica si el rol está permitido: authorizeRoles("cliente", "admin")
        alt Rol no autorizado (ej. Empleado intentando comprar)
            MidRole-->>App: 403 Forbidden { message: "Acceso restringido: Se requiere rol..." }
        else Rol autorizado
            MidRole->>OrderCtrl: Pasa control con next()
            OrderCtrl->>Mongo: Valida stock de componentes y descuenta unidades
            OrderCtrl->>Mongo: Guarda la Orden en ARS
            OrderCtrl-->>App: 201 Created { success: true, message: "Compra realizada", data: orden }
            App-->>Cliente: Muestra confirmación de compra y número de orden
        end
    end
```

---

## 4. Documentación Exhaustiva de Rutas y Endpoints

### Formato de Cabecera para Rutas Privadas
Para todas las rutas que indiquen `Privada`:
```http
Authorization: Bearer <TOKEN_JWT_OBTENIDO_EN_LOGIN>
Content-Type: application/json
```

---

### Módulo de Autenticación (`/api/auth`)

#### 1. Registro de Nuevos Usuarios (Signup)
- **Método y Ruta:** `POST /api/auth/register` (o alias `POST /api/auth/signup`)
- **Acceso:** **Público** (Cualquier visitante).
- **Regla de Negocio:** Por seguridad pública, todo registro crea automáticamente usuarios con rol `'cliente'`.
- **Cuerpo de la Petición (JSON):**
  ```json
  {
    "nombre": "Esteban Quito",
    "email": "esteban@correo.com",
    "password": "Password123!",
    "telefono": "+54 11 5555-8888",
    "direccion": {
      "calle": "Av. Cabildo 2400",
      "ciudad": "CABA",
      "provincia": "Buenos Aires",
      "codigoPostal": "C1428"
    }
  }
  ```
- **Validaciones:**
  - `nombre`, `email`, `password` son obligatorios.
  - `password` debe tener mínimo 6 caracteres.
  - `email` debe cumplir formato de correo y no estar registrado previamente (índice único en Mongo).
- **Respuestas:**
  - `201 Created`: Devuelve token JWT y datos del nuevo cliente.
  - `400 Bad Request`: Datos incompletos o contraseña menor a 6 caracteres.
  - `409 Conflict`: Correo ya existente.

#### 2. Inicio de Sesión (Login)
- **Método y Ruta:** `POST /api/auth/login`
- **Acceso:** **Público**.
- **Cuerpo de la Petición (JSON):**
  ```json
  {
    "email": "cliente@computech.com",
    "password": "Cliente123!"
  }
  ```
- **Validaciones:** Comprueba presencia de ambos campos, busca usuario por email, verifica que no esté dado de baja (`activo: true`) y compara contraseña hasheada con `bcrypt`.
- **Respuestas:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Inicio de sesión exitoso.",
      "token": "eyJhbGciOi...",
      "usuario": {
        "id": "673f...",
        "nombre": "Lucas Cliente Gamer",
        "email": "cliente@computech.com",
        "rol": "cliente"
      }
    }
    ```
  - `401 Unauthorized`: Correo o contraseña incorrectos.
  - `403 Forbidden`: Cuenta de usuario desactivada.

#### 3. Obtener Perfil del Usuario en Sesión
- **Método y Ruta:** `GET /api/auth/perfil` (o alias `GET /api/auth/me`)
- **Acceso:** **Privado** (Cualquier usuario autenticado: `cliente`, `empleado`, `admin`).
- **Respuestas:**
  - `200 OK`: Retorna datos del perfil sin incluir el campo `password`.
  - `401 Unauthorized`: Token no enviado o expirado.

---

### Módulo de Catálogo de Productos (`/api/productos`)

#### 1. Listar Productos y Búsqueda Avanzada
- **Método y Ruta:** `GET /api/productos`
- **Acceso:** **Público**.
- **Parámetros de Consulta (Query Params Opcionales):**
  - `q`: Texto libre para buscar en nombre, SKU o descripción (ej: `?q=RTX`).
  - `categoria`: ObjectId de la categoría a filtrar.
  - `marca`: ObjectId de la marca a filtrar.
  - `minPrecio`: Precio mínimo en ARS (ej: `?minPrecio=200000`).
  - `maxPrecio`: Precio máximo en ARS (ej: `?maxPrecio=800000`).
  - `enStock`: Si es `true`, filtra productos con `stock > 0`.
  - `page`: Número de página (default: 1).
  - `limit`: Cantidad por página (default: 10, máx: 100).
  - `sortBy`: Campo de ordenación (`precio`, `nombre`, `stock`, `createdAt`).
  - `order`: Sentido (`asc` o `desc`).
- **Respuesta `200 OK`:**
  ```json
  {
    "success": true,
    "pagination": {
      "totalDocs": 6,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "data": [
      {
        "_id": "6741...",
        "nombre": "AMD Ryzen 7 7800X3D 4.2GHz / 5.0GHz AM5",
        "sku": "CPU-AMD-7800X3D",
        "precio": 620000,
        "moneda": "ARS",
        "stock": 20,
        "categoria": { "_id": "...", "nombre": "Procesadores (CPU)" },
        "marca": { "_id": "...", "nombre": "AMD" }
      }
    ]
  }
  ```

#### 2. Obtener Detalle de un Producto
- **Método y Ruta:** `GET /api/productos/:id`
- **Acceso:** **Público**.
- **Validaciones:** Middleware `validateObjectId` valida `:id`. Retorna populate completo de categoría y marca.
- **Respuestas:**
  - `200 OK`: Objeto completo del producto.
  - `400 Bad Request`: Formato de ID inválido.
  - `404 Not Found`: Producto no encontrado.

#### 3. Crear Producto Componente
- **Método y Ruta:** `POST /api/productos`
- **Acceso:** **Privado** (Roles: **`empleado`**, **`admin`**).
- **Cuerpo de la Petición (JSON):**
  ```json
  {
    "nombre": "Fuente Corsair RM850e 850W 80 Plus Gold Modular",
    "descripcion": "Fuente ATX 3.0 con conector PCIe 5.0 12VHPWR.",
    "sku": "PSU-CORSAIR-RM850E",
    "precio": 215000,
    "stock": 14,
    "categoria": "673f8a...",
    "marca": "673f8b...",
    "especificaciones": {
      "potencia": "850W",
      "certificacion": "80 Plus Gold",
      "formato": "Modular"
    },
    "garantiaMeses": 36
  }
  ```
- **Validaciones:**
  - `nombre`, `sku`, `precio`, `categoria`, `marca` requeridos.
  - `precio` debe ser mayor o igual a 0 (moneda ARS).
  - `stock` debe ser entero no negativo.
  - Verifica en MongoDB que la `categoria` y la `marca` existan antes de insertar.
- **Respuestas:**
  - `201 Created`: Producto registrado con éxito.
  - `400 Bad Request`: Falta de campos obligatorios o valores negativos.
  - `403 Forbidden`: Petición realizada por un usuario rol `cliente`.
  - `404 Not Found`: La categoría o marca proporcionada no existe.
  - `409 Conflict`: El código SKU ya está en uso.

#### 4. Modificar Producto
- **Método y Ruta:** `PUT /api/productos/:id`
- **Acceso:** **Privado** (Roles: **`empleado`**, **`admin`**).
- **Cuerpo:** Campos a modificar (`nombre`, `precio`, `stock`, `especificaciones`, etc.).

#### 5. Ajuste de Stock (Inventario de Depósito)
- **Método y Ruta:** `PATCH /api/productos/:id/stock`
- **Acceso:** **Privado** (Roles: **`empleado`**, **`admin`**).
- **Cuerpo de la Petición:**
  ```json
  {
    "cantidad": 5,
    "operacion": "increment"
  }
  ```
  *(Operaciones admitidas: `"set"`, `"increment"`, `"decrement"`)*
- **Validaciones:** Si se utiliza `"decrement"`, verifica que el stock no caiga por debajo de cero.
- **Respuestas:**
  - `200 OK`: `{ "success": true, "message": "Stock actualizado a 19 unidades.", "data": { ... } }`
  - `400 Bad Request`: Operación inválida o stock insuficiente.

#### 6. Eliminar o Desactivar Producto
- **Método y Ruta:** `DELETE /api/productos/:id`
- **Acceso:** **Privado** (Roles: **`empleado`**, **`admin`**).
- **Parámetros:** `?fisico=true` para borrado permanente; sin parámetro realiza baja lógica (`activo: false`).

---

### Módulo de Categorías (`/api/categorias`)

- `GET /api/categorias`: **Público**. Lista categorías (`?activo=true|false`).
- `GET /api/categorias/:id`: **Público**. Detalle de categoría.
- `POST /api/categorias`: **Privado (`empleado`, `admin`)**. Crea categoría (`{ "nombre": "...", "descripcion": "..." }`).
- `PUT /api/categorias/:id`: **Privado (`empleado`, `admin`)**. Modifica categoría.
- `DELETE /api/categorias/:id`: **Privado (`empleado`, `admin`)**.
  - Si existen productos asociados y se intenta `?fisico=true`, la API lo bloquea con `400 Bad Request` protegiendo la integridad referencial.

---

### Módulo de Marcas Fabricantes (`/api/marcas`)

- `GET /api/marcas`: **Público**. Lista fabricantes (AMD, Intel, Nvidia, ASUS, etc.).
- `GET /api/marcas/:id`: **Público**. Detalle de marca.
- `POST /api/marcas`: **Privado (`empleado`, `admin`)**. Crea marca (`{ "nombre": "...", "paisOrigen": "...", "sitioWeb": "..." }`).
- `PUT /api/marcas/:id`: **Privado (`empleado`, `admin`)**. Actualiza datos.
- `DELETE /api/marcas/:id`: **Privado (`empleado`, `admin`)**. Desactiva o elimina si no tiene productos asociados.

---

### Módulo de Compras y Pedidos (`/api/ordenes`)

#### 1. Realizar una Compra (Clientes)
- **Método y Ruta:** `POST /api/ordenes` (o alias `POST /api/compras`)
- **Acceso:** **Privado** (Roles: **`cliente`**, **`admin`**).
- **Cuerpo de la Petición (JSON):**
  ```json
  {
    "items": [
      {
        "productoId": "6741d4c8a2b1c3d4e5f6a701",
        "cantidad": 2
      },
      {
        "productoId": "6741d4c8a2b1c3d4e5f6a705",
        "cantidad": 1
      }
    ],
    "metodoPago": "transferencia",
    "direccionEnvio": {
      "calle": "Av. Rivadavia 4500",
      "ciudad": "CABA",
      "provincia": "Buenos Aires",
      "codigoPostal": "C1405"
    }
  }
  ```
  *(Nota: Si `direccionEnvio` no se envía en el body, se utiliza la dirección registrada en el perfil del cliente).*
- **Reglas y Validaciones del Flujo de Compra:**
  1. Valida que el arreglo `items` no esté vacío.
  2. Valida que cada producto exista y esté activo en MongoDB.
  3. **Comprobación de Stock:** Verifica si `producto.stock >= cantidad`. Si algún producto no tiene unidades suficientes, aborta la operación con `400 Bad Request` indicando el componente y el stock disponible.
  4. **Deducción de Stock:** Resta las cantidades compradas en la base de datos de manera atómica.
  5. **Cálculo de Precios en ARS:** Multiplica el precio actual en ARS de cada producto por la cantidad y suma el `total`.
  6. Guarda la orden con estado inicial `"pendiente"` y moneda `"ARS"`.
- **Respuestas:**
  - `201 Created`: Compra exitosa con el detalle completo de la orden.
  - `400 Bad Request`: Stock insuficiente o datos de envío incompletos.
  - `401 Unauthorized`: No autenticado.

#### 2. Consultar Mis Compras
- **Método y Ruta:** `GET /api/ordenes/mis-compras`
- **Acceso:** **Privado** (Usuario autenticado).
- **Comportamiento:** Retorna el historial de compras del usuario asociado al token JWT, ordenadas descendentemente por fecha (`createdAt: -1`).

#### 3. Consultar Detalle de una Orden
- **Método y Ruta:** `GET /api/ordenes/:id`
- **Acceso:** **Privado**.
- **Control de Seguridad:** Si quien consulta tiene rol `cliente`, el sistema comprueba que `orden.usuario === req.usuario._id`. Si intenta consultar la compra de otro cliente, recibe `403 Forbidden`. Los usuarios `empleado` y `admin` pueden consultar cualquier compra.

#### 4. Listar Todas las Compras de la Tienda
- **Método y Ruta:** `GET /api/ordenes`
- **Acceso:** **Privado** (Roles: **`empleado`**, **`admin`**).
- **Parámetros Opcionales:** `?estado=pendiente|pagado|enviado|cancelado`, `?page=1`, `?limit=20`.

#### 5. Cambiar Estado de una Orden
- **Método y Ruta:** `PATCH /api/ordenes/:id/estado`
- **Acceso:** **Privado** (Roles: **`empleado`**, **`admin`**).
- **Cuerpo de la Petición:**
  ```json
  {
    "estado": "enviado"
  }
  ```
  *(Estados permitidos: `"pendiente"`, `"pagado"`, `"preparando"`, `"enviado"`, `"entregado"`, `"cancelado"`)*
- **Regla Especial de Cancelación:** Si la orden se cambia a `"cancelado"`, el sistema **reintegra automáticamente el stock** a cada uno de los productos que componían el pedido.

---

### Módulo de Usuarios y Gestión de Roles (`/api/usuarios`)

> ⚠️ **Este módulo completo es de acceso EXCLUSIVO para el rol `admin`.**

#### 1. Listar Usuarios
- **Método y Ruta:** `GET /api/usuarios`
- **Acceso:** **Privado (`admin`)**.
- **Query Params:** `?rol=admin|empleado|cliente`, `?activo=true|false`, `?page=1`, `?limit=20`.
- **Respuesta:** Lista paginada con exclusión de las contraseñas.

#### 2. Obtener Usuario por ID
- **Método y Ruta:** `GET /api/usuarios/:id`
- **Acceso:** **Privado (`admin`)**.

#### 3. Crear Usuario con Rol Asignado
- **Método y Ruta:** `POST /api/usuarios`
- **Acceso:** **Privado (`admin`)**.
- **Cuerpo:**
  ```json
  {
    "nombre": "Carlos Empleado",
    "email": "carlos@computech.com",
    "password": "PasswordSeguro123!",
    "rol": "empleado",
    "telefono": "+54 11 9988-7766"
  }
  ```
- **Comportamiento:** Hashea la contraseña y crea el usuario con el rol especificado (`admin`, `empleado` o `cliente`).

#### 4. Modificar Usuario y Asignación de Roles
- **Método y Ruta:** `PUT /api/usuarios/:id`
- **Acceso:** **Privado (`admin`)**.
- **Cuerpo (Ejemplo cambio de rol):**
  ```json
  {
    "rol": "empleado"
  }
  ```
- **Regla:** Permite a un administrador promover o degradar roles en el sistema (`cliente` ↔ `empleado` ↔ `admin`).

#### 5. Eliminar o Desactivar Usuario
- **Método y Ruta:** `DELETE /api/usuarios/:id`
- **Acceso:** **Privado (`admin`)**.
- **Regla de Seguridad:** El administrador no puede eliminarse a sí mismo mientras está en sesión activa. Admite `?fisico=true` o baja lógica por defecto.

---

### Módulo de Estado y Salud del Sistema (`/api/health`)

- **Método y Ruta:** `GET /api/health`
- **Acceso:** **Público**.
- **Propósito:** Health-check para monitoreo, balanceadores de carga o verificaciones de despliegue.
- **Respuesta `200 OK`:**
  ```json
  {
    "success": true,
    "message": "API Tienda de Componentes de Computación (ARS) operativa.",
    "timestamp": "2026-09-28T13:48:15.000Z",
    "moneda": "ARS",
    "database": {
      "status": "conectado",
      "name": "tienda_componentes"
    },
    "roles": { ... },
    "endpoints": { ... }
  }
  ```

---

## 5. Estructura del Manejo de Errores

Todas las respuestas de error en la API devuelven una estructura uniforme en formato JSON:

```json
{
  "success": false,
  "message": "Descripción clara de la causa del error",
  "errors": [ ... ] // Opcional, presente en errores de validación de esquemas
}
```

### Códigos de Estado HTTP Utilizados

| Código | Significado | Caso Típico de Uso |
| :--- | :--- | :--- |
| **`200 OK`** | Éxito | Consultas y actualizaciones exitosas. |
| **`201 Created`** | Creado | Registro de usuario, nuevo producto, compra completada. |
| **`400 Bad Request`** | Petición Inválida | Formato de ObjectId inválido, campos requeridos faltantes, stock insuficiente, precios negativos. |
| **`401 Unauthorized`** | No Autenticado | Token no proporcionado, token inválido o credenciales erróneas en el login. |
| **`403 Forbidden`** | Prohibido | Usuario autenticado pero sin rol suficiente (ej. cliente intentando crear productos o empleado intentando editar usuarios). |
| **`404 Not Found`** | No Encontrado | Registro inexistente en la BD o ruta URL no declarada. |
| **`409 Conflict`** | Conflicto | Clave única duplicada en MongoDB (`email` de usuario o `sku` de producto ya existente). |
| **`500 Internal Error`** | Error del Servidor | Error no capturado; se registra en consola y se oculta el stack en modo producción. |
