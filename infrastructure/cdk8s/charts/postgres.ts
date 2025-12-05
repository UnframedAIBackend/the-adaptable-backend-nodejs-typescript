import { Chart, ChartProps, Helm } from 'cdk8s';
import { Construct } from 'constructs';

export interface PostgresChartProps extends ChartProps {
  /**
   * PostgreSQL username
   * @default 'postgres'
   */
  readonly username?: string;

  /**
   * PostgreSQL password
   * @default 'postgres'
   */
  readonly password?: string;

  /**
   * PostgreSQL database name
   * @default 'postgres'
   */
  readonly database?: string;

  /**
   * Persistence storage size
   * @default '10Gi'
   */
  readonly storageSize?: string;

  /**
   * Service type
   * @default 'ClusterIP'
   */
  readonly serviceType?: string;
}

/**
 * PostgresChart wraps the Bitnami PostgreSQL Helm chart
 * This provides a production-ready PostgreSQL deployment
 */
export class PostgresChart extends Chart {
  constructor(scope: Construct, id: string, props: PostgresChartProps = {}) {
    super(scope, id, props);

    const username = props.username ?? 'postgres';
    const password = props.password ?? 'postgres';
    const database = props.database ?? 'postgres';
    const storageSize = props.storageSize ?? '10Gi';
    const serviceType = props.serviceType ?? 'ClusterIP';

    // Deploy PostgreSQL using Bitnami Helm chart
    new Helm(this, 'postgresql', {
      chart: 'postgresql',
      repo: 'https://charts.bitnami.com/bitnami',
      releaseName: 'postgresql',
      values: {
        auth: {
          username,
          password,
          database,
          // Enable password authentication
          enablePostgresUser: true,
          postgresPassword: password,
        },
        primary: {
          persistence: {
            enabled: true,
            size: storageSize,
            // Use default storage class
            storageClass: '',
          },
          // Resource limits for primary instance
          resources: {
            limits: {
              cpu: '500m',
              memory: '512Mi',
            },
            requests: {
              cpu: '250m',
              memory: '256Mi',
            },
          },
        },
        // Service configuration
        service: {
          type: serviceType,
          port: 5432,
        },
        // Metrics configuration (disabled for local dev)
        metrics: {
          enabled: false,
        },
      },
    });
  }
}
