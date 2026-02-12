const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());

/* ======================
   MERCADO PAGO
====================== */
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

/* ======================
   SQLITE (LOCAL / TESTE)
====================== */
const dbPath = path.join(__dirname, "data", "database.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Erro ao abrir SQLite:", err.message);
  } else {
    console.log("✅ SQLite conectado:", dbPath);
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS mp_pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id TEXT,
    player_serial TEXT,
    produto_tipo TEXT,
    produto_nome TEXT,
    quantidade INTEGER,
    status TEXT,
    data_compra DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/* ======================
   ROTAS
====================== */

// Criar pagamento
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

// Webhook Mercado Pago
app.post("/webhook", async (req, res) => {
  try {
    const paymentId = req.body?.data?.id;
    if (!paymentId) return res.sendStatus(200);

    // ⚠️ aqui depois vamos CONSULTAR o MP de verdade
    const status = "approved";

    if (status === "approved") {
      db.run(
        `
        INSERT INTO mp_pedidos
        (payment_id, player_serial, produto_tipo, produto_nome, quantidade, status)
        VALUES (?, ?, ?, ?, ?, ?)
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

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Loja rodando na porta ${PORT}`);
});
