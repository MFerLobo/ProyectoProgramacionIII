import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../server.js";
import { initTestDB } from "./setup.js";

describe("Modulo de Middlewares, Salud y Errores - Tests de Metodos", () => {
  before(async () => {
    await initTestDB();
  });

  describe("Middleware: validateObjectId", () => {
    it("Debe interceptar parametros con formato no valido de Mongo y retornar 400 sin caerse", async () => {
      const res = await request(app).get("/api/productos/no-es-un-id-valido");
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /no es un ObjectId válido de MongoDB/i);
    });
  });

  describe("Middleware: notFoundHandler (404)", () => {
    it("Debe responder con JSON estructurado 404 al consultar una URL inexistente", async () => {
      const res = await request(app).get("/api/esta-ruta-no-existe-en-el-backend");
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Ruta no encontrada/i);
    });
  });

  describe("Endpoints de Salud y Base", () => {
    it("GET / debe retornar informacion general de la aplicacion (200 OK)", async () => {
      const res = await request(app).get("/");
      assert.equal(res.status, 200);
      assert.ok(res.body.nombre);
      assert.ok(res.body.documentacion);
    });

    it("GET /api/health debe retornar estado conectado de MongoDB y moneda ARS (200 OK)", async () => {
      const res = await request(app).get("/api/health");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.moneda, "ARS");
      assert.equal(res.body.database.status, "conectado");
    });
  });
});
