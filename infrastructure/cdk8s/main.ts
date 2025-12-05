import { App } from 'cdk8s';
import { ApplicationChart } from './charts/application';
import { PostgresChart } from './charts/postgres';

// Main entry point for CDK8s application
const app = new App();

// Create PostgreSQL database chart
new PostgresChart(app, 'postgres', {
  username: 'postgres',
  password: 'postgres',
  database: 'postgres',
  storageSize: '10Gi',
});

// Create REST API application chart
new ApplicationChart(app, 'rest-api', {
  appName: 'restAPI',
  image: 'rest-api:latest',
  port: 3000,
  replicas: 1,
  env: {
    NODE_ENV: 'production',
    TZ: 'UTC',
    DATABASE_ENGINE: 'postgres',
    DATABASE_URL: 'postgresql://postgres:postgres@postgresql:5432/postgres',
  },
});

app.synth();
