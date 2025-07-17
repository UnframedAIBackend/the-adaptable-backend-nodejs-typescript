import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";

import { NoteDto } from "@core/features/note/note.dto";
import { NoteController } from "@core/features/note/noteController";
import { container } from "@core/container/container";

@Controller("notes")
export class NoteRestController {
  private noteController: NoteController;

  constructor() {
    this.noteController = container.resolve("noteController");
  }

  @Get()
  @ApiOkResponse({
    type: [NoteDto],
    description: "Get all notes",
  })
  public getNotes(): NoteDto[] {
    return this.noteController.getNotes();
  }
}