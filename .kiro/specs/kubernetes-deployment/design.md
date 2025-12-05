# Design Document: Kubernetes Deployment Infrastructure

## Overview

This design implements a complete local Kubernetes development workflow for the modular monolith REST API application. The solution uses Docker Desktop with Kind for local cluster management, ArgoCD for GitOps-based deployment automation, and CDK8s for type-safe infrastructure as code. The architecture separates infrastructure concerns from application code while maintaining a single repository for didactical purposes.

The design follows cloud-native best practices including multi-stage Docker builds, declarative infrastructure, and GitOps principles, making it extensible to production environments while optimized for local development and learning.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Developer Workstation                    │
│                                                              │
│  ┌──────────────┐         ┌─────────────────────────────┐  │
│  │   Makefile   │────────▶│   Docker Desktop + Kind     │  │
│  │  (Automation)│         │   (K8s Cluster Runtime)     │  │
│  └──────────────┘         └─────────────────────────────┘  │
│         │                              │                     │
│         │                              │                     │
│         ▼                              ▼                     │
│  ┌──────────────┐         ┌─────────────────────────────┐  │
│  │    CDK8s     │────────▶│        ArgoCD               │  │
│  │ (IaC Synth)  │  YAML   │  (GitOps Controller)        │  │
│  └──────────────┘         └─────────────────────────────┘  │
│         │                              │                     │
│         │                              │                     │
│         ▼                              ▼                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Kubernetes Resources                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │  │   App    │  │PostgreSQL│  │     MongoDB      │   │  │
│  │  │   Pod    │  │   Pod    │  │      Pod         │   │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Build Phase**: Developer builds optimized Docker image with app parameter
2. **Infrastructure Phase**: CDK8s synthesizes Kubernetes manifests from TypeScript code
3. **Deployment Phase**: ArgoCD monitors manifest directory and syncs to cluster
4. **Runtime Phase**: Kubernetes orchestrates application and database pods

## Components and Interfaces

### 1. Multi-Stage Dockerfile

**Purpose**: Create optimized, parameterized Docker images for the modular monolith

**Stages**:
- **base**: Common base with Node.js Alpine and system dependencies
- **dependencies**: Install and cache npm dependencies
- **builder**: Compile TypeScript to JavaScript
- **production**: Minimal runtime image with only production artifacts

**Build Arguments**:
- `APP_NAME`: The application module to run (default: "restAPI")
- `NODE_VERSION`: Node.js version (default: "20-alpine")

**Key Optimizations**:
- Layer caching: package.json copied before source code
- Multi-stage: Build artifacts excluded from final image
- Alpine base: Minimal OS footprint
- Production dependencies only in final stage
- Non-root user for security

**Interface**:
```dockerfile
# Build command
docker build --build-arg APP_NAME=restAPI -t app:latest .

# Run command
docker run -e NODE_ENV=production -e PORT=3000 app:latest
```

### 2. Makefile Automation

**Purpose**: Provide simple commands for complex Kubernetes workflows

**Key Targets**:

```makefile
help                 # Display all available targets
cluster-create       # Create Kind cluster with config
cluster-delete       # Delete Kind cluster
argocd-install       # Install ArgoCD latest version
argocd-password      # Retrieve ArgoCD admin password
argocd-port-forward  # Expose ArgoCD UI locally
docker-build         # Build application Docker image
infra-init           # Initialize CDK8s project
infra-synth          # Generate K8s manifests from CDK8s
deploy-all           # Full workflow: cluster + ArgoCD + deploy
clean                # Remove generated files and images
```

**Variables**:
- `CLUSTER_NAME`: Kind cluster name (default: "local-dev")
- `APP_NAME`: Application module (default: "restAPI")
- `ARGOCD_NAMESPACE`: ArgoCD namespace (default: "argocd")
- `IMAGE_TAG`: Docker image tag (default: "latest")

### 3. Kind Cluster Configuration

**Purpose**: Define local Kubernetes cluster with appropriate settings

**Configuration File**: `infrastructure/kind-config.yaml`

**Key Settings**:
- Single control-plane node for simplicity
- Port mappings for NodePort services (30000-32767)
- Port mapping for application (30080 → 80)
- Docker registry integration for local images

**Interface**:
```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30080
        hostPort: 8080
        protocol: TCP
```

