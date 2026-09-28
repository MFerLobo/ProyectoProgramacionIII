import mongoose from "mongoose";

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del producto es obligatorio."],
      trim: true,
      minlength: [3, "El nombre debe tener al menos 3 caracteres."],
      maxlength: [150, "El nombre no puede exceder los 150 caracteres."],
    },
    descripcion: {
      type: String,
      trim: true,
      default: "",
    },
    sku: {
      type: String,
      required: [true, "El código SKU es obligatorio."],
      unique: true,
      trim: true,
      uppercase: true,
    },
    precio: {
      type: Number,
      required: [true, "El precio en ARS es obligatorio."],
      min: [0, "El precio debe ser un valor igual o mayor a 0."],
    },
    moneda: {
      type: String,
      default: "ARS",
      uppercase: true,
      enum: {
        values: ["ARS"],
        message: "La moneda de la tienda debe ser ARS.",
      },
    },
    stock: {
      type: Number,
      required: [true, "El stock es obligatorio."],
      min: [0, "El stock no puede ser un número negativo."],
      validate: {
        validator: Number.isInteger,
        message: "El stock debe ser un número entero.",
      },
      default: 0,
    },
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categoria",
      required: [true, "La categoría del producto es obligatoria."],
    },
    marca: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Marca",
      required: [true, "La marca del producto es obligatoria."],
    },
    especificaciones: {
      type: Map,
      of: String,
      default: {},
    },
    imagenes: {
      type: [String],
      default: [],
    },
    garantiaMeses: {
      type: Number,
      min: [0, "La garantía no puede ser negativa."],
      default: 12,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices para búsquedas de texto y filtros
productoSchema.index({ nombre: "text", descripcion: "text" });
productoSchema.index({ categoria: 1, activo: 1 });
productoSchema.index({ marca: 1, activo: 1 });
productoSchema.index({ precio: 1 });

const Producto = mongoose.model("Producto", productoSchema);

export default Producto;
