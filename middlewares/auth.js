import jwt from "jsonwebtoken";
import Usuario from "../entity/usuario.js";

/**
 * Middleware para autenticar usuarios mediante JWT (rutas privadas)
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Acceso no autorizado. Debe proporcionar un token Bearer válido.",
      });
    }

    const secret = process.env.JWT_SECRET || "secreto_default_seguridad";
    const decoded = jwt.verify(token, secret);

    const usuario = await Usuario.findById(decoded.id);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "El usuario asociado a este token ya no existe.",
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: "Su cuenta de usuario ha sido desactivada. Contacte al administrador.",
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido o malformado.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "El token ha expirado. Por favor inicie sesión nuevamente.",
      });
    }
    next(error);
  }
};

/**
 * Middleware de control de acceso basado en roles (RBAC)
 * @param  {...string} rolesPermitidos - Lista de roles autorizados: 'admin', 'empleado', 'cliente'
 */
export const authorizeRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado.",
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso restringido: Se requiere rol [${rolesPermitidos.join(", ")}]. Su rol actual es '${req.usuario.rol}'.`,
      });
    }

    next();
  };
};

export default { authenticate, authorizeRoles };