### 4. CDK8s Infrastructure Project

**Purpose**: Define Kubernetes resources using TypeScript with type safety

**Project Structure**:
```
infrastructure/
├── cdk8s/
│   ├── package.json
│   ├── tsconfig.json
│   ├── cdk8s.yaml
│   ├── main.ts
│   ├── charts/
│   │   ├── application.ts
│   │   ├── postgres.ts
│   │   └── mongodb.ts
│   └── dist/              # Synthesized YAML output
│       └── *.yaml
```

**Key Classes**:

**ApplicationChart**:
- Deployment with configurable replicas
- Service (ClusterIP or NodePort)
- ConfigMap for environment variables
- Resource requests and limits
- Health checks (liveness/readiness probes)
- App parameter support via environment variable

**PostgresChart**:
- Wrapper around Bitnami PostgreSQL Helm chart
- Configured via Helm values for credentials, storage, and service
- Leverages battle-tested Helm chart instead of custom implementation
- Simplified maintenance and updates

**MongoDBChart**:
- Wrapper around Bitnami MongoDB Helm chart
- Configured via Helm values for replica set, credentials, and storage
- Leverages battle-tested Helm chart instead of custom implementation
- Simplified maintenance and updates

**Interface**:
```typescript
// main.ts
import { App, Chart } from 'cdk8s';
import { Helm } from 'cdk8s-plus-27';

const app = new App();

// Custom application chart
new ApplicationChart(app, 'rest-api', {
  appName: 'restAPI',
  image: 'app:latest',
  port: 3000,
  replicas: 1
});

// PostgreSQL via Helm
const postgresChart = new Chart(app, 'postgres');
new Helm(postgresChart, 'postgresql', {
  chart: 'postgresql',
  repo: 'https://charts.bitnami.com/bitnami',
  values: {
    auth: {
      username: 'postgres',
      password: 'postgres',
      database: 'postgres'
    },
    primary: {
      persistence: {
        size: '10Gi'
      }
    }
  }
});

// MongoDB via Helm
const mongoChart = new Chart(app, 'mongodb');
new Helm(mongoChart, 'mongodb', {
  chart: 'mongodb',
  repo: 'https://charts.bitnami.com/bitnami',
  values: {
    auth: {
      rootUser: 'mongo',
      rootPassword: 'mongo',
      database: 'mongo'
    },
    replicaSet: {
      enabled: true,
      replicas: 1
    },
    persistence: {
      size: '10Gi'
    }
  }
});

app.synth();
```

### 5. ArgoCD Application Definition

**Purpose**: Configure ArgoCD to monitor and sync CDK8s manifests

**Configuration File**: `infrastructure/argocd/application.yaml`

**Key Settings**:
- Source: Local path to CDK8s dist directory
- Destination: Target namespace in cluster
- Sync policy: Automated with self-heal
- Prune: Remove resources not in Git

**Interface**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: rest-api-app
  namespace: argocd
spec:
  source:
    path: infrastructure/cdk8s/dist
    repoURL: file:///path/to/repo
  destination:
    namespace: default
    server: https://kubernetes.default.svc
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Note**: For local development, ArgoCD will monitor the local filesystem. In production, this would point to a Git repository.

## Data Models

### Environment Configuration Model

```typescript
interface AppConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  TZ: string;
  DATABASE_URL: string;
  DATABASE_ENGINE: 'postgres' | 'mongodb';
  APP_NAME?: string;  // New: Application module to run
}
```

### CDK8s Chart Configuration Models

```typescript
interface ApplicationChartProps {
  appName: string;           // NestJS app module name
  image: string;             // Docker image reference
  port: number;              // Container port
  replicas: number;          // Number of pod replicas
  env?: Record<string, string>;  // Environment variables
  resources?: ResourceRequirements;
}

interface DatabaseChartProps {
  storageSize: string;       // PVC size (e.g., "10Gi")
  storageClass?: string;     // Storage class name
  credentials: {
    username: string;
    password: string;
    database: string;
  };
}

interface ResourceRequirements {
  requests: {
    cpu: string;
    memory: string;
  };
  limits: {
    cpu: string;
    memory: string;
  };
}
```

### Kind Cluster Configuration Model

