import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../server.js";
import { initTestDB, getTestTokens } from "./setup.js";

describe("Modulo de Marcas (/api/marcas) - Tests de Metodos", () => {
  let tokens;
  let marcaCreadaId;
  const nombreMarca = `Gigabyte Test ${Date.now()}`;

  before(async () => {
    await initTestDB();
    tokens = await getTestTokens();
  });

  describe("Metodo: getMarcas() [GET /api/marcas]", () => {
    it("Debe retornar la lista publica de marcas fabricantes con codigo 200", async () => {
      const res = await request(app).get("/api/marcas");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });
  });

  describe("Metodo: createMarca() [POST /api/marcas]", () => {
    it("Debe permitir crear una marca a un 'empleado' (201 Created)", async () => {
      const res = await request(app)
        .post("/api/marcas")
        .set("Authorization", `Bearer ${tokens.empleadoToken}`)
        .send({
          nombre: nombreMarca,
          paisOrigen: "Taiwán",
          sitioWeb: "https://www.gigabyte.com",
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.nombre, nombreMarca);
      marcaCreadaId = res.body.data._id;
    });

    it("Debe denegar la creacion de marca a un usuario con rol 'cliente' (403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/marcas")
        .set("Authorization", `Bearer ${tokens.clienteToken}`)
        .send({ nombre: "Marca Denegada" });

      assert.equal(res.status, 403);
    });

    it("Debe rechazar con 400 si falta el campo obligatorio 'nombre'", async () => {
      const res = await request(app)
        .post("/api/marcas")
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({ paisOrigen: "EEUU" });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it("Debe rechazar con 409 si el nombre de la marca ya existe", async () => {
      const res = await request(app)
        .post("/api/marcas")
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({ nombre: nombreMarca });

      assert.equal(res.status, 409);
    });
  });

  describe("Metodo: getMarcaById() [GET /api/marcas/:id]", () => {
    it("Debe devolver el detalle de la marca por ID (200 OK)", async () => {
      const res = await request(app).get(`/api/marcas/${marcaCreadaId}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.data._id, marcaCreadaId);
    });

    it("Debe retornar 404 si el ID no existe", async () => {
      const res = await request(app).get("/api/marcas/507f1f77bcf86cd799439011");
      assert.equal(res.status, 404);
    });
  });

  describe("Metodo: updateMarca() [PUT /api/marcas/:id]", () => {
    it("Debe permitir modificar marca a un 'empleado' o 'admin' (200 OK)", async () => {
      const res = await request(app)
        .put(`/api/marcas/${marcaCreadaId}`)
        .set("Authorization", `Bearer ${tokens.empleadoToken}`)
        .send({ sitioWeb: "https://latam.gigabyte.com" });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.sitioWeb, "https://latam.gigabyte.com");
    });
  });

  describe("Metodo: deleteMarca() [DELETE /api/marcas/:id]", () => {
    it("Debe realizar baja logica (activo: false) de la marca", async () => {
      const res = await request(app)
        .delete(`/api/marcas/${marcaCreadaId}`)
        .set("Authorization", `Bearer ${tokens.adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.activo, false);
    });

    it("Debe permitir baja fisica con ?fisico=true", async () => {
      const res = await request(app)
        .delete(`/api/marcas/${marcaCreadaId}?fisico=true`)
        .set("Authorization", `Bearer ${tokens.adminToken}`);

      assert.equal(res.status, 200);
      assert.match(res.body.message, /eliminada permanentemente/i);
    });
  });
});
