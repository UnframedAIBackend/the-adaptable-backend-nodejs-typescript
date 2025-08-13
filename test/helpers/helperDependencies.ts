import { config } from '@core/configuration/configuration';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class HelperDependencies {

  static async setupDependencies(): Promise<void> {
    console.log('Starting test dependencies (databases, etc.)...');
  
    try {
      const service = HelperDependencies.getDBEngine();
      await HelperDependencies.runCommand(`docker compose -f compose-test.yml up ${service} -d --wait`);
      console.log('✅ Test dependencies started successfully');
    } catch (error) {
      console.error('❌ Failed to start test dependencies:', error);
      throw error;
    }
  }

  static async teardownDependencies(): Promise<void> {
    console.log('Stopping test dependencies...');
  
    try {
      const service = HelperDependencies.getDBEngine();
      await HelperDependencies.runCommand(`docker compose -f compose-test.yml down ${service} -v`);
      console.log('✅ Test dependencies stopped and cleaned up');
    } catch (error) {
      console.error('❌ Failed to stop test dependencies:', error);
      throw error;
    }
  }

  private static async runCommand(command: string): Promise<void> {
    await execAsync(command);
  }

  private static getDBEngine(): string {
    const dbEngine = config.get("DATABASE_ENGINE");
    return dbEngine;
  }
}