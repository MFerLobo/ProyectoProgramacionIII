import Marca from "../entity/marca.js";
import Producto from "../entity/producto.js";

/**
 * Obtener todas las marcas
 * Query params opcionales: ?activo=true|false
 */
export const getMarcas = async (req, res, next) => {
  try {
    const { activo } = req.query;
    const filtro = {};

    if (activo !== undefined) {
      filtro.activo = activo === "true";
    }

    const marcas = await Marca.find(filtro).sort({ nombre: 1 });

    res.status(200).json({
      success: true,
      count: marcas.length,
      data: marcas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener una marca por ID
 */
export const getMarcaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const marca = await Marca.findById(id);

    if (!marca) {
      return res.status(404).json({
        success: false,
        message: `Marca con ID '${id}' no encontrada.`,
      });
    }

    res.status(200).json({
      success: true,
      data: marca,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear una nueva marca
 */
export const createMarca = async (req, res, next) => {
  try {
    const { nombre, paisOrigen, sitioWeb, activo } = req.body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: "El campo 'nombre' es obligatorio y debe ser un texto.",
      });
    }

    const nuevaMarca = await Marca.create({
      nombre: nombre.trim(),
      paisOrigen: paisOrigen ? paisOrigen.trim() : "",
      sitioWeb: sitioWeb ? sitioWeb.trim() : "",
      activo: activo !== undefined ? Boolean(activo) : true,
    });

    res.status(201).json({
      success: true,
      message: "Marca creada exitosamente.",
      data: nuevaMarca,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar una marca por ID
 */
export const updateMarca = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, paisOrigen, sitioWeb, activo } = req.body;

    const camposActualizar = {};
    if (nombre !== undefined) {
      if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).json({
          success: false,
          message: "El campo 'nombre' no puede estar vacío.",
        });
      }
      camposActualizar.nombre = nombre.trim();
    }
    if (paisOrigen !== undefined) {
      camposActualizar.paisOrigen = paisOrigen.trim();
    }
    if (sitioWeb !== undefined) {
      camposActualizar.sitioWeb = sitioWeb.trim();
    }
    if (activo !== undefined) {
      camposActualizar.activo = Boolean(activo);
    }

    const marcaActualizada = await Marca.findByIdAndUpdate(
      id,
      camposActualizar,
      { new: true, runValidators: true }
    );

    if (!marcaActualizada) {
      return res.status(404).json({
        success: false,
        message: `Marca con ID '${id}' no encontrada.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Marca actualizada exitosamente.",
      data: marcaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar o desactivar una marca
 * Query param opcional: ?fisico=true
 */
export const deleteMarca = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fisico } = req.query;

    const productosAsociados = await Producto.countDocuments({ marca: id });

    if (productosAsociados > 0 && fisico === "true") {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la marca porque existen ${productosAsociados} producto(s) asociado(s). Se recomienda desactivarla.`,
      });
    }

    if (fisico === "true") {
      const eliminada = await Marca.findByIdAndDelete(id);
      if (!eliminada) {
        return res.status(404).json({
          success: false,
          message: `Marca con ID '${id}' no encontrada.`,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Marca eliminada permanentemente.",
        data: eliminada,
      });
    }

    const desactivada = await Marca.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!desactivada) {
      return res.status(404).json({
        success: false,
        message: `Marca con ID '${id}' no encontrada.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Marca desactivada exitosamente (baja lógica).",
      data: desactivada,
    });
  } catch (error) {
    next(error);
  }
};
