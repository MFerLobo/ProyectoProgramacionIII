import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../server.js";
import { initTestDB, getTestTokens } from "./setup.js";
import Categoria from "../entity/categoria.js";
import Marca from "../entity/marca.js";

describe("Modulo de Productos (/api/productos) - Tests de Metodos", () => {
  let tokens;
  let categoriaId;
  let marcaId;
  let productoCreadoId;
  const skuTest = `TEST-GPU-${Date.now()}`;

  before(async () => {
    await initTestDB();
    tokens = await getTestTokens();

    // Obtener una categoria y marca existente para asociar
    const cat = await Categoria.findOne();
    categoriaId = cat ? cat._id : (await Categoria.create({ nombre: "Cat Prod Test" }))._id;

    const marca = await Marca.findOne();
    marcaId = marca ? marca._id : (await Marca.create({ nombre: "Marca Prod Test" }))._id;
  });

  describe("Metodo: getProductos() [GET /api/productos]", () => {
    it("Debe ser publico y retornar catalogo paginado con precios en ARS", async () => {
      const res = await request(app).get("/api/productos");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.pagination, "Debe incluir metadata de paginacion");
      assert.ok(Array.isArray(res.body.data));
    });

    it("Debe admitir busqueda por texto (?q=Ryzen)", async () => {
      const res = await request(app).get("/api/productos?q=Ryzen");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    it("Debe filtrar por rango de precios en ARS (?minPrecio=100000&maxPrecio=900000)", async () => {
      const res = await request(app).get("/api/productos?minPrecio=100000&maxPrecio=900000");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    it("Debe filtrar solo productos disponibles con stock mayor a cero (?enStock=true)", async () => {
      const res = await request(app).get("/api/productos?enStock=true");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  describe("Metodo: createProducto() [POST /api/productos]", () => {
    it("Debe permitir a un 'empleado' registrar un componente de PC con precio en ARS (201 Created)", async () => {
      const res = await request(app)
        .post("/api/productos")
        .set("Authorization", `Bearer ${tokens.empleadoToken}`)
        .send({
          nombre: "Placa de Video Test RTX 4060",
          sku: skuTest,
          precio: 450000, // en ARS
          stock: 15,
          categoria: categoriaId,
          marca: marcaId,
          especificaciones: { vram: "8GB", interfaz: "PCIe 4.0" },
          garantiaMeses: 24,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.precio, 450000);
      assert.equal(res.body.data.moneda, "ARS");
      productoCreadoId = res.body.data._id;
    });

    it("Debe denegar la creacion de productos a un usuario 'cliente' (403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/productos")
        .set("Authorization", `Bearer ${tokens.clienteToken}`)
        .send({ nombre: "GPU Fake", sku: "FAKE-1", precio: 100 });

      assert.equal(res.status, 403);
    });

    it("Debe rechazar con 404 si la categoria asociada no existe en la base de datos", async () => {
      const res = await request(app)
        .post("/api/productos")
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({
          nombre: "Test Cat Invalida",
          sku: `SKU-CAT-INV-${Date.now()}`,
          precio: 10000,
          stock: 5,
          categoria: "507f1f77bcf86cd799439011",
          marca: marcaId,
        });

      assert.equal(res.status, 404);
      assert.match(res.body.message, /categoría.*no existe/i);
    });

    it("Debe rechazar con 400 si el precio en ARS es negativo", async () => {
      const res = await request(app)
        .post("/api/productos")
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({
          nombre: "Test Precio Negativo",
          sku: `SKU-NEG-${Date.now()}`,
          precio: -500,
          stock: 5,
          categoria: categoriaId,
          marca: marcaId,
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /precio debe ser un número igual o mayor a 0/i);
    });

    it("Debe rechazar con 409 si el SKU ya existe en otro componente", async () => {
      const res = await request(app)
        .post("/api/productos")
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({
          nombre: "SKU Repetido",
          sku: skuTest,
          precio: 200000,
          categoria: categoriaId,
          marca: marcaId,
        });

      assert.equal(res.status, 409);
    });
  });

  describe("Metodo: getProductoById() [GET /api/productos/:id]", () => {
    it("Debe retornar el producto poblado con categoria y marca (200 OK)", async () => {
      const res = await request(app).get(`/api/productos/${productoCreadoId}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.data._id, productoCreadoId);
      assert.ok(res.body.data.categoria.nombre, "Debe incluir el populate de categoria");
      assert.ok(res.body.data.marca.nombre, "Debe incluir el populate de marca");
    });
  });

  describe("Metodo: updateStock() [PATCH /api/productos/:id/stock]", () => {
    it("Debe incrementar stock con operacion 'increment' (200 OK)", async () => {
      const res = await request(app)
        .patch(`/api/productos/${productoCreadoId}/stock`)
        .set("Authorization", `Bearer ${tokens.empleadoToken}`)
        .send({ cantidad: 5, operacion: "increment" });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.stock, 20); // 15 + 5
    });

    it("Debe decrementar stock con operacion 'decrement' (200 OK)", async () => {
      const res = await request(app)
        .patch(`/api/productos/${productoCreadoId}/stock`)
        .set("Authorization", `Bearer ${tokens.empleadoToken}`)
        .send({ cantidad: 3, operacion: "decrement" });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.stock, 17); // 20 - 3
    });

    it("Debe rechazar con 400 si el decremento supera el stock existente (evita stock negativo)", async () => {
      const res = await request(app)
        .patch(`/api/productos/${productoCreadoId}/stock`)
        .set("Authorization", `Bearer ${tokens.empleadoToken}`)
        .send({ cantidad: 50, operacion: "decrement" });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /stock insuficiente/i);
    });
  });

  describe("Metodo: updateProducto() [PUT /api/productos/:id]", () => {
    it("Debe permitir modificar precio y descripcion a un 'empleado' (200 OK)", async () => {
      const res = await request(app)
        .put(`/api/productos/${productoCreadoId}`)
        .set("Authorization", `Bearer ${tokens.empleadoToken}`)
        .send({ precio: 470000, descripcion: "Edicion OC actualizada" });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.precio, 470000);
    });
  });

  describe("Metodo: deleteProducto() [DELETE /api/productos/:id]", () => {
    it("Debe realizar baja logica (activo: false)", async () => {
      const res = await request(app)
        .delete(`/api/productos/${productoCreadoId}`)
        .set("Authorization", `Bearer ${tokens.adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.activo, false);
    });
  });
});
