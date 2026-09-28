import Usuario from "../entity/usuario.js";

/**
 * Registro de nuevos usuarios (Signup)
 * Rol por defecto: 'cliente'
 */
export const register = async (req, res, next) => {
  try {
    const { nombre, email, password, telefono, direccion } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Los campos 'nombre', 'email' y 'password' son obligatorios.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    // Verificar si el correo ya existe
    const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (usuarioExistente) {
      return res.status(409).json({
        success: false,
        message: "El correo electrónico ya se encuentra registrado.",
      });
    }

    // Por seguridad, todo registro público es de tipo 'cliente'
    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password,
      rol: "cliente",
      telefono: telefono ? telefono.trim() : "",
      direccion: direccion || {},
    });

    const token = nuevoUsuario.generarJWT();

    res.status(201).json({
      success: true,
      message: "Usuario cliente registrado exitosamente.",
      token,
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        telefono: nuevoUsuario.telefono,
        direccion: nuevoUsuario.direccion,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Inicio de sesión (Login)
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor proporcione su correo y contraseña.",
      });
    }

    // Buscar usuario incluyendo el password que está excluido por defecto
    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas: Correo o contraseña incorrectos.",
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: "Su cuenta se encuentra inactiva. Contacte a un administrador.",
      });
    }

    const esPasswordValido = await usuario.compararPassword(password);
    if (!esPasswordValido) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas: Correo o contraseña incorrectos.",
      });
    }

    const token = usuario.generarJWT();

    res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso.",
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener perfil del usuario autenticado
 */
export const getPerfil = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      usuario: {
        id: req.usuario._id,
        nombre: req.usuario.nombre,
        email: req.usuario.email,
        rol: req.usuario.rol,
        telefono: req.usuario.telefono,
        direccion: req.usuario.direccion,
        activo: req.usuario.activo,
        createdAt: req.usuario.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
