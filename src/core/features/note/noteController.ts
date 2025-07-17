import { NoteDto } from "@core/features/note/note.dto";

export class NoteController {
    
  public getNotes(): NoteDto[] {
    return [
      {
        id: 1,
        content: "Hello 1 - from controller"
      },
      {
        id: 2,
        content: "Hello 2 - from controller"
      },
    ];
  }
}
