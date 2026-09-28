import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../server.js";
import { initTestDB, getTestTokens } from "./setup.js";
import Usuario from "../entity/usuario.js";

describe("Modulo de Usuarios y Roles (/api/usuarios) - Tests de Metodos", () => {
  let tokens;
  let usuarioCreadoId;
  const emailUserTest = `gestionar_user_${Date.now()}@computech.com`;

  before(async () => {
    await initTestDB();
    tokens = await getTestTokens();
  });

  describe("Metodo: getUsuarios() [GET /api/usuarios]", () => {
    it("Debe permitir al 'admin' listar todos los usuarios (200 OK)", async () => {
      const res = await request(app)
        .get("/api/usuarios")
        .set("Authorization", `Bearer ${tokens.adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });

    it("Debe denegar el acceso a un 'empleado' (403 Forbidden)", async () => {
      const res = await request(app)
        .get("/api/usuarios")
        .set("Authorization", `Bearer ${tokens.empleadoToken}`);

      assert.equal(res.status, 403);
    });

    it("Debe denegar el acceso a un 'cliente' (403 Forbidden)", async () => {
      const res = await request(app)
        .get("/api/usuarios")
        .set("Authorization", `Bearer ${tokens.clienteToken}`);

      assert.equal(res.status, 403);
    });
  });

  describe("Metodo: createUsuario() [POST /api/usuarios]", () => {
    it("Debe permitir al 'admin' registrar un usuario con rol 'empleado' y clave hasheada (201 Created)", async () => {
      const res = await request(app)
        .post("/api/usuarios")
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({
          nombre: "Nuevo Empleado Asignado",
          email: emailUserTest,
          password: "EmpleadoPass123!",
          rol: "empleado",
          telefono: "+54 11 9999-8888",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.rol, "empleado");
      assert.equal(res.body.data.email, emailUserTest);
      usuarioCreadoId = res.body.data.id;
    });

    it("Debe rechazar con 400 si faltan nombre, email o password", async () => {
      const res = await request(app)
        .post("/api/usuarios")
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({ nombre: "Incompleto" });

      assert.equal(res.status, 400);
    });
  });

  describe("Metodo: getUsuarioById() [GET /api/usuarios/:id]", () => {
    it("Debe permitir al 'admin' consultar detalle de cualquier usuario (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/usuarios/${usuarioCreadoId}`)
        .set("Authorization", `Bearer ${tokens.adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data._id, usuarioCreadoId);
      assert.equal(res.body.data.password, undefined, "No debe incluir hash de password");
    });
  });

  describe("Metodo: updateUsuario() [PUT /api/usuarios/:id]", () => {
    it("Debe permitir al 'admin' cambiar el rol de un usuario de 'empleado' a 'admin' (200 OK)", async () => {
      const res = await request(app)
        .put(`/api/usuarios/${usuarioCreadoId}`)
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({ rol: "admin" });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.rol, "admin");
    });

    it("Debe rechazar con 400 si se intenta asignar un rol no valido", async () => {
      const res = await request(app)
        .put(`/api/usuarios/${usuarioCreadoId}`)
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({ rol: "super_sayayin" });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /rol.*inválido/i);
    });
  });

  describe("Metodo: deleteUsuario() [DELETE /api/usuarios/:id]", () => {
    it("Debe impedir que el 'admin' se elimine a si mismo mientras esta en sesion (400 Bad Request)", async () => {
      const res = await request(app)
        .delete(`/api/usuarios/${tokens.adminUser._id}`)
        .set("Authorization", `Bearer ${tokens.adminToken}`);

      assert.equal(res.status, 400);
      assert.match(res.body.message, /no puede eliminar su propia cuenta/i);
    });

    it("Debe permitir al 'admin' dar de baja logica a otro usuario (200 OK)", async () => {
      const res = await request(app)
        .delete(`/api/usuarios/${usuarioCreadoId}`)
        .set("Authorization", `Bearer ${tokens.adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.activo, false, "El usuario debe quedar inactivo");
    });
  });
});
