import { MongoClient } from "mongodb";

import { notes } from "@core/database/nosql/seeders/notes";
import { config } from "src/core/configuration/configuration";

export class Seeder {
  private static readonly seeders = [
    notes,
  ];

  static async run() {
    const dbConnection = new MongoClient(config.get("DATABASE_URL"));
    console.log("Running seeders... ");

    try {

      await dbConnection.connect();

      for (const seeder of Seeder.seeders) {
        const collection = dbConnection.db().collection(seeder.collection);
        console.log(`Running seeder: ${seeder.collection}`);
        await collection.insertMany(seeder.data);
      }
    } catch (error) {
      console.error("error seeding: ", error);
    } finally {
      await dbConnection.close();
    }
  }
}

Seeder.run();
