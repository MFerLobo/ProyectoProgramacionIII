import mongoose from "mongoose";
import dotenv from "dotenv";
import Usuario from "../entity/usuario.js";
import connectDB from "../db.js";

dotenv.config();

let tokensCache = null;

/**
 * Inicializar la conexión a MongoDB para las pruebas
 */
export const initTestDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
};

/**
 * Obtener tokens válidos para los 3 roles del sistema
 */
export const getTestTokens = async () => {
  if (tokensCache) return tokensCache;

  await initTestDB();

  // Asegurar que los 3 usuarios existan
  let admin = await Usuario.findOne({ email: "admin@computech.com" });
  if (!admin) {
    admin = await Usuario.create({
      nombre: "Admin Test",
      email: "admin@computech.com",
      password: "Admin123!",
      rol: "admin",
    });
  }

  let empleado = await Usuario.findOne({ email: "empleado@computech.com" });
  if (!empleado) {
    empleado = await Usuario.create({
      nombre: "Empleado Test",
      email: "empleado@computech.com",
      password: "Empleado123!",
      rol: "empleado",
    });
  }

  let cliente = await Usuario.findOne({ email: "cliente@computech.com" });
  if (!cliente) {
    cliente = await Usuario.create({
      nombre: "Cliente Test",
      email: "cliente@computech.com",
      password: "Cliente123!",
      rol: "cliente",
    });
  }

  tokensCache = {
    adminToken: admin.generarJWT(),
    empleadoToken: empleado.generarJWT(),
    clienteToken: cliente.generarJWT(),
    adminUser: admin,
    empleadoUser: empleado,
    clienteUser: cliente,
  };

  return tokensCache;
};
