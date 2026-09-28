import { Router } from "express";
import {
  getMarcas,
  getMarcaById,
  createMarca,
  updateMarca,
  deleteMarca,
} from "../controller/marcaController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";

const router = Router();

// Rutas Públicas (Lectura de marcas)
router.get("/", getMarcas);
router.get("/:id", validateObjectId("id"), getMarcaById);

// Rutas Privadas (Solo Empleados y Administradores pueden gestionar marcas)
router.post(
  "/",
  authenticate,
  authorizeRoles("empleado", "admin"),
  createMarca
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("empleado", "admin"),
  validateObjectId("id"),
  updateMarca
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("empleado", "admin"),
  validateObjectId("id"),
  deleteMarca
);

export default router;
