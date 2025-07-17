import { NestFactory } from "@nestjs/core";
import { INestApplication } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

import { Route } from "@restAPI/frameworks/nestjs/route";
import { RESTAPI_DESCRIPTION, RESTAPI_DOCS_PATH, RESTAPI_NAME, RESTAPI_VERSION } from "@restAPI/frameworks/constants";

export class NestServerFactory {
  static async create(): Promise<INestApplication> {
    const app = await NestFactory.create(Route);
    
    this.setupSwagger(app);
    
    return app;
  }
  
  private static setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
      .setTitle(RESTAPI_NAME)
      .setDescription(RESTAPI_DESCRIPTION)
      .setVersion(RESTAPI_VERSION)
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(RESTAPI_DOCS_PATH, app, document);
  }
}