```typescript
interface KindConfig {
  kind: 'Cluster';
  apiVersion: 'kind.x-k8s.io/v1alpha4';
  nodes: Array<{
    role: 'control-plane' | 'worker';
    extraPortMappings?: Array<{
      containerPort: number;
      hostPort: number;
      protocol: 'TCP' | 'UDP';
    }>;
  }>;
  containerdConfigPatches?: string[];
}
```

## 

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Docker build layer optimization
*For any* Dockerfile build, when package.json changes but source code does not, the dependencies layer should be reused from cache and only subsequent layers should rebuild.
**Validates: Requirements 1.2**

### Property 2: App parameter determines runtime behavior
*For any* valid app name in the NestJS monorepo, building the Docker image with that app parameter and running the container should start only that specific application module.
**Validates: Requirements 1.3**

### Property 3: Multi-stage build excludes development artifacts
*For any* Docker image built using the multi-stage Dockerfile, the final production image should not contain devDependencies, TypeScript source files, or build tools.
**Validates: Requirements 1.5**

### Property 4: Kind cluster creation idempotency
*For any* cluster name, running the cluster creation command multiple times should result in exactly one cluster with that name, with subsequent runs detecting the existing cluster.
**Validates: Requirements 2.4**

### Property 5: ArgoCD component readiness
*For any* ArgoCD installation, when the installation command completes successfully, all ArgoCD pods should be in Ready state before the command returns.
**Validates: Requirements 3.3**

### Property 6: CDK8s synthesis produces valid manifests
*For any* CDK8s chart definition, synthesizing the chart should produce YAML files that pass Kubernetes schema validation.
**Validates: Requirements 4.6**

### Property 7: ArgoCD sync convergence
*For any* set of Kubernetes manifests in the monitored directory, when ArgoCD syncs, the actual cluster state should match the desired state defined in the manifests.
**Validates: Requirements 5.3**

### Property 8: Infrastructure and application independence
*For any* application code change that does not modify configuration, rebuilding the application should not require regenerating infrastructure manifests.
**Validates: Requirements 6.4**

### Property 9: Environment variable injection
*For any* environment variable defined in a ConfigMap, the application container should have access to that variable at runtime with the correct value.
**Validates: Requirements 8.2**

### Property 10: Database connection string construction
*For any* valid set of database connection parameters (host, port, username, password, database), the application should construct a valid connection string that successfully connects to the database.
**Validates: Requirements 8.4**

## Error Handling

### Docker Build Errors

**Missing Dependencies**:
- Error: npm install fails due to network or registry issues
- Handling: Retry with exponential backoff, provide clear error message
- Recovery: Developer can manually fix package.json or network issues

**Invalid App Parameter**:
- Error: APP_NAME does not match any NestJS application in nest-cli.json
- Handling: Dockerfile CMD will fail with NestJS error
- Recovery: Validate app name against nest-cli.json before build

**Build Context Too Large**:
- Error: Docker build slow due to large context
- Handling: Use .dockerignore to exclude unnecessary files
- Recovery: Developer adds appropriate exclusions

### Kind Cluster Errors

**Docker Desktop Not Running**:
- Error: Kind cannot connect to Docker daemon
- Handling: Makefile checks Docker availability before cluster creation
- Recovery: Start Docker Desktop and retry

**Port Conflicts**:
- Error: Host ports already in use
- Handling: Kind reports port binding errors
- Recovery: Change port mappings in kind-config.yaml or stop conflicting services

**Insufficient Resources**:
- Error: Docker Desktop resource limits exceeded
- Handling: Kind fails to create nodes
- Recovery: Increase Docker Desktop resource allocation

### ArgoCD Errors

**Installation Timeout**:
- Error: ArgoCD pods fail to reach Ready state within timeout
- Handling: Makefile waits with timeout, reports pod status
- Recovery: Check pod logs, increase timeout, or investigate resource issues

**Invalid Manifest Path**:
- Error: ArgoCD cannot find manifest directory
- Handling: ArgoCD application shows "Path not found" error
- Recovery: Verify CDK8s synth has run and dist directory exists

**Sync Failures**:
- Error: Manifests fail to apply to cluster
- Handling: ArgoCD reports detailed error in UI and CLI
- Recovery: Fix manifest errors, check RBAC permissions, verify resource quotas

