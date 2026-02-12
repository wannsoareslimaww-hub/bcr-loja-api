const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 COLE AQUI SUA ACCESS TOKEN DE PRODUÇÃO
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-7425649175230181-020106-a1890d2c3534caa6d445823ec91a728c-145231534"
});

// Rota para criar pagamento
app.post("/criar-pagamento", async (req, res) => {
  try {
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: req.body.title,
            quantity: 1,
            unit_price: Number(req.body.price),
            currency_id: "BRL"
          }
        ]
      }
    });

    res.json({
      id: result.id,
      init_point: result.init_point
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = "CAMINHO_COMPLETO_PARA/database.sqlite";

const db = new sqlite3.Database(dbPath);

// Webhook Mercado Pago
app.post("/webhook", async (req, res) => {
  try {
    const paymentId = req.body.data?.id;
    if (!paymentId) return res.sendStatus(200);

    // aqui você consulta o pagamento no Mercado Pago
    // e verifica status === approved

    // EXEMPLO (mockado):
    const status = "approved";

    if (status === "approved") {
      db.run(
        `
        INSERT INTO mp_pedidos
        (payment_id, player_serial, produto_tipo, produto_nome, quantidade, status, data_compra)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `,
        [
          paymentId,
          "SERIAL_DO_JOGADOR",
          "vip",
          "VIP Ouro 30 dias",
          1,
          "approved"
        ]
      );
    }

    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});


app.listen(3000, () => {
  console.log("🔥 Loja rodando em http://localhost:3000");
});
