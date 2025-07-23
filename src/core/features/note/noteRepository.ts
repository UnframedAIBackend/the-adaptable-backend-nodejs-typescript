import {CreatePayload, IRepository, UpdatePayload} from "@core/database/IRepository";
import {Note} from "@core/features/note/note";
import { config } from "src/core/configuration/configuration";
import {SQLRepository} from "@core/database/sql/sqlRepository";
import {DatabaseEngine} from "@core/database/databaseEngine";
import {NoSQLRepository} from "@core/database/nosql/nosqlRepository";

export class NoteRepository implements IRepository<Note> {
  private DB_COLLECTION_NAME = "notes";
  private repository: IRepository<Note>;

  constructor() {
    const dbEngine = config.get("DATABASE_ENGINE");

    if (dbEngine === DatabaseEngine.SQL) {
      this.repository = new SQLRepository<Note>(this.DB_COLLECTION_NAME);
    } else if (dbEngine === DatabaseEngine.NOSQL) {
      this.repository = new NoSQLRepository<Note>(this.DB_COLLECTION_NAME);
    }
  }

  findAll(): Promise<Note[]> {
    return this.repository.findAll();
  }

  create(data: CreatePayload<Note, "timesSent">): Promise<Note> {
    return this.repository.create(data);
  }

  delete(id: string | number): Promise<boolean> {
    return this.repository.delete(id);
  }

  findById(id: string | number): Promise<Note | null> {
    return this.repository.findById(id);
  }

  update(id: string | number, data: UpdatePayload<Note, "timesSent">): Promise<Note | null> {
    return this.repository.update(id, data);
  }

  closeConnection(): Promise<void> {
    return this.repository.closeConnection();
  }
}
