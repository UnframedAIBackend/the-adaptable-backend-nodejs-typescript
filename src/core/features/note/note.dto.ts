export class CreateNoteDto {
  content: string;
}

export class UpdateNoteDto extends CreateNoteDto {}

export class ListNoteDto extends CreateNoteDto {
  id: string | number;
}

