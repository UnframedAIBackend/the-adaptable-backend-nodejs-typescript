import { Body, Controller, Get, Post, Put, Delete, Param } from "@nestjs/common";
import {ApiOkResponse, ApiParam,} from "@nestjs/swagger";

import {CreateNoteDto, ListNoteDto, UpdateNoteDto} from "@core/features/note/note.dto";
import { NoteController } from "@core/features/note/noteController";
import { container } from "@core/container/container";
import {SuccessResponse} from "@restAPI/frameworks/responseTypes";

@Controller("notes")
export class NoteRestController {
  private noteController: NoteController;
  private static ID_PARAM_DETAIL = {
    name: "id",
    description: 'Unique identifier of note',
    type: String,
    required: true,
  };

  constructor() {
    this.noteController = container.resolve("noteController");
  }

  @Get()
  @ApiOkResponse({
    type: [ListNoteDto],
    description: "Get all notes",
  })
  async getNotes(): Promise<SuccessResponse<ListNoteDto[]>> {
    const results = await this.noteController.getNotes();
    return new SuccessResponse(results);
  }

  @Post()
  @ApiOkResponse()
  async createNote(@Body() payload: CreateNoteDto): Promise<void> {
    await this.noteController.createNote(payload);
  }

  @Put(`:${NoteRestController.ID_PARAM_DETAIL.name}`)
  @ApiParam(NoteRestController.ID_PARAM_DETAIL)
  @ApiOkResponse()
  async updateNote(@Param(NoteRestController.ID_PARAM_DETAIL.name) id: string | number, @Body() payload: UpdateNoteDto): Promise<void> {
    await this.noteController.updateNote(id, payload);
  }

  @Delete(`:${NoteRestController.ID_PARAM_DETAIL.name}`)
  @ApiParam(NoteRestController.ID_PARAM_DETAIL)
  @ApiOkResponse()
  async deleteNote(@Param(NoteRestController.ID_PARAM_DETAIL.name) id: string | number): Promise<void> {
    await this.noteController.deleteNote(id);
  }
}
