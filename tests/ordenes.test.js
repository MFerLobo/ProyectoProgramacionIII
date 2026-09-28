import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../server.js";
import { initTestDB, getTestTokens } from "./setup.js";
import Producto from "../entity/producto.js";
import Usuario from "../entity/usuario.js";

describe("Modulo de Compras y Ordenes (/api/ordenes) - Tests de Metodos", () => {
  let tokens;
  let productoEnVenta;
  let ordenCreadaId;

  before(async () => {
    await initTestDB();
    tokens = await getTestTokens();

    // Obtener un producto activo con stock para probar la compra
    productoEnVenta = await Producto.findOne({ activo: true, stock: { $gt: 5 } });
    if (!productoEnVenta) {
      productoEnVenta = await Producto.create({
        nombre: "RAM Prueba Compra",
        sku: `RAM-COMPRA-${Date.now()}`,
        precio: 85000,
        stock: 20,
        categoria: "507f1f77bcf86cd799439011",
        marca: "507f1f77bcf86cd799439011",
      });
    }
  });

  describe("Metodo: crearCompra() [POST /api/ordenes]", () => {
    it("Debe permitir al 'cliente' realizar una compra, descontar stock y totalizar en ARS (201 Created)", async () => {
      const stockAntes = productoEnVenta.stock;
      const unidadesCompradas = 2;

      const res = await request(app)
        .post("/api/ordenes")
        .set("Authorization", `Bearer ${tokens.clienteToken}`)
        .send({
          items: [
            {
              productoId: productoEnVenta._id,
              cantidad: unidadesCompradas,
            },
          ],
          metodoPago: "transferencia",
          direccionEnvio: {
            calle: "Av. Congreso 3400",
            ciudad: "CABA",
            provincia: "Buenos Aires",
            codigoPostal: "C1430",
          },
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.moneda, "ARS");
      assert.equal(res.body.data.total, productoEnVenta.precio * unidadesCompradas);
      ordenCreadaId = res.body.data._id;

      // Verificar que el stock haya bajado en la base de datos
      const prodActualizado = await Producto.findById(productoEnVenta._id);
      assert.equal(
        prodActualizado.stock,
        stockAntes - unidadesCompradas,
        "El stock debe descontarse atómicamente"
      );
    });

    it("Debe rechazar con 400 si la cantidad solicitada supera el stock disponible", async () => {
      const prod = await Producto.findById(productoEnVenta._id);
      const res = await request(app)
        .post("/api/ordenes")
        .set("Authorization", `Bearer ${tokens.clienteToken}`)
        .send({
          items: [
            {
              productoId: productoEnVenta._id,
              cantidad: prod.stock + 999, // Supera stock
            },
          ],
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /stock insuficiente/i);
    });

    it("Debe rechazar con 400 si la orden no incluye lista de items", async () => {
      const res = await request(app)
        .post("/api/ordenes")
        .set("Authorization", `Bearer ${tokens.clienteToken}`)
        .send({ items: [] });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /debe incluir una lista/i);
    });
  });

  describe("Metodo: getMisCompras() [GET /api/ordenes/mis-compras]", () => {
    it("Debe retornar las compras del cliente autenticado (200 OK)", async () => {
      const res = await request(app)
        .get("/api/ordenes/mis-compras")
        .set("Authorization", `Bearer ${tokens.clienteToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 1, "Debe tener al menos la orden recién creada");
    });
  });

  describe("Metodo: getCompraById() [GET /api/ordenes/:id]", () => {
    it("Debe permitir al cliente ver el detalle de su propia orden (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/ordenes/${ordenCreadaId}`)
        .set("Authorization", `Bearer ${tokens.clienteToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data._id, ordenCreadaId);
    });

    it("Debe denegar con 403 a otro cliente que intente ver una orden ajena", async () => {
      // Crear un segundo cliente distinto
      const otroCliente = await Usuario.create({
        nombre: "Segundo Cliente",
        email: `cliente_ajeno_${Date.now()}@test.com`,
        password: "Password123!",
        rol: "cliente",
      });
      const otroToken = otroCliente.generarJWT();

      const res = await request(app)
        .get(`/api/ordenes/${ordenCreadaId}`)
        .set("Authorization", `Bearer ${otroToken}`);

      assert.equal(res.status, 403);
      assert.match(res.body.message, /no tiene permisos/i);
    });
  });

  describe("Metodo: getTodasLasCompras() [GET /api/ordenes]", () => {
    it("Debe permitir a un 'empleado' o 'admin' consultar todas las compras de la tienda", async () => {
      const res = await request(app)
        .get("/api/ordenes")
        .set("Authorization", `Bearer ${tokens.empleadoToken}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
    });

    it("Debe denegar el acceso a un 'cliente' (403 Forbidden)", async () => {
      const res = await request(app)
        .get("/api/ordenes")
        .set("Authorization", `Bearer ${tokens.clienteToken}`);

      assert.equal(res.status, 403);
    });
  });

  describe("Metodo: cambiarEstadoCompra() [PATCH /api/ordenes/:id/estado]", () => {
    it("Debe permitir a un 'empleado' cambiar el estado de la compra a 'enviado'", async () => {
      const res = await request(app)
        .patch(`/api/ordenes/${ordenCreadaId}/estado`)
        .set("Authorization", `Bearer ${tokens.empleadoToken}`)
        .send({ estado: "enviado" });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.estado, "enviado");
    });

    it("Al cambiar el estado a 'cancelado', debe reintegrar el stock a los productos", async () => {
      const prodAntesCancelar = await Producto.findById(productoEnVenta._id);
      const stockAntesCancelar = prodAntesCancelar.stock;

      const res = await request(app)
        .patch(`/api/ordenes/${ordenCreadaId}/estado`)
        .set("Authorization", `Bearer ${tokens.adminToken}`)
        .send({ estado: "cancelado" });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.estado, "cancelado");

      // Verificar que el stock se haya reintegrado (+2 unidades compradas)
      const prodDespues = await Producto.findById(productoEnVenta._id);
      assert.equal(
        prodDespues.stock,
        stockAntesCancelar + 2,
        "El stock debe reintegrarse al cancelar"
      );
    });

    it("Debe rechazar con 400 si el estado no es valido", async () => {
      const res = await request(app)
        .patch(`/api/ordenes/${ordenCreadaId}/estado`)
        .set("Authorization", `Bearer ${tokens.empleadoToken}`)
        .send({ estado: "estado_inventado" });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /inválido/i);
    });
  });
});
