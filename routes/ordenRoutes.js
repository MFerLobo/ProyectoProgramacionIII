import { Router } from "express";
import {
  crearCompra,
  getMisCompras,
  getCompraById,
  getTodasLasCompras,
  cambiarEstadoCompra,
} from "../controller/ordenController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";

const router = Router();

// Todas las rutas de órdenes requieren autenticación
router.use(authenticate);

// 1. Rutas para Clientes
router.post("/", authorizeRoles("cliente", "admin"), crearCompra);
router.get("/mis-compras", getMisCompras);

// 2. Rutas para Empleados y Administradores (Gestión de ventas de la tienda)
router.get("/", authorizeRoles("empleado", "admin"), getTodasLasCompras);
router.patch(
  "/:id/estado",
  authorizeRoles("empleado", "admin"),
  validateObjectId("id"),
  cambiarEstadoCompra
);

// 3. Detalle de orden (El cliente ve la suya, empleados/admins ven cualquiera)
router.get("/:id", validateObjectId("id"), getCompraById);

export default router;
