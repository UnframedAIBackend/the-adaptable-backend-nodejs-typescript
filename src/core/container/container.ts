import { NoteController } from '@core/features/note/noteController';
import { createContainer, asClass, InjectionMode } from 'awilix';

export const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

container.register({
  noteController: asClass(NoteController).singleton(),
});
