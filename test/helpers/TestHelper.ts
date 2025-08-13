import crypto from 'crypto';
import { Client } from 'pg';
import { MongoClient } from 'mongodb';

import { config } from '@core/configuration/configuration';


export type TestDBConfig = {
  dbName: string;
  dbUrl: string;
  dbEngine: string;
};

export type ParamTestDatabase = {
  prefix?: string;
  seed?: boolean;
}

export class TestHelper {
  private static dbConfig: TestDBConfig | null = null;

  static async setupTestDatabases(options: ParamTestDatabase): Promise<TestDBConfig> {
    const prefix = options?.prefix || 'test';
    const runSeeders = options?.seed ?? true;
  
    const testId = `${prefix}_${crypto.randomUUID().replace(/-/g, '_')}`;
    this.dbConfig.dbName = `${prefix}_${testId}`;
    this.dbConfig.dbUrl = config.get("DATABASE_URL").replace("[DB_NAME]", this.dbConfig.dbName);
    this.dbConfig.dbEngine = TestHelper.getDBEngine();
    
    /* implement strategy pattern to choose create NOsql & sql */
    return this.dbConfig;
  }

  static async teardownTestDatabases() {
    if (this.dbConfig) {
      await teardownDBThings(this.dbConfig);
      this.dbConfig = null;
    }
  }

  private static async createSQLDatabase() {
    const client = new Client(this.dbConfig.dbUrl);
    
    try {
      await client.connect();
      await client.query(`CREATE DATABASE "${this.dbConfig.dbName}"`);
      console.log(`✅ PostgreSQL database created: ${this.dbConfig.dbName}`);
    } catch (error) {
      console.error(`❌ Failed to create PostgreSQL database ${this.dbConfig.dbName}:`, error);
      throw error;
    } finally {
      await client.end();
    }
  }

  private static async dropSQLDatabase() {
     const client = new Client(this.dbConfig.dbUrl);
    
    try {
      await client.connect();
      await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${this.dbConfig.dbName}' AND pid <> pg_backend_pid()
      `);
      await client.query(`DROP DATABASE IF EXISTS "${this.dbConfig.dbName}"`);
      console.log(`✅ PostgreSQL database dropped: ${this.dbConfig.dbName}`);
    } catch (error) {
      console.error(`❌ Failed to drop PostgreSQL database ${this.dbConfig.dbName}:`, error);
      // Don't throw - cleanup should be best effort
    } finally {
      await client.end();
    }
}

  private static async createMongoDatabase() {
    const client = new MongoClient(this.dbConfig.dbUrl);
    
    try {
      await client.connect();
      const db = client.db(this.dbConfig.dbName);
      // Create a dummy collection to ensure database exists
      await db.createCollection('_init');
      console.log(`✅ MongoDB database created: ${this.dbConfig.dbName}`);
    } catch (error) {
      console.error(`❌ Failed to create MongoDB database ${this.dbConfig.dbName}:`, error);
      throw error;
    } finally {
      await client.close();
    }
  }

  private static async dropMongoDatabase() {
    const client = new MongoClient(this.dbConfig.dbUrl);
    
    try {
      await client.connect();
      const db = client.db(this.dbConfig.dbName);
      await db.dropDatabase();
      console.log(`✅ MongoDB database dropped: ${this.dbConfig.dbName}`);
    } catch (error) {
      console.error(`❌ Failed to drop MongoDB database ${this.dbConfig.dbName}:`, error);
      // Don't throw - cleanup should be best effort
    } finally {
      await client.close();
    }
  }

  private static getDBEngine(): string {
    const dbEngine = config.get("DATABASE_ENGINE");
    return dbEngine;
  }
}