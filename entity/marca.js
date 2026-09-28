import mongoose from "mongoose";

const marcaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la marca es obligatorio."],
      unique: true,
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres."],
      maxlength: [50, "El nombre no puede exceder los 50 caracteres."],
    },
    paisOrigen: {
      type: String,
      trim: true,
      default: "",
    },
    sitioWeb: {
      type: String,
      trim: true,
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


const Marca = mongoose.model("Marca", marcaSchema);

export default Marca;
