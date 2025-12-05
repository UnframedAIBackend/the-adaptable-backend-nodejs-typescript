import { Chart, ChartProps } from 'cdk8s';
import { Construct } from 'constructs';
import * as kplus from 'cdk8s-plus-33';

export interface ApplicationChartProps extends ChartProps {
  /**
   * Name of the NestJS application module to run
   * @default 'restAPI'
   */
  readonly appName?: string;

  /**
   * Docker image reference
   * @default 'rest-api:latest'
   */
  readonly image?: string;

  /**
   * Container port
   * @default 3000
   */
  readonly port?: number;

  /**
   * Number of pod replicas
   * @default 1
   */
  readonly replicas?: number;

  /**
   * Environment variables for the application
   */
  readonly env?: Record<string, string>;
}

/**
 * ApplicationChart defines the Kubernetes resources for the REST API application
 */
export class ApplicationChart extends Chart {
  constructor(scope: Construct, id: string, props: ApplicationChartProps = {}) {
    super(scope, id, props);

    const appName = props.appName ?? 'restAPI';
    const image = props.image ?? 'rest-api:latest';
    const port = props.port ?? 3000;
    const replicas = props.replicas ?? 1;

    // Create ConfigMap for environment variables
    const configMap = new kplus.ConfigMap(this, 'app-config', {
      metadata: {
        name: 'rest-api-config',
      },
      data: {
        NODE_ENV: props.env?.NODE_ENV ?? 'production',
        PORT: String(port),
        TZ: props.env?.TZ ?? 'UTC',
        DATABASE_ENGINE: props.env?.DATABASE_ENGINE ?? 'postgres',
        DATABASE_URL: props.env?.DATABASE_URL ?? 'postgresql://postgres:postgres@postgresql:5432/postgres',
      },
    });

    // Create Deployment
    const deployment = new kplus.Deployment(this, 'deployment', {
      metadata: {
        name: 'rest-api',
        labels: {
          app: 'rest-api',
        },
      },
      replicas,
    });

    // Add container to deployment
    const container = deployment.addContainer({
      name: 'rest-api',
      image,
      port,
      imagePullPolicy: kplus.ImagePullPolicy.IF_NOT_PRESENT,
    });

    // Add APP_NAME environment variable
    container.env.addVariable('APP_NAME', kplus.EnvValue.fromValue(appName));

    // Add environment variables from ConfigMap
    for (const [key, value] of Object.entries(configMap.data)) {
      container.env.addVariable(key, kplus.EnvValue.fromConfigMap(configMap, key));
    }

    // Create Service (NodePort for local access)
    new kplus.Service(this, 'service', {
      metadata: {
        name: 'rest-api-service',
      },
      type: kplus.ServiceType.NODE_PORT,
      selector: deployment,
      ports: [
        {
          port,
          targetPort: port,
          nodePort: 30080, // Maps to host port 8080 via Kind config
        },
      ],
    });
  }
}
