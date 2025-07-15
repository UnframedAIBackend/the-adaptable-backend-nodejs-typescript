import { NestServerFactory } from "./frameworks/nestjs/nestServerFactory";

export class Server {
  private static servers = {
    nestjs: NestServerFactory,
  };

  private server;

  async run({ port }: { port: number }) {
    const framework = "nestjs";
    this.server = await Server.servers[framework].create();
    await this.server.listen(port);
    console.info(`Server running on ${await this.getUrl()}`);
  }

  async getUrl() {
    return this.server.getUrl()
  }

  async close() {
    await this.server.close();
    console.warn("Server closed");
  }
}