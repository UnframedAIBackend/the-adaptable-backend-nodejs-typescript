import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";

import { NoteDto } from "./note.dto";

@Controller("notes")
export class NoteRestController {

  @Get()
  @ApiOkResponse({
    type: [NoteDto],
    description: "Get all notes",
  })
  public getNotes(): NoteDto[] {
    return [
        {
            id: 1,
            content: "Hello 1"
        },
        {
            id: 2,
            content: "Hello 2"
        },
    ];
  }
}