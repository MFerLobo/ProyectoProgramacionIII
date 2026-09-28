import mongoose from "mongoose";
import dotenv from "dotenv";
import Categoria from "./entity/categoria.js";
import Marca from "./entity/marca.js";
import Producto from "./entity/producto.js";
import Usuario from "./entity/usuario.js";
import Orden from "./entity/orden.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tienda_componentes";

const seedData = async () => {
  try {
    console.log("[Seeder] Conectando a MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("[Seeder] Limpiando colecciones anteriores...");

    await Promise.all([
      Categoria.deleteMany({}),
      Marca.deleteMany({}),
      Producto.deleteMany({}),
      Usuario.deleteMany({}),
      Orden.deleteMany({}),
    ]);

    // 1. CREAR CATEGORÍAS
    console.log("[Seeder] Insertando categorías...");
    const categorias = await Categoria.insertMany([
      {
        nombre: "Procesadores (CPU)",
        descripcion: "Unidades centrales de procesamiento para gaming y workstation.",
      },
      {
        nombre: "Tarjetas Gráficas (GPU)",
        descripcion: "Placas de video dedicadas para gaming y renderizado profesional.",
      },
      {
        nombre: "Placas Base (Motherboards)",
        descripcion: "Tarjetas madre compatibles con plataformas Intel y AMD.",
      },
      {
        nombre: "Memorias RAM",
        descripcion: "Módulos de memoria DDR4 y DDR5 de alto rendimiento.",
      },
      {
        nombre: "Almacenamiento (SSD/HDD)",
        descripcion: "Unidades de estado sólido NVMe PCIe 4.0/5.0 y discos duros.",
      },
      {
        nombre: "Fuentes de Poder (PSU)",
        descripcion: "Fuentes con certificación 80 Plus Bronce, Oro y Platino.",
      },
    ]);

    // 2. CREAR MARCAS
    console.log("[Seeder] Insertando marcas fabricantes...");
    const marcas = await Marca.insertMany([
      { nombre: "AMD", paisOrigen: "EE.UU.", sitioWeb: "https://www.amd.com" },
      { nombre: "Intel", paisOrigen: "EE.UU.", sitioWeb: "https://www.intel.com" },
      { nombre: "NVIDIA", paisOrigen: "EE.UU.", sitioWeb: "https://www.nvidia.com" },
      { nombre: "ASUS", paisOrigen: "Taiwán", sitioWeb: "https://www.asus.com" },
      { nombre: "Corsair", paisOrigen: "EE.UU.", sitioWeb: "https://www.corsair.com" },
      { nombre: "Kingston", paisOrigen: "EE.UU.", sitioWeb: "https://www.kingston.com" },
    ]);

    const catMap = categorias.reduce((acc, cat) => ({ ...acc, [cat.nombre]: cat._id }), {});
    const marcaMap = marcas.reduce((acc, m) => ({ ...acc, [m.nombre]: m._id }), {});

    // 3. CREAR PRODUCTOS CON PRECIOS EN PESOS ARGENTINOS (ARS)
    console.log("[Seeder] Insertando componentes con precios en ARS...");
    const productos = await Producto.insertMany([
      {
        nombre: "AMD Ryzen 7 7800X3D 4.2GHz / 5.0GHz AM5",
        descripcion: "El procesador número uno para gaming con 3D V-Cache.",
        sku: "CPU-AMD-7800X3D",
        precio: 620000, // en ARS
        moneda: "ARS",
        stock: 20,
        categoria: catMap["Procesadores (CPU)"],
        marca: marcaMap["AMD"],
        especificaciones: {
          socket: "AM5",
          nucleos: "8",
          hilos: "16",
          consumoWatts: "120W",
        },
        garantiaMeses: 36,
      },
      {
        nombre: "Intel Core i7-14700K 3.4GHz LGA1700",
        descripcion: "Potencia híbrida para gaming extremo y creación de contenido pesado.",
        sku: "CPU-INTEL-14700K",
        precio: 580000, // en ARS
        moneda: "ARS",
        stock: 15,
        categoria: catMap["Procesadores (CPU)"],
        marca: marcaMap["Intel"],
        especificaciones: {
          socket: "LGA1700",
          nucleos: "20 (8P + 12E)",
          hilos: "28",
          consumoWatts: "125W",
        },
        garantiaMeses: 36,
      },
      {
        nombre: "ASUS ROG Strix GeForce RTX 4070 Ti SUPER 16GB OC",
        descripcion: "Placa de video de alta gama con DLSS 3.5 y 16GB GDDR6X.",
        sku: "GPU-ASUS-4070TI-SUP",
        precio: 1450000, // en ARS
        moneda: "ARS",
        stock: 10,
        categoria: catMap["Tarjetas Gráficas (GPU)"],
        marca: marcaMap["ASUS"],
        especificaciones: {
          vram: "16GB GDDR6X",
          interfaz: "PCIe 4.0 x16",
          fuenteRecomendada: "750W",
        },
        garantiaMeses: 36,
      },
      {
        nombre: "ASUS ROG STRIX B650-A GAMING WIFI",
        descripcion: "Placa base AM5 con soporte PCIe 5.0, WiFi 6E y robusto VRM.",
        sku: "MB-ASUS-B650A-WIFI",
        precio: 390000, // en ARS
        moneda: "ARS",
        stock: 12,
        categoria: catMap["Placas Base (Motherboards)"],
        marca: marcaMap["ASUS"],
        especificaciones: {
          socket: "AM5",
          formato: "ATX",
          slotsRAM: "4x DDR5",
        },
        garantiaMeses: 36,
      },
      {
        nombre: "Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz CL30",
        descripcion: "Kit de memorias de baja latencia optimizadas para AMD EXPO e Intel XMP.",
        sku: "RAM-CORSAIR-DDR5-32GB",
        precio: 195000, // en ARS
        moneda: "ARS",
        stock: 35,
        categoria: catMap["Memorias RAM"],
        marca: marcaMap["Corsair"],
        especificaciones: {
          tipo: "DDR5",
          capacidad: "32GB (2x16GB)",
          frecuencia: "6000MHz",
          latencia: "CL30",
        },
        garantiaMeses: 60,
      },
      {
        nombre: "Kingston KC3000 SSD 2TB M.2 PCIe 4.0 NVMe",
        descripcion: "Unidad ultrarrápida de 7000MB/s lectura y escritura.",
        sku: "SSD-KINGSTON-KC3000-2TB",
        precio: 240000, // en ARS
        moneda: "ARS",
        stock: 25,
        categoria: catMap["Almacenamiento (SSD/HDD)"],
        marca: marcaMap["Kingston"],
        especificaciones: {
          formato: "M.2 2280",
          interfaz: "PCIe 4.0 NVMe",
          velocidadLectura: "7000 MB/s",
        },
        garantiaMeses: 60,
      },
    ]);

    // 4. CREAR LOS 3 TIPOS DE USUARIO REQUERIDOS
    console.log("[Seeder] Creando usuarios para los 3 roles del sistema...");

    // Rol 1: ADMIN (Administra usuarios y sus roles)
    const adminUser = await Usuario.create({
      nombre: "Administrador General",
      email: "admin@computech.com",
      password: "Admin123!",
      rol: "admin",
      telefono: "+54 11 4400-0001",
      direccion: {
        calle: "Av. Corrientes 1500",
        ciudad: "CABA",
        provincia: "Buenos Aires",
        codigoPostal: "C1042",
      },
    });

    // Rol 2: EMPLEADO (Administra productos, categorías, marcas, stock y pedidos)
    const empleadoUser = await Usuario.create({
      nombre: "Martín Empleado Hardware",
      email: "empleado@computech.com",
      password: "Empleado123!",
      rol: "empleado",
      telefono: "+54 11 4400-0002",
      direccion: {
        calle: "Av. Santa Fe 2200",
        ciudad: "CABA",
        provincia: "Buenos Aires",
        codigoPostal: "C1123",
      },
    });

    // Rol 3: CLIENTE (Explora catálogo y realiza compras)
    const clienteUser = await Usuario.create({
      nombre: "Lucas Cliente Gamer",
      email: "cliente@computech.com",
      password: "Cliente123!",
      rol: "cliente",
      telefono: "+54 11 4400-0003",
      direccion: {
        calle: "Av. Rivadavia 4500",
        ciudad: "CABA",
        provincia: "Buenos Aires",
        codigoPostal: "C1405",
      },
    });

    // 5. CREAR UNA COMPRA DE PRUEBA REALIZADA POR EL CLIENTE
    console.log("[Seeder] Creando compra de prueba para el cliente...");
    const productoComprado = productos[0]; // Ryzen 7 7800X3D ($620.000 ARS)
    await Orden.create({
      usuario: clienteUser._id,
      items: [
        {
          producto: productoComprado._id,
          nombre: productoComprado.nombre,
          precioUnitario: productoComprado.precio,
          cantidad: 1,
          subtotal: productoComprado.precio,
        },
      ],
      total: productoComprado.precio,
      moneda: "ARS",
      metodoPago: "transferencia",
      estado: "pagado",
      direccionEnvio: clienteUser.direccion,
    });

    console.log("\n=======================================================");
    console.log("   DATOS SEMILLA CARGADOS EXITOSAMENTE (PRECIOS EN ARS)   ");
    console.log("=======================================================");
    console.log("Credenciales de prueba disponibles:");
    console.log("1. ADMIN (Gestión de usuarios y roles):");
    console.log("   - Email:    admin@computech.com");
    console.log("   - Password: Admin123!");
    console.log("2. EMPLEADO (Gestión de productos, stock, marcas, categorías):");
    console.log("   - Email:    empleado@computech.com");
    console.log("   - Password: Empleado123!");
    console.log("3. CLIENTE (Comprar componentes y ver mis compras):");
    console.log("   - Email:    cliente@computech.com");
    console.log("   - Password: Cliente123!");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("[Seeder] Error al sembrar datos:", error);
    process.exit(1);
  }
};

seedData();
