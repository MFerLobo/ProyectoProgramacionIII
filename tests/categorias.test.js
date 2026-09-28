import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../server.js";
import { initTestDB, getTestTokens } from "./setup.js";
import Categoria from "../entity/categoria.js";

describe("Modulo de Categorias (/api/categorias) - Tests de Metodos", () => {
  let tokens;
  let categoriaCreadaId;
  const nombreCatTest = `Gabinete Test ${Date.now()}`;

  before(async () => {
    await initTestDB();
    tokens = await getTestTokens();
  });

  describe("Metodo: getCategorias() [GET /api/categorias]", () => {
    it("Debe ser una ruta publica que retorna la lista de categorias con codigo 200", async () => {
      const res = await request(app).get("/api/categorias");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data), "data debe ser un arreglo");
    });

    it("Debe admitir filtrado por estado activo (?activo=true)", async () => {
      const res = await request(app).get("/api/categorias?activo=true");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  describe("Metodo: createCategoria() [POST /api/categorias]", () => {
    it("Debe permitir crear categoria a un usuario con rol 'empleado' (201 Created)", async () => {
      const res = await request(app)
        .post("/api/categorias")
        .set("Authorization", `Bearer ${tokens.empleadoToken}`)
        .send({
          nombre: nombreCatTest,
          descripcion: "Gabinetes gamer para componentes de PC",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.nombre, nombreCatTest);
      categoriaCreadaId = res.body.data._id;
    });

    it("Debe prohibir la creacion a usuarios con rol 'cliente' (403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/categorias")
        .set("Authorization", `Bearer ${tokens.clienteToken}`)
        .send({ nombre: "Infiltrado", descripcion: "Desc" });

      assert.equal(res.status, 403, "Debe rechazar con 403");
      assert.equal(res.body.success, false);
    });

    it("Debe rechazar con 400 si el campo 'nombre' esta vacio o no se envia", async () => {
      const res = await request(app)
        .post("/api/categorias")
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({ descripcion: "Sin nombre" });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it("Debe rechazar con 409 si se intenta registrar una categoria con nombre repetido", async () => {
      const res = await request(app)
        .post("/api/categorias")
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({ nombre: nombreCatTest });

      assert.equal(res.status, 409, "Debe detectar clave duplicada");
      assert.equal(res.body.success, false);
    });
  });

  describe("Metodo: getCategoriaById() [GET /api/categorias/:id]", () => {
    it("Debe retornar el detalle de una categoria existente por su ID (200 OK)", async () => {
      const res = await request(app).get(`/api/categorias/${categoriaCreadaId}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data._id, categoriaCreadaId);
    });

    it("Debe responder 400 mediante validateObjectId si el ID tiene formato invalido", async () => {
      const res = await request(app).get("/api/categorias/formato-invalido-123");
      assert.equal(res.status, 400);
      assert.match(res.body.message, /no es un ObjectId válido/i);
    });

    it("Debe responder 404 si el ID tiene formato valido pero no existe en la BD", async () => {
      const idInexistente = "507f1f77bcf86cd799439011";
      const res = await request(app).get(`/api/categorias/${idInexistente}`);
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });
  });

  describe("Metodo: updateCategoria() [PUT /api/categorias/:id]", () => {
    it("Debe permitir actualizar la categoria a un usuario 'admin' o 'empleado'", async () => {
      const nuevoNombre = `${nombreCatTest} Modificado`;
      const res = await request(app)
        .put(`/api/categorias/${categoriaCreadaId}`)
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({ nombre: nuevoNombre });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.nombre, nuevoNombre);
    });

    it("Debe rechazar con 403 si un 'cliente' intenta modificarla", async () => {
      const res = await request(app)
        .put(`/api/categorias/${categoriaCreadaId}`)
        .set("Authorization", `Bearer ${tokens.clienteToken}`)
        .send({ nombre: "Hackeada" });

      assert.equal(res.status, 403);
    });
  });

  describe("Metodo: deleteCategoria() [DELETE /api/categorias/:id]", () => {
    it("Debe realizar baja logica (activo: false) por defecto", async () => {
      const res = await request(app)
        .delete(`/api/categorias/${categoriaCreadaId}`)
        .set("Authorization", `Bearer ${tokens.empleadoToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.activo, false, "Debe quedar desactivada");
    });

    it("Debe permitir baja fisica (?fisico=true) cuando no tiene productos asociados", async () => {
      const res = await request(app)
        .delete(`/api/categorias/${categoriaCreadaId}?fisico=true`)
        .set("Authorization", `Bearer ${tokens.adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.match(res.body.message, /eliminada permanentemente/i);
    });
  });
});
