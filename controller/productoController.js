import mongoose from "mongoose";
import Producto from "../entity/producto.js";
import Categoria from "../entity/categoria.js";
import Marca from "../entity/marca.js";

/**
 * Obtener productos con filtros avanzados, búsqueda y paginación
 * Query params:
 * - q: texto de búsqueda en nombre/descripción
 * - categoria: ID de la categoría
 * - marca: ID de la marca
 * - minPrecio, maxPrecio: rango numérico de precio
 * - enStock: 'true' para solo productos con stock > 0
 * - activo: 'true' | 'false' (por defecto true)
 * - page: número de página (por defecto 1)
 * - limit: cantidad por página (por defecto 10, max 100)
 * - sortBy: campo para ordenar ('precio', 'nombre', 'stock', 'createdAt')
 * - order: 'asc' o 'desc' (por defecto 'asc')
 */
export const getProductos = async (req, res, next) => {
  try {
    const {
      q,
      categoria,
      marca,
      minPrecio,
      maxPrecio,
      enStock,
      activo = "true",
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filtro = {};

    // Filtro por estado activo
    if (activo !== undefined && activo !== "all") {
      filtro.activo = activo === "true";
    }

    // Búsqueda por texto (nombre o sku)
    if (q && q.trim()) {
      filtro.$or = [
        { nombre: { $regex: q.trim(), $options: "i" } },
        { sku: { $regex: q.trim(), $options: "i" } },
        { descripcion: { $regex: q.trim(), $options: "i" } },
      ];
    }

    // Filtro por categoría (validar si es ObjectId)
    if (categoria) {
      if (!mongoose.Types.ObjectId.isValid(categoria)) {
        return res.status(400).json({
          success: false,
          message: "El parámetro de categoría no es un ObjectId válido.",
        });
      }
      filtro.categoria = categoria;
    }

    // Filtro por marca (validar si es ObjectId)
    if (marca) {
      if (!mongoose.Types.ObjectId.isValid(marca)) {
        return res.status(400).json({
          success: false,
          message: "El parámetro de marca no es un ObjectId válido.",
        });
      }
      filtro.marca = marca;
    }

    // Filtro de rango de precio
    if (minPrecio !== undefined || maxPrecio !== undefined) {
      filtro.precio = {};
      if (minPrecio !== undefined && !isNaN(Number(minPrecio))) {
        filtro.precio.$gte = Number(minPrecio);
      }
      if (maxPrecio !== undefined && !isNaN(Number(maxPrecio))) {
        filtro.precio.$lte = Number(maxPrecio);
      }
    }

    // Filtro por disponibilidad de stock
    if (enStock === "true") {
      filtro.stock = { $gt: 0 };
    }

    // Paginación y orden
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sortOrder = order === "asc" ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const [totalDocs, productos] = await Promise.all([
      Producto.countDocuments(filtro),
      Producto.find(filtro)
        .populate("categoria", "nombre activo")
        .populate("marca", "nombre paisOrigen")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalDocs / limitNum) || 1;

    res.status(200).json({
      success: true,
      pagination: {
        totalDocs,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: productos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un producto por ID con su categoría y marca
 */
export const getProductoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findById(id)
      .populate("categoria", "nombre descripcion activo")
      .populate("marca", "nombre paisOrigen sitioWeb activo");

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: `Producto con ID '${id}' no encontrado.`,
      });
    }

    res.status(200).json({
      success: true,
      data: producto,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear un nuevo producto componente de PC
 */
export const createProducto = async (req, res, next) => {
  try {
    const {
      nombre,
      descripcion,
      sku,
      precio,
      stock,
      categoria,
      marca,
      especificaciones,
      imagenes,
      garantiaMeses,
      activo,
    } = req.body;

    // Validaciones de presencia
    if (!nombre || !sku || precio === undefined || !categoria || !marca) {
      return res.status(400).json({
        success: false,
        message:
          "Los campos 'nombre', 'sku', 'precio', 'categoria' y 'marca' son obligatorios.",
      });
    }

    // Validar formato de ObjectIds de categoria y marca
    if (!mongoose.Types.ObjectId.isValid(categoria)) {
      return res.status(400).json({
        success: false,
        message: "El campo 'categoria' debe ser un ObjectId de MongoDB válido.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(marca)) {
      return res.status(400).json({
        success: false,
        message: "El campo 'marca' debe ser un ObjectId de MongoDB válido.",
      });
    }

    // Validar valores numéricos
    if (isNaN(Number(precio)) || Number(precio) < 0) {
      return res.status(400).json({
        success: false,
        message: "El precio debe ser un número igual o mayor a 0.",
      });
    }

    if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0)) {
      return res.status(400).json({
        success: false,
        message: "El stock debe ser un número entero mayor o igual a 0.",
      });
    }

    // Verificar que la categoría y marca existan en la base de datos
    const [categoriaExiste, marcaExiste] = await Promise.all([
      Categoria.findById(categoria),
      Marca.findById(marca),
    ]);

    if (!categoriaExiste) {
      return res.status(404).json({
        success: false,
        message: `La categoría con ID '${categoria}' no existe en el sistema.`,
      });
    }

    if (!marcaExiste) {
      return res.status(404).json({
        success: false,
        message: `La marca con ID '${marca}' no existe en el sistema.`,
      });
    }

    const nuevoProducto = await Producto.create({
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : "",
      sku: sku.trim().toUpperCase(),
      precio: Number(precio),
      stock: stock !== undefined ? Math.floor(Number(stock)) : 0,
      categoria,
      marca,
      especificaciones: especificaciones || {},
      imagenes: Array.isArray(imagenes) ? imagenes : [],
      garantiaMeses: garantiaMeses !== undefined ? Number(garantiaMeses) : 12,
      activo: activo !== undefined ? Boolean(activo) : true,
    });

    // Populate para devolver la respuesta con los nombres asociados
    const productoPoblado = await Producto.findById(nuevoProducto._id)
      .populate("categoria", "nombre")
      .populate("marca", "nombre");

    res.status(201).json({
      success: true,
      message: "Producto de computación registrado exitosamente.",
      data: productoPoblado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar un producto existente
 */
export const updateProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      sku,
      precio,
      stock,
      categoria,
      marca,
      especificaciones,
      imagenes,
      garantiaMeses,
      activo,
    } = req.body;

    const camposActualizar = {};

    if (nombre !== undefined) {
      if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).json({
          success: false,
          message: "El nombre no puede estar vacío.",
        });
      }
      camposActualizar.nombre = nombre.trim();
    }

    if (descripcion !== undefined) {
      camposActualizar.descripcion = descripcion.trim();
    }

    if (sku !== undefined) {
      if (!sku || typeof sku !== "string" || !sku.trim()) {
        return res.status(400).json({
          success: false,
          message: "El SKU no puede estar vacío.",
        });
      }
      camposActualizar.sku = sku.trim().toUpperCase();
    }

    if (precio !== undefined) {
      if (isNaN(Number(precio)) || Number(precio) < 0) {
        return res.status(400).json({
          success: false,
          message: "El precio debe ser un número igual o mayor a 0.",
        });
      }
      camposActualizar.precio = Number(precio);
    }

    if (stock !== undefined) {
      if (isNaN(Number(stock)) || Number(stock) < 0) {
        return res.status(400).json({
          success: false,
          message: "El stock debe ser un entero mayor o igual a 0.",
        });
      }
      camposActualizar.stock = Math.floor(Number(stock));
    }

    if (categoria !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(categoria)) {
        return res.status(400).json({
          success: false,
          message: "El ID de categoría es inválido.",
        });
      }
      const catExiste = await Categoria.findById(categoria);
      if (!catExiste) {
        return res.status(404).json({
          success: false,
          message: `La categoría con ID '${categoria}' no existe.`,
        });
      }
      camposActualizar.categoria = categoria;
    }

    if (marca !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(marca)) {
        return res.status(400).json({
          success: false,
          message: "El ID de marca es inválido.",
        });
      }
      const marcaExiste = await Marca.findById(marca);
      if (!marcaExiste) {
        return res.status(404).json({
          success: false,
          message: `La marca con ID '${marca}' no existe.`,
        });
      }
      camposActualizar.marca = marca;
    }

    if (especificaciones !== undefined) {
      camposActualizar.especificaciones = especificaciones;
    }

    if (imagenes !== undefined && Array.isArray(imagenes)) {
      camposActualizar.imagenes = imagenes;
    }

    if (garantiaMeses !== undefined) {
      camposActualizar.garantiaMeses = Number(garantiaMeses);
    }

    if (activo !== undefined) {
      camposActualizar.activo = Boolean(activo);
    }

    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      camposActualizar,
      { new: true, runValidators: true }
    )
      .populate("categoria", "nombre")
      .populate("marca", "nombre");

    if (!productoActualizado) {
      return res.status(404).json({
        success: false,
        message: `Producto con ID '${id}' no encontrado.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Producto actualizado exitosamente.",
      data: productoActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ajustar o actualizar stock de un producto (inventario)
 * Body: { cantidad: number, operacion: 'set' | 'increment' | 'decrement' }
 */
export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cantidad, operacion = "set" } = req.body;

    if (cantidad === undefined || isNaN(Number(cantidad)) || Number(cantidad) < 0) {
      return res.status(400).json({
        success: false,
        message: "Debe indicar una 'cantidad' numérica mayor o igual a 0.",
      });
    }

    const cantEntera = Math.floor(Number(cantidad));
    const producto = await Producto.findById(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: `Producto con ID '${id}' no encontrado.`,
      });
    }

    let nuevoStock = producto.stock;
    if (operacion === "set") {
      nuevoStock = cantEntera;
    } else if (operacion === "increment") {
      nuevoStock += cantEntera;
    } else if (operacion === "decrement") {
      if (producto.stock - cantEntera < 0) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Stock actual: ${producto.stock}, solicitado descontar: ${cantEntera}.`,
        });
      }
      nuevoStock -= cantEntera;
    } else {
      return res.status(400).json({
        success: false,
        message: "La operación debe ser 'set', 'increment' o 'decrement'.",
      });
    }

    producto.stock = nuevoStock;
    await producto.save();

    res.status(200).json({
      success: true,
      message: `Stock actualizado a ${nuevoStock} unidades.`,
      data: {
        id: producto._id,
        nombre: producto.nombre,
        sku: producto.sku,
        stock: producto.stock,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar o desactivar un producto
 * Query param opcional: ?fisico=true
 */
export const deleteProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fisico } = req.query;

    if (fisico === "true") {
      const eliminado = await Producto.findByIdAndDelete(id);
      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID '${id}' no encontrado.`,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Producto eliminado permanentemente de la base de datos.",
        data: eliminado,
      });
    }

    // Eliminación lógica
    const desactivado = await Producto.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!desactivado) {
      return res.status(404).json({
        success: false,
        message: `Producto con ID '${id}' no encontrado.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Producto desactivado exitosamente (baja lógica).",
      data: desactivado,
    });
  } catch (error) {
    next(error);
  }
};
