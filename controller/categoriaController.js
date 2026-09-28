import Categoria from "../entity/categoria.js";
import Producto from "../entity/producto.js";

/**
 * Obtener todas las categorías
 * Query params opcionales: ?activo=true|false
 */
export const getCategorias = async (req, res, next) => {
  try {
    const { activo } = req.query;
    const filtro = {};

    if (activo !== undefined) {
      filtro.activo = activo === "true";
    }

    const categorias = await Categoria.find(filtro).sort({ nombre: 1 });

    res.status(200).json({
      success: true,
      count: categorias.length,
      data: categorias,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener una categoría por ID
 */
export const getCategoriaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findById(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: `Categoría con ID '${id}' no encontrada.`,
      });
    }

    res.status(200).json({
      success: true,
      data: categoria,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear una nueva categoría
 */
export const createCategoria = async (req, res, next) => {
  try {
    const { nombre, descripcion, activo } = req.body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: "El campo 'nombre' es obligatorio y debe ser un texto.",
      });
    }

    const nuevaCategoria = await Categoria.create({
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : "",
      activo: activo !== undefined ? Boolean(activo) : true,
    });

    res.status(201).json({
      success: true,
      message: "Categoría creada exitosamente.",
      data: nuevaCategoria,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar una categoría por ID
 */
export const updateCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

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
    if (descripcion !== undefined) {
      camposActualizar.descripcion = descripcion.trim();
    }
    if (activo !== undefined) {
      camposActualizar.activo = Boolean(activo);
    }

    const categoriaActualizada = await Categoria.findByIdAndUpdate(
      id,
      camposActualizar,
      { new: true, runValidators: true }
    );

    if (!categoriaActualizada) {
      return res.status(404).json({
        success: false,
        message: `Categoría con ID '${id}' no encontrada.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Categoría actualizada exitosamente.",
      data: categoriaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar o desactivar una categoría
 * Query param opcional: ?fisico=true para eliminación permanente
 */
export const deleteCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fisico } = req.query;

    // Verificar si existen productos asociados a esta categoría
    const productosAsociados = await Producto.countDocuments({ categoria: id });

    if (productosAsociados > 0 && fisico === "true") {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque existen ${productosAsociados} producto(s) asociado(s). Se recomienda desactivarla.`,
      });
    }

    if (fisico === "true") {
      const eliminada = await Categoria.findByIdAndDelete(id);
      if (!eliminada) {
        return res.status(404).json({
          success: false,
          message: `Categoría con ID '${id}' no encontrada.`,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Categoría eliminada permanentemente.",
        data: eliminada,
      });
    }

    // Eliminación lógica (desactivar)
    const desactivada = await Categoria.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!desactivada) {
      return res.status(404).json({
        success: false,
        message: `Categoría con ID '${id}' no encontrada.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Categoría desactivada exitosamente (baja lógica).",
      data: desactivada,
    });
  } catch (error) {
    next(error);
  }
};
