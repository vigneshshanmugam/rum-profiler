const express = require("express");
const cors = require("cors");
const next = require("next");
const { storeTrace, getTrace } = require("./processor");

const port = parseInt(process.env.PORT, 10) || 8080;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  server.use(cors());

  server.post("/flamegraph", express.json({ limit: "3mb" }), (req, res) => {
    const { id } = req.query;
    const cacheKey = storeTrace(req.body, id);
    return res.end(`${cacheKey}`);
  });

  server.get("/trace/:id", async (req, res) => {
    const extractedCacheKey = req.params.id;
    const trace = getTrace(extractedCacheKey);
    const data = await app.render(req, res, "/trace", {
      flamegraphs: trace,
      id: extractedCacheKey
    });
    return res.end(data);
  });

  server.get("*", (req, res) => handle(req, res));

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