### CDK8s Errors

**TypeScript Compilation Errors**:
- Error: CDK8s code has type errors
- Handling: TypeScript compiler reports errors before synth
- Recovery: Fix type errors in chart definitions

**Invalid Kubernetes Resources**:
- Error: Generated YAML violates Kubernetes API schema
- Handling: CDK8s validation catches errors during synth
- Recovery: Fix chart definitions to match Kubernetes API

**Missing Dependencies**:
- Error: CDK8s imports fail
- Handling: npm install errors reported
- Recovery: Run npm install in infrastructure/cdk8s directory

### Runtime Errors

**Application Startup Failures**:
- Error: Container crashes on startup
- Handling: Kubernetes restarts pod, reports CrashLoopBackOff
- Recovery: Check logs, verify environment variables, fix configuration

**Database Connection Failures**:
- Error: Application cannot connect to database
- Handling: Application logs connection errors, health checks fail
- Recovery: Verify database pods are running, check connection strings, verify network policies

**Resource Exhaustion**:
- Error: Pods evicted due to resource limits
- Handling: Kubernetes reports OOMKilled or resource quota exceeded
- Recovery: Adjust resource requests/limits in CDK8s charts

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases for infrastructure code:

**Dockerfile Validation**:
- Test that .dockerignore excludes expected files
- Verify multi-stage build produces smaller final image than single-stage
- Test specific app parameter values (restAPI, future apps)

**Makefile Target Validation**:
- Test help target produces formatted output
- Verify variable substitution works correctly
- Test error handling for missing prerequisites

**CDK8s Chart Generation**:
- Test ApplicationChart generates Deployment with correct app name
- Test Helm chart imports succeed and generate resources
- Verify PostgreSQL Helm chart values are correctly configured
- Verify MongoDB Helm chart values include replica set configuration
- Verify ConfigMap generation includes all required environment variables
- Test Service creation with correct port mappings

**Configuration Parsing**:
- Test environment variable parsing from ConfigMaps
- Verify database connection string construction with various inputs
- Test handling of missing optional configuration

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript/TypeScript PBT library):

**Property Testing Requirements**:
- Each property-based test MUST run a minimum of 100 iterations
- Each test MUST be tagged with: `**Feature: kubernetes-deployment, Property {number}: {property_text}**`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Test Cases**:

1. **Docker Layer Caching Property** (Property 1):
   - Generate random package.json content
   - Build image twice with same package.json but different source
   - Verify second build reuses dependency layer (faster build time)

2. **App Parameter Property** (Property 2):
   - Generate valid app names from nest-cli.json
   - Build and run container with each app name
   - Verify correct application starts (check logs for app-specific output)

3. **Production Image Cleanliness Property** (Property 3):
   - Build production image
   - Inspect image layers and file system
   - Verify absence of devDependencies, .ts files, and build tools

4. **Cluster Creation Idempotency Property** (Property 4):
   - Generate random cluster names
   - Create cluster twice with same name
   - Verify only one cluster exists and second command succeeds without error

5. **ArgoCD Readiness Property** (Property 5):
   - Install ArgoCD
   - Query all ArgoCD pods
   - Verify all pods report Ready status

6. **CDK8s Validation Property** (Property 6):
   - Generate various chart configurations
   - Synthesize manifests
   - Validate YAML against Kubernetes OpenAPI schema

7. **ArgoCD Sync Convergence Property** (Property 7):
   - Generate random Kubernetes resources
   - Apply via ArgoCD
   - Verify cluster state matches manifest definitions

8. **Build Independence Property** (Property 8):
   - Modify application source code
   - Rebuild application
   - Verify infrastructure manifests unchanged (file hash comparison)

9. **Environment Variable Injection Property** (Property 9):
   - Generate random environment variables in ConfigMap
   - Deploy application
   - Exec into container and verify all variables present with correct values

10. **Connection String Construction Property** (Property 10):
    - Generate random valid database connection parameters
    - Construct connection string
    - Verify string format matches expected pattern and successfully connects

### Integration Testing

Integration tests will verify end-to-end workflows:

**Full Deployment Workflow**:
1. Create Kind cluster
2. Install ArgoCD
3. Synthesize CDK8s manifests
4. Deploy via ArgoCD
5. Verify application responds to HTTP requests
6. Verify database connectivity
7. Clean up resources

