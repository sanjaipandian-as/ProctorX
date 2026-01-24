require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { runJob } = require("./runner");
const { ensureTmpRoot } = require("./utils");

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://proctorxofficial.vercel.app'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(bodyParser.json({ limit: "1mb" }));

app.get('/', (req, res) => {
  res.send('ProctorX Backend is Running!');
});

ensureTmpRoot();

app.post("/run", async (req, res) => {
  try {
    const payload = req.body;
    const result = await runJob(payload);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log("compiler service listening on", port);
});
