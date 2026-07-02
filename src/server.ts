import http from "http";

const port = Number(process.env.PORT ?? 3000);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("API Shield Rate Limit\n");
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