**Update Workflow**:
1. Deploy initial version
2. Modify CDK8s charts (e.g., change replica count)
3. Synthesize new manifests
4. Verify ArgoCD detects and syncs changes
5. Verify new configuration applied

**Failure Recovery**:
1. Deploy application
2. Simulate pod failure (delete pod)
3. Verify Kubernetes recreates pod
4. Verify application recovers and remains healthy

### Testing Tools

- **fast-check**: Property-based testing library for TypeScript
- **jest**: Unit test framework
- **kubectl**: Kubernetes cluster validation
- **docker inspect**: Image layer and content verification
- **curl**: HTTP endpoint testing
- **yq**: YAML validation and querying

### Test Execution

Tests will be organized in `infrastructure/tests/` directory:
```
infrastructure/tests/
├── unit/
│   ├── dockerfile.test.ts
│   ├── cdk8s-charts.test.ts
│   └── config.test.ts
├── property/
│   ├── docker-build.property.test.ts
│   ├── cluster-idempotency.property.test.ts
│   ├── cdk8s-validation.property.test.ts
│   └── env-injection.property.test.ts
└── integration/
    ├── full-deployment.test.ts
    └── update-workflow.test.ts
```

Makefile targets for testing:
```makefile
test-unit           # Run unit tests
test-property       # Run property-based tests
test-integration    # Run integration tests
test-all            # Run all tests
```

## Implementation Notes

### Local Development Workflow

1. **Initial Setup** (one-time):
   ```bash
   make deploy-all
   ```
   This creates cluster, installs ArgoCD, builds image, synthesizes manifests, and deploys.

2. **Development Iteration**:
   ```bash
   # Make code changes
   make docker-build
   make infra-synth
   # ArgoCD auto-syncs
   ```

3. **Access Application**:
   ```bash
   # Application available at http://localhost:8080
   curl http://localhost:8080/api/notes
   ```

4. **Access ArgoCD UI**:
   ```bash
   make argocd-port-forward
   # UI available at http://localhost:8080
   make argocd-password  # Get admin password
   ```

### Production Considerations

While this design is optimized for local development, it includes patterns extensible to production:

**For Production Deployment**:
1. Replace Kind with managed Kubernetes (EKS, GKE, AKS)
2. Use container registry (ECR, GCR, Docker Hub) instead of local images
3. Point ArgoCD to Git repository instead of local filesystem
4. Add Ingress controller for external access
5. Implement proper secrets management (Sealed Secrets, External Secrets)
6. Add monitoring (Prometheus, Grafana)
7. Implement backup strategies for databases
8. Use managed databases instead of in-cluster databases
9. Add CI/CD pipeline for automated builds and deployments
10. Implement proper RBAC and network policies

### Directory Structure

Final project structure:
```
.
├── .dockerignore
├── Dockerfile
├── Makefile
├── infrastructure/
│   ├── kind-config.yaml
│   ├── argocd/
│   │   └── application.yaml
│   ├── cdk8s/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── cdk8s.yaml
│   │   ├── main.ts
│   │   ├── charts/
│   │   │   ├── application.ts
│   │   │   ├── postgres.ts
│   │   │   └── mongodb.ts
│   │   └── dist/
│   │       └── *.yaml
│   └── tests/
│       ├── unit/
│       ├── property/
│       └── integration/
├── src/
│   └── [existing application code]
└── [other existing files]
```

### Technology Versions

- **Node.js**: 20 (Alpine)
- **Kind**: Latest (installed via Docker Desktop or standalone)
- **ArgoCD**: Latest stable (installed via kubectl)
- **CDK8s**: Latest (^2.x)
- **Kubernetes**: 1.28+ (Kind default)
- **Docker**: Latest (via Docker Desktop)

### Security Considerations

1. **Non-root User**: Dockerfile runs application as non-root user
2. **Secrets Management**: Use Kubernetes Secrets for sensitive data
3. **Network Policies**: Implement network segmentation in production
4. **RBAC**: ArgoCD uses service account with minimal required permissions
5. **Image Scanning**: Recommend adding image vulnerability scanning in CI/CD
6. **Resource Limits**: All pods have resource limits to prevent resource exhaustion attacks
