import { readFileSync, existsSync } from "fs";
import * as path from "path";

interface EnvConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  TZ: string;
  DATABASE_URL: string;
  DATABASE_ENGINE: string;
}

type EnvVarConfig = {
  required: boolean;
  type: "string" | "number";
  defaultValue?: string | number;
};

export class Configuration {
  private static instance: Configuration;
  private readonly config: Map<keyof EnvConfig, string | number> = new Map();

  private readonly envSchema: Record<keyof EnvConfig, EnvVarConfig> = {
    NODE_ENV: { required: true, type: "string" },
    PORT: { required: true, type: "number" },
    DATABASE_URL: { required: true, type: "string" },
    DATABASE_ENGINE: { required: true, type: "string" },
    TZ: { required: false, type: "string", defaultValue: "America/Bogota" }
  };

  private constructor() {
    this.loadEnvFile();
    this.validateConfig();
  }

  static getInstance(): Configuration {
    return Configuration.instance ??= new Configuration();
  }

  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config.get(key) as EnvConfig[K];
  }

  private validateConfig(): void {
    const missingRequired: string[] = [];

    for (const [key, schema] of Object.entries(this.envSchema)) {
      const envKey = key as keyof EnvConfig;
      const rawValue = process.env[envKey];

      if (!rawValue) {
        if (schema.required) {
          missingRequired.push(envKey);
          continue;
        }
        if (schema.defaultValue !== undefined) {
          this.config.set(envKey, schema.defaultValue);
          continue;
        }
      }

      const parsedValue = this.parseValue(rawValue!, schema.type);
      this.config.set(envKey, parsedValue);
    }

    if (missingRequired.length > 0) {
      throw new Error(`Missing required environment variables: ${missingRequired.join(", ")}`);
    }
  }

  private parseValue(value: string, type: "string" | "number"): string | number {
    if (type === "number") {
      const parsed = Number(value);
      if (isNaN(parsed)) {
        throw new Error(`Invalid number value: ${value}`);
      }
      return parsed;
    }
    return value;
  }

  private loadEnvFile(): void {
    const envFile = process.env.NODE_ENV === "test" ? "env.test" : ".env";
    const envPath = path.resolve(process.cwd(), envFile);

    if (!existsSync(envPath)) {
      console.warn(`Warning: ${envFile} file not found at ${envPath}`);
      return;
    }

    try {
      const content = readFileSync(envPath, "utf8");
      this.parseEnvContent(content);
    } catch (error) {
      console.error(`Error reading ${envFile}:`, error);
    }
  }

  private parseEnvContent(content: string): void {
    const lines = content.split("\n");
    const envVars = new Map<string, string>();

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalIndex = trimmed.indexOf("=");
      if (equalIndex === -1) continue;

      const key = trimmed.slice(0, equalIndex).trim();
      let value = trimmed.slice(equalIndex + 1).trim();

      value = value.replace(/^(["'])(.*)\1$/, "$2");

      envVars.set(key, value);
    }

    for (const [key, value] of envVars) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

export const config = Configuration.getInstance();
