import { Server } from "./server";
import { config } from "src/core/configuration/configuration";

const server = new Server();
server.run({ port: config.get("PORT") });

process.on("SIGINT", async () => {
  console.warn("Closing server");
  await server.close();
});