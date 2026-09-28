import { Router } from "express";
import {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from "../controller/categoriaController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";

const router = Router();

// Rutas Públicas (Lectura de categorías)
router.get("/", getCategorias);
router.get("/:id", validateObjectId("id"), getCategoriaById);

// Rutas Privadas (Solo Empleados y Administradores pueden gestionar categorías)
router.post(
  "/",
  authenticate,
  authorizeRoles("empleado", "admin"),
  createCategoria
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("empleado", "admin"),
  validateObjectId("id"),
  updateCategoria
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("empleado", "admin"),
  validateObjectId("id"),
  deleteCategoria
);

export default router;
