# Backend - Tienda de Componentes de Computación (ARS) 🖥️⚡

Backend RESTful desarrollado en **Node.js** con **Express.js** y **MongoDB / Mongoose**, con autenticación JWT, control de acceso basado en 3 roles (**admin**, **empleado**, **cliente**), flujo completo de compras con control de stock y precios expresados en **Pesos Argentinos (ARS)**.

---

## 👥 Roles del Sistema y Permisos

| Rol | Responsabilidades y Permisos |
| :--- | :--- |
| 🛡️ **`admin`** | **Encargado de usuarios y roles**. Puede listar usuarios, crear usuarios asignando cualquier rol (`admin`, `empleado`, `cliente`), modificar roles de usuarios existentes y desactivar/eliminar cuentas. |
| 📦 **`empleado`** | **Encargado del catálogo e inventario**. Puede crear, editar y eliminar productos, ajustar stock (`PATCH /stock`), crear y editar marcas y categorías, y consultar y cambiar el estado de todas las órdenes de compra. |
| 🛒 **`cliente`** | **Comprador**. Puede registrarse (`signup`), iniciar sesión (`login`), consultar su perfil, explorar el catálogo público de productos en ARS y **realizar compras** (`POST /api/ordenes`) descontando stock automáticamente, además de revisar su historial (`GET /api/ordenes/mis-compras`). |

---

## 🔐 Matriz de Rutas Públicas vs Privadas

### Rutas Públicas (Sin autenticación requerida)
- `GET /` - Información general de la API.
- `GET /api/health` - Estado de salud y conexión a MongoDB.
- `POST /api/auth/register` (o `/signup`) - Registro de nuevos clientes.
- `POST /api/auth/login` - Inicio de sesión (devuelve token JWT).
- `GET /api/productos` - Catálogo de componentes con filtros en ARS y paginación.
- `GET /api/productos/:id` - Detalle de un componente.
- `GET /api/categorias` y `GET /api/categorias/:id` - Listado y detalle de categorías.
- `GET /api/marcas` y `GET /api/marcas/:id` - Listado y detalle de marcas.

### Rutas Privadas: Clientes (`Bearer <token>`)
- `GET /api/auth/perfil` - Datos del usuario en sesión.
- `POST /api/ordenes` - **Realizar compra** (valida y descuenta stock automáticamente).
- `GET /api/ordenes/mis-compras` - Historial de compras del cliente en sesión.
- `GET /api/ordenes/:id` - Detalle de una compra propia.

### Rutas Privadas: Empleados y Administradores (`Bearer <token>`)
- `POST /api/productos` - Crear componente de hardware.
- `PUT /api/productos/:id` - Modificar componente.
- `PATCH /api/productos/:id/stock` - Ajustar inventario (`increment`, `decrement`, `set`).
- `DELETE /api/productos/:id` - Eliminar o desactivar componente.
- `POST /api/categorias`, `PUT`, `DELETE` - Gestión de categorías.
- `POST /api/marcas`, `PUT`, `DELETE` - Gestión de marcas fabricantes.
- `GET /api/ordenes` - Ver todas las compras realizadas en la tienda.
- `PATCH /api/ordenes/:id/estado` - Cambiar estado de pedido (`pagado`, `preparando`, `enviado`, `entregado`, `cancelado`). Si se cancela, se devuelve el stock automáticamente.

### Rutas Privadas: Administrador Exclusivo (`Bearer <token>`)
- `GET /api/usuarios` - Listar todos los usuarios y filtrar por rol.
- `GET /api/usuarios/:id` - Detalle de un usuario.
- `POST /api/usuarios` - Crear usuarios asignando rol explícito (`empleado`, `admin`, `cliente`).
- `PUT /api/usuarios/:id` - Modificar datos y **cambiar roles de usuarios**.
- `DELETE /api/usuarios/:id` - Desactivar o eliminar usuarios.

---

## 💵 Moneda en Pesos Argentinos (ARS)

Todos los productos de la tienda manejan su precio en **ARS**. Los esquemas validan `moneda: "ARS"` y admiten valores reales del mercado de hardware nacional:
- Procesador AMD Ryzen 7 7800X3D: `$620.000 ARS`
- Procesador Intel Core i7-14700K: `$580.000 ARS`
- Tarjeta Gráfica ASUS RTX 4070 Ti SUPER: `$1.450.000 ARS`
- Placa Madre ASUS ROG Strix B650-A WiFi: `$390.000 ARS`
- Memoria RAM Corsair DDR5 32GB 6000MHz: `$195.000 ARS`
- SSD Kingston KC3000 2TB NVMe: `$240.000 ARS`

---

## 🚀 Inicio Rápido y Credenciales de Prueba

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Cargar la base de datos con los 3 usuarios y componentes en ARS:**
   ```bash
   npm run seed
   ```

3. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```

### 🔑 Usuarios Preconfigurados para Pruebas

| Rol | Correo | Contraseña |
| :--- | :--- | :--- |
| **Admin** | `admin@computech.com` | `Admin123!` |
| **Empleado** | `empleado@computech.com` | `Empleado123!` |
| **Cliente** | `cliente@computech.com` | `Cliente123!` |

---

## 🛒 Ejemplo de Flujo de Compra (Cliente)

1. **Login como cliente:**
   ```http
   POST /api/auth/login
   Content-Type: application/json

   {
     "email": "cliente@computech.com",
     "password": "Cliente123!"
   }
   ```
   *Respuesta: Se obtiene el `"token"` JWT.*

2. **Realizar Compra:**
   ```http
   POST /api/ordenes
   Authorization: Bearer <TOKEN_OBTENIDO>
   Content-Type: application/json

   {
     "items": [
       { "productoId": "<ID_DE_PRODUCTO>", "cantidad": 2 }
     ],
     "metodoPago": "transferencia",
     "direccionEnvio": {
       "calle": "Av. Santa Fe 1234",
       "ciudad": "CABA",
       "provincia": "Buenos Aires",
       "codigoPostal": "C1059"
     }
   }
   ```
   *El sistema verifica stock, descuenta 2 unidades y crea la orden con el total en ARS.*

3. **Consultar mis compras:**
   ```http
   GET /api/ordenes/mis-compras
   Authorization: Bearer <TOKEN_OBTENIDO>
   ```
