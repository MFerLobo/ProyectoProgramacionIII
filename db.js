import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tienda_componentes";
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Conectado exitosamente al host: ${conn.connection.host}, Base de datos: ${conn.connection.name}`);
  } catch (error) {
    console.error("[MongoDB] Error al conectar a la base de datos:", error.message);
    // En desarrollo notificamos el fallo sin matar el proceso si se quiere seguir inspeccionando
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("[MongoDB] Conexión desconectada");
});

mongoose.connection.on("reconnected", () => {
  console.log("[MongoDB] Reconectado exitosamente");
});

export default connectDB;