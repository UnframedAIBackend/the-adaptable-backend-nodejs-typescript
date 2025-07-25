import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { Client } from "pg";

import { config } from "src/core/configuration/configuration";

export class Migrate {
  private static MIGRATIONS_FOLDER = "src/core/database/sql/migrations";
  private static readonly MIGRATIONS_PATH = resolve(process.cwd(), Migrate.MIGRATIONS_FOLDER);

  static async run() {
    const dbConnection = new Client({
      connectionString: config.get("DATABASE_URL"),
    });
    console.log("Running migrations... ");
    const files = readdirSync(Migrate.MIGRATIONS_PATH);

    try {

      await dbConnection.connect();

      for (const file of files) {
        console.log(`Running migration: ${file}`);
        const fileContent = readFileSync(`${Migrate.MIGRATIONS_PATH}/${file}`, "utf8");
        await dbConnection.query(fileContent);
      }
    } catch (error) {
      console.error("error in migrate: ", error);
    } finally {
      await dbConnection.end();
    }
  }
}

Migrate.run();
