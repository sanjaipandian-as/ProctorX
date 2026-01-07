require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { runJob } = require("./runner");
const { ensureTmpRoot } = require("./utils");


console.log("TMP_ROOT =", process.env.TMP_ROOT);

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json({ limit: "1mb" }));
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
