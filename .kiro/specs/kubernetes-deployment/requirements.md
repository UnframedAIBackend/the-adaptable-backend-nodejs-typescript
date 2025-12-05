# Requirements Document

## Introduction

This feature adds Kubernetes deployment capabilities to the modular monolith REST API project. The system will enable local Kubernetes development using Docker Desktop with Kind, ArgoCD for GitOps-based deployment management, and CDK8s for infrastructure as code. The solution is designed to be didactical and extensible to production environments while maintaining separation of concerns between application and infrastructure code.

## Glossary

- **Application**: The NestJS modular monolith REST API system
- **Kind**: Kubernetes IN Docker - a tool for running local Kubernetes clusters using Docker containers
- **ArgoCD**: A declarative GitOps continuous delivery tool for Kubernetes
- **CDK8s**: Cloud Development Kit for Kubernetes - a framework for defining Kubernetes applications using programming languages
- **Docker Desktop**: A desktop application that provides Docker and Kubernetes runtime environments
- **Makefile**: A build automation tool that uses a file containing directives for building targets
- **Multi-stage Build**: A Docker build pattern that uses multiple FROM statements to optimize image size
- **Layer Optimization**: The practice of organizing Dockerfile instructions to maximize Docker cache efficiency
- **GitOps**: An operational framework that uses Git as the single source of truth for declarative infrastructure
- **Synth**: The CDK8s command that generates Kubernetes manifests from code
- **Modular Monolith**: An architectural pattern where a single deployable unit contains multiple loosely coupled modules

## Requirements

### Requirement 1

**User Story:** As a developer, I want an optimized Docker image for the application, so that I can deploy efficiently to Kubernetes with minimal resource usage.

#### Acceptance Criteria

1. WHEN building the Docker image THEN the system SHALL use multi-stage builds to separate build and runtime environments
2. WHEN the Docker image is built THEN the system SHALL optimize layer caching by ordering instructions from least to most frequently changing
3. WHEN specifying the application to run THEN the system SHALL accept an app parameter to determine which application module to start
4. WHEN the Docker image is created THEN the system SHALL use Alpine-based Node.js images to minimize image size
5. WHERE production builds are required THEN the system SHALL install only production dependencies in the final stage
6. WHEN copying application files THEN the system SHALL exclude development files and artifacts using .dockerignore

### Requirement 2

**User Story:** As a developer, I want to create and manage a local Kubernetes cluster using Make commands, so that I can quickly set up a development environment.

#### Acceptance Criteria

1. WHEN executing the cluster creation command THEN the Makefile SHALL create a Kind cluster using Docker Desktop
2. WHEN the Kind cluster is created THEN the system SHALL configure it with appropriate port mappings for local development
3. WHEN the cluster creation fails THEN the Makefile SHALL provide clear error messages indicating the failure reason
4. WHEN the cluster already exists THEN the Makefile SHALL detect this and skip creation
5. WHEN deleting the cluster THEN the Makefile SHALL provide a command to cleanly remove all cluster resources

### Requirement 3

**User Story:** As a developer, I want ArgoCD installed in my local cluster, so that I can manage deployments using GitOps principles.

#### Acceptance Criteria

1. WHEN installing ArgoCD THEN the Makefile SHALL install the latest stable version of ArgoCD
2. WHEN ArgoCD is installed THEN the system SHALL create the argocd namespace if it does not exist
3. WHEN ArgoCD installation completes THEN the system SHALL wait for all ArgoCD components to be ready
4. WHEN accessing ArgoCD THEN the Makefile SHALL provide a command to retrieve the initial admin password
5. WHEN exposing ArgoCD THEN the Makefile SHALL provide a command to port-forward the ArgoCD server for local access

### Requirement 4

**User Story:** As a developer, I want to define Kubernetes resources using CDK8s, so that I can manage infrastructure as code with type safety and reusability.

#### Acceptance Criteria

1. WHEN initializing CDK8s THEN the system SHALL create a separate infrastructure directory with CDK8s TypeScript project
2. WHEN defining Kubernetes resources THEN the CDK8s code SHALL create Deployment manifests for the application
3. WHEN defining Kubernetes resources THEN the CDK8s code SHALL create Service manifests to expose the application
4. WHEN defining Kubernetes resources THEN the CDK8s code SHALL create ConfigMap manifests for application configuration
5. WHERE database dependencies exist THEN the CDK8s code SHALL create manifests for PostgreSQL and MongoDB
6. WHEN synthesizing manifests THEN the CDK8s system SHALL generate valid Kubernetes YAML files in a dist directory

### Requirement 5

**User Story:** As a developer, I want ArgoCD to automatically sync with CDK8s generated manifests, so that deployments stay in sync with infrastructure code changes.

#### Acceptance Criteria

1. WHEN creating an ArgoCD application THEN the system SHALL configure it to monitor the CDK8s output directory
2. WHEN CDK8s manifests are synthesized THEN ArgoCD SHALL detect changes and sync automatically
3. WHEN ArgoCD syncs THEN the system SHALL apply all generated Kubernetes manifests to the cluster
4. WHEN sync fails THEN ArgoCD SHALL report detailed error messages about the failure
5. WHERE manual sync is required THEN the Makefile SHALL provide a command to trigger ArgoCD sync

### Requirement 6

**User Story:** As a developer, I want the infrastructure code separated from application code, so that I can manage deployment concerns independently while maintaining a didactical single-repository structure.

#### Acceptance Criteria

1. WHEN organizing the project THEN the system SHALL create an infrastructure directory at the repository root
2. WHEN the infrastructure directory is created THEN it SHALL contain the CDK8s project with its own package.json
3. WHEN the infrastructure directory is created THEN it SHALL contain ArgoCD application definitions
4. WHEN building the infrastructure THEN the system SHALL not require rebuilding the application code
5. WHEN the application code changes THEN the system SHALL not require regenerating infrastructure manifests unless configuration changes

### Requirement 7

**User Story:** As a developer, I want comprehensive Make targets for the entire workflow, so that I can execute complex operations with simple commands.

#### Acceptance Criteria

1. WHEN viewing available commands THEN the Makefile SHALL provide a help target that lists all available targets with descriptions
2. WHEN executing the full setup THEN the Makefile SHALL provide a target that creates the cluster, installs ArgoCD, and deploys the application
3. WHEN building Docker images THEN the Makefile SHALL provide targets for building with different app parameters
4. WHEN synthesizing infrastructure THEN the Makefile SHALL provide a target to run CDK8s synth
5. WHEN cleaning up THEN the Makefile SHALL provide targets to remove the cluster and clean generated files

### Requirement 8

**User Story:** As a developer, I want the application to be configurable for different environments, so that the same Docker image can run in development and production-like scenarios.

#### Acceptance Criteria

1. WHEN the application starts THEN it SHALL read configuration from environment variables
2. WHEN deploying to Kubernetes THEN the system SHALL inject environment variables via ConfigMaps
3. WHERE sensitive data is required THEN the system SHALL support Kubernetes Secrets for credentials
4. WHEN database connection strings are needed THEN the system SHALL construct them from environment variables
5. WHEN the application module parameter changes THEN the system SHALL start the appropriate application without rebuilding the image
