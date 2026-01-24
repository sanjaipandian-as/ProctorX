require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { runJob } = require("./runner");
const { ensureTmpRoot } = require("./utils");

const app = express();

// Robust CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://proctorxofficial.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));


app.use(bodyParser.json({ limit: "1mb" }));

app.get('/', (req, res) => {
  res.send('ProctorX Backend is Running!');
});

if (process.env.TMP_ROOT) {
  ensureTmpRoot();
} else {
  console.warn("WARNING: TMP_ROOT not defined in environment.");
}

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
