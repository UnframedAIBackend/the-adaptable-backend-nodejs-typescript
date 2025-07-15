import { NestFactory } from "@nestjs/core";
import { INestApplication } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

import { Route } from "./route";

export class NestServerFactory {
  static async create(): Promise<INestApplication> {
    const app = await NestFactory.create(Route);
    
    this.setupSwagger(app);
    
    return app;
  }
  
  private static setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
      .setTitle("AdaptNotes API")
      .setDescription("The AdaptNotes API documentation")
      .setVersion("1.0")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  }
}