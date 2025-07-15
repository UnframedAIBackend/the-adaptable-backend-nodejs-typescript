import { Module } from "@nestjs/common";

import { NoteRestController } from "./restControllers/noteRestController";

@Module({
  controllers: [ NoteRestController ],
})
export class Route {}
