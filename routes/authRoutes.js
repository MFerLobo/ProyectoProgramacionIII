import { Router } from "express";
import { register, login, getPerfil } from "../controller/authController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// Rutas públicas de autenticación
router.post("/register", register);
router.post("/signup", register); // alias conveniente
router.post("/login", login);

// Rutas privadas del usuario autenticado
router.get("/perfil", authenticate, getPerfil);
router.get("/me", authenticate, getPerfil); // alias

export default router;
