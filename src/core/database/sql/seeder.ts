import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { Client } from "pg";

import { config } from "src/core/configuration/configuration";

export class Seeder {
  private static SEEDER_FOLDER = "src/core/database/sql/seeders";
  private static readonly SEEDER_PATH = resolve(process.cwd(), Seeder.SEEDER_FOLDER);

  static async run() {
    const dbConnection = new Client({
      connectionString: config.get("DATABASE_URL"),
    });
    console.log("Running seeders... ");
    const files = readdirSync(Seeder.SEEDER_PATH);

    try {

      await dbConnection.connect();

      for (const file of files) {
        console.log(`Running seeder: ${file}`);
        const fileContent = readFileSync(`${Seeder.SEEDER_PATH}/${file}`, "utf8");
        await dbConnection.query(fileContent);
      }
    } catch (error) {
      console.error("error seeding: ", error);
    } finally {
      await dbConnection.end();
    }
  }
}

Seeder.run();
