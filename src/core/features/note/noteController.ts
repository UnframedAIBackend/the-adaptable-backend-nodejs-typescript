import {NoteRepository} from "@core/features/note/noteRepository";
import {Note} from "@core/features/note/note";
import {CreateNoteDto, ListNoteDto, UpdateNoteDto} from "@core/features/note/note.dto";

export class NoteController {

  constructor(private noteRepository: NoteRepository) {}

  async getNotes(): Promise<ListNoteDto[]> {
    const result = await this.noteRepository.findAll();
    return result.map((note: Note) => {
      return {
        id: note.id, content: note.content
      };
    });
  }

  async createNote(payload: CreateNoteDto): Promise<void> {
    await this.noteRepository.create(payload);
  }

  async updateNote(id: string | number, payload: UpdateNoteDto): Promise<void> {
    await this.noteRepository.update(id, payload);
  }

  async deleteNote(id: string | number): Promise<void> {
    await this.noteRepository.delete(id);
  }
}
