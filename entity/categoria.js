import mongoose from "mongoose";

const categoriaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la categoría es obligatorio."],
      unique: true,
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres."],
      maxlength: [50, "El nombre no puede exceder los 50 caracteres."],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [300, "La descripción no puede exceder los 300 caracteres."],
      default: "",
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


const Categoria = mongoose.model("Categoria", categoriaSchema);

export default Categoria;
