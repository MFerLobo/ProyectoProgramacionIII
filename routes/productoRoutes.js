import { Router } from "express";
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  updateStock,
  deleteProducto,
} from "../controller/productoController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";

const router = Router();

// Rutas Públicas (Catálogo de componentes accesible para cualquier visitante o cliente)
router.get("/", getProductos);
router.get("/:id", validateObjectId("id"), getProductoById);

// Rutas Privadas (Solo Empleados y Administradores pueden gestionar el catálogo e inventario)
router.post(
  "/",
  authenticate,
  authorizeRoles("empleado", "admin"),
  createProducto
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("empleado", "admin"),
  validateObjectId("id"),
  updateProducto
);

router.patch(
  "/:id/stock",
  authenticate,
  authorizeRoles("empleado", "admin"),
  validateObjectId("id"),
  updateStock
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("empleado", "admin"),
  validateObjectId("id"),
  deleteProducto
);

export default router;
