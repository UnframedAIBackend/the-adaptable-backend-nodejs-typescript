import { test, beforeEach, afterEach, suite } from "node:test";
import assert from "node:assert";

import { NoteRepository } from "@core/features/note/noteRepository";

suite("Testing Note repository",  () => {
  let repository: NoteRepository;

  beforeEach( () => {
    repository = new NoteRepository();
  });
  test("Get a list of existing notes", async () => {
    const notes = await repository.findAll();
    assert.equal(Array.isArray(notes), true);
  });

  afterEach(async () => {
    await repository.closeConnection();
  });
});
