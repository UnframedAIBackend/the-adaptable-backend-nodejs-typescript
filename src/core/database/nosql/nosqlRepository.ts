import {
  Collection, Filter,
  MongoClient, ObjectId, OptionalUnlessRequiredId, UpdateFilter,
} from "mongodb";

import {BaseEntity} from "@core/database/BaseEntity";
import { CreatePayload, IRepository, UpdatePayload} from "@core/database/IRepository";
import { config } from "src/core/configuration/configuration";

export class NoSQLRepository<Entity extends BaseEntity> implements IRepository<Entity> {
  private readonly tableName: string;
  private client: MongoClient;
  protected collection: Collection<Entity>;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.client = new MongoClient(config.get("DATABASE_URL"));
    this.collection = this.client.db().collection<Entity>(this.tableName);
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.client.on("error", (error) => {
        console.error("MongoDB connection error:", error);
      });
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  }

  async create(data: CreatePayload<Entity>): Promise<Entity> {
    const now = new Date();
    const documentToInsert = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(
      documentToInsert as OptionalUnlessRequiredId<Entity>
    );

    return {
      id: result.insertedId.toHexString(),
      ...documentToInsert,
    } as Entity;
  }

  async findById(id: string | number): Promise<Entity | null> {
    const query: Filter<Entity> = { _id: new ObjectId(id) } as Filter<Entity>;
    const result = await this.collection.findOne(query);

    if (!result) {
      return null;
    }
    const { _id, ...rest } = result as any;
    return { id: _id.toHexString(), ...rest } as Entity;
  }

  async findAll(): Promise<Entity[]> {
    const result = await this.collection.find<Entity>({}).toArray();
    return result.map((item) => {
      const { _id, ...rest } = item as any;
      return { id: _id.toHexString(), ...rest } as Entity;
    });
  }

  async update(id: string | number, data: UpdatePayload<Entity>): Promise<Entity | null> {
    const query: Filter<Entity> = { _id: new ObjectId(id) } as Filter<Entity>;
    const updateDocument: UpdateFilter<Entity> = {
      $set: {
        ...data,
        updatedAt: new Date(),
      } as Partial<Entity>,
    };

    const result = await this.collection.findOneAndUpdate(
      query,
      updateDocument,
      { returnDocument: 'after' }
    );

    if (!result) {
      return null;
    }

    const { _id, ...rest } = result as any;
    return { id: _id.toHexString(), ...rest } as Entity;
  }

  async delete(id: string | number): Promise<boolean> {
    const query: Filter<Entity> = { _id: new ObjectId(id) } as Filter<Entity>;
    const result = await this.collection.deleteOne(query);
    return result.deletedCount > 0;
  }

  async closeConnection(): Promise<void> {
    await this.client.close();
  }
}
