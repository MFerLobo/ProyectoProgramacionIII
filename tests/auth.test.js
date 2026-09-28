import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../server.js";
import { initTestDB } from "./setup.js";
import Usuario from "../entity/usuario.js";

describe("Modulo de Autenticacion (/api/auth) - Tests de Metodos", () => {
  const emailRandom = `tester_${Date.now()}@computech.com`;

  before(async () => {
    await initTestDB();
  });

  describe("Metodo: register() [POST /api/auth/register]", () => {
    it("Debe registrar un nuevo usuario con rol 'cliente' y retornar un token JWT", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          nombre: "Nuevo Tester",
          email: emailRandom,
          password: "Password123!",
          telefono: "+54 11 0000-1111",
          direccion: {
            calle: "Av. Siempre Viva 742",
            ciudad: "CABA",
            provincia: "Buenos Aires",
            codigoPostal: "C1000",
          },
        });

      assert.equal(res.status, 201, "El status debe ser 201 Created");
      assert.equal(res.body.success, true);
      assert.ok(res.body.token, "Debe retornar una propiedad 'token'");
      assert.equal(res.body.usuario.rol, "cliente", "El rol por defecto debe ser 'cliente'");
      assert.equal(res.body.usuario.email, emailRandom.toLowerCase());
    });

    it("Debe rechazar con 400 si faltan campos obligatorios (nombre, email o password)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "incompleto@test.com" });

      assert.equal(res.status, 400, "Debe retornar 400 Bad Request");
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /obligatorios/i);
    });

    it("Debe rechazar con 400 si la contraseña tiene menos de 6 caracteres", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          nombre: "Pass Corto",
          email: `corto_${Date.now()}@test.com`,
          password: "123",
        });

      assert.equal(res.status, 400, "Debe retornar 400");
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /al menos 6 caracteres/i);
    });

    it("Debe rechazar con 409 si el correo ya se encuentra registrado (duplicado)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          nombre: "Duplicado",
          email: emailRandom,
          password: "Password123!",
        });

      assert.equal(res.status, 409, "Debe retornar 409 Conflict");
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /ya se encuentra registrado/i);
    });
  });

  describe("Metodo: login() [POST /api/auth/login]", () => {
    it("Debe iniciar sesion exitosamente con credenciales validas y retornar token", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: emailRandom,
          password: "Password123!",
        });

      assert.equal(res.status, 200, "Debe retornar 200 OK");
      assert.equal(res.body.success, true);
      assert.ok(res.body.token, "Debe contener el token JWT");
      assert.equal(res.body.usuario.email, emailRandom);
    });

    it("Debe rechazar con 401 si la contraseña es incorrecta", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: emailRandom,
          password: "PasswordErroneo!",
        });

      assert.equal(res.status, 401, "Debe retornar 401 Unauthorized");
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /credenciales inválidas/i);
    });

    it("Debe rechazar con 401 si el usuario no existe", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "no_existe_99999@computech.com",
          password: "Cualquiera123!",
        });

      assert.equal(res.status, 401, "Debe retornar 401 Unauthorized");
      assert.equal(res.body.success, false);
    });

    it("Debe rechazar con 400 si faltan email o password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: emailRandom });

      assert.equal(res.status, 400, "Debe retornar 400 Bad Request");
      assert.equal(res.body.success, false);
    });
  });

  describe("Metodo: getPerfil() [GET /api/auth/perfil]", () => {
    it("Debe retornar los datos del perfil si se envia un Bearer Token valido", async () => {
      // Login previo para obtener token
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: emailRandom, password: "Password123!" });

      const token = loginRes.body.token;

      const res = await request(app)
        .get("/api/auth/perfil")
        .set("Authorization", `Bearer ${token}`);

      assert.equal(res.status, 200, "Debe retornar 200 OK");
      assert.equal(res.body.success, true);
      assert.equal(res.body.usuario.email, emailRandom);
      assert.equal(res.body.usuario.password, undefined, "No debe exponer la contraseña");
    });

    it("Debe rechazar con 401 si no se incluye la cabecera de autorizacion", async () => {
      const res = await request(app).get("/api/auth/perfil");
      assert.equal(res.status, 401, "Debe retornar 401");
      assert.equal(res.body.success, false);
    });

    it("Debe rechazar con 401 si el token es falso o invalido", async () => {
      const res = await request(app)
        .get("/api/auth/perfil")
        .set("Authorization", "Bearer token_falso_invalido_123");

      assert.equal(res.status, 401, "Debe retornar 401");
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /token inválido/i);
    });
  });
});
