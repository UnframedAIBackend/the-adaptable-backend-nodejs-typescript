import { NoteController } from '@core/features/note/noteController';
import { createContainer, asClass, InjectionMode } from 'awilix';
import {NoteRepository} from "@core/features/note/noteRepository";

export const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

container.register({
  /* Controllers */
  noteController: asClass(NoteController).singleton(),

  /* Repositories */
  noteRepository: asClass(NoteRepository).singleton(),
});
