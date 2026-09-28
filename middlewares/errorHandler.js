/**
 * Middleware para rutas no encontradas (404)
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Middleware centralizado para manejo de errores de la aplicación
 */
export const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Error interno del servidor";
  let errors = null;

  // 1. Error de sintaxis en JSON del body enviado por el cliente
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Formato JSON inválido en el cuerpo de la petición.";
  }

  // 2. Error de validación de Mongoose (Schema validation)
  else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Error de validación en los datos enviados.";
    errors = Object.values(err.errors).map((item) => ({
      campo: item.path,
      mensaje: item.message,
      tipo: item.kind,
    }));
  }

  // 3. Error de clave duplicada en MongoDB (índices únicos como email, sku, nombre)
  else if (err.code === 11000) {
    statusCode = 409;
    const campoDuplicado = Object.keys(err.keyPattern || {})[0] || "campo";
    const valorDuplicado = err.keyValue ? err.keyValue[campoDuplicado] : "";
    message = `Ya existe un registro con el valor '${valorDuplicado}' en el campo '${campoDuplicado}'.`;
  }

  // 4. Error de casteo de Mongoose (por ejemplo, ObjectId inválido)
  else if (err.name === "CastError") {
    statusCode = 400;
    message = `El valor '${err.value}' no es válido para el campo '${err.path}'.`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
