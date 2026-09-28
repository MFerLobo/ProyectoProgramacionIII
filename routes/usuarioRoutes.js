import { Router } from "express";
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "../controller/usuarioController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";

const router = Router();

// Todas las rutas de administración de usuarios y roles son exclusivas para el rol 'admin'
router.use(authenticate);
router.use(authorizeRoles("admin"));

router.get("/", getUsuarios);
router.get("/:id", validateObjectId("id"), getUsuarioById);
router.post("/", createUsuario);
router.put("/:id", validateObjectId("id"), updateUsuario);
router.delete("/:id", validateObjectId("id"), deleteUsuario);

export default router;
