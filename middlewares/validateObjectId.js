import mongoose from "mongoose";

/**
 * Middleware para validar que los parámetros de ruta sean ObjectIds válidos de MongoDB.
 * Por defecto valida req.params.id, o el nombre de parámetro provisto.
 * @param {string} paramName - Nombre del parámetro de ruta a validar (por defecto 'id')
 */
export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `El parámetro '${paramName}' con valor '${id}' no es un ObjectId válido de MongoDB.`,
      });
    }
    next();
  };
};

export default validateObjectId;
