# Makefile for Kubernetes Deployment Infrastructure
# Provides automation for local development with Kind, ArgoCD, and CDK8s

# Variables
CLUSTER_NAME ?= local-dev
APP_NAME ?= restAPI
IMAGE_TAG ?= latest
ARGOCD_NAMESPACE ?= argocd
KIND_CONFIG ?= infrastructure/kind-config.yaml

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

.PHONY: help
help: ## Display this help message
	@echo "$(GREEN)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

.PHONY: cluster-create
cluster-create: ## Create Kind cluster with configuration
	@echo "$(GREEN)Creating Kind cluster: $(CLUSTER_NAME)$(NC)"
	@if ! docker info > /dev/null 2>&1; then \
		echo "$(RED)Error: Docker is not running. Please start Docker Desktop.$(NC)"; \
		exit 1; \
	fi
	@if kind get clusters 2>/dev/null | grep -q "^$(CLUSTER_NAME)$$"; then \
		echo "$(YELLOW)Cluster '$(CLUSTER_NAME)' already exists. Skipping creation.$(NC)"; \
	else \
		kind create cluster --name $(CLUSTER_NAME) --config $(KIND_CONFIG); \
		echo "$(GREEN)Cluster '$(CLUSTER_NAME)' created successfully!$(NC)"; \
	fi

.PHONY: cluster-delete
cluster-delete: ## Delete Kind cluster
	@echo "$(YELLOW)Deleting Kind cluster: $(CLUSTER_NAME)$(NC)"
	@if kind get clusters 2>/dev/null | grep -q "^$(CLUSTER_NAME)$$"; then \
		kind delete cluster --name $(CLUSTER_NAME); \
		echo "$(GREEN)Cluster '$(CLUSTER_NAME)' deleted successfully!$(NC)"; \
	else \
		echo "$(YELLOW)Cluster '$(CLUSTER_NAME)' does not exist.$(NC)"; \
	fi

.PHONY: cluster-status
cluster-status: ## Check cluster status
	@echo "$(GREEN)Checking cluster status...$(NC)"
	@if kind get clusters 2>/dev/null | grep -q "^$(CLUSTER_NAME)$$"; then \
		echo "$(GREEN)Cluster '$(CLUSTER_NAME)' exists$(NC)"; \
		kubectl cluster-info --context kind-$(CLUSTER_NAME); \
	else \
		echo "$(RED)Cluster '$(CLUSTER_NAME)' does not exist$(NC)"; \
	fi

# ============================================
# ArgoCD Targets
# ============================================

.PHONY: argocd-install
argocd-install: ## Install ArgoCD in the cluster
	@echo "$(GREEN)Installing ArgoCD...$(NC)"
	@kubectl create namespace $(ARGOCD_NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	@echo "$(GREEN)Applying ArgoCD manifests...$(NC)"
	@kubectl apply -n $(ARGOCD_NAMESPACE) -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
	@echo "$(YELLOW)Waiting for ArgoCD pods to be ready (this may take a few minutes)...$(NC)"
	@kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n $(ARGOCD_NAMESPACE) --timeout=300s
	@kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-repo-server -n $(ARGOCD_NAMESPACE) --timeout=300s
	@kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-application-controller -n $(ARGOCD_NAMESPACE) --timeout=300s
	@echo "$(GREEN)ArgoCD installed successfully!$(NC)"

.PHONY: argocd-password
argocd-password: ## Retrieve ArgoCD admin password
	@echo "$(GREEN)ArgoCD Admin Password:$(NC)"
	@kubectl -n $(ARGOCD_NAMESPACE) get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
	@echo ""

.PHONY: argocd-port-forward
argocd-port-forward: ## Port-forward ArgoCD server to localhost:8080
	@echo "$(GREEN)Port-forwarding ArgoCD server to http://localhost:8080$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop port-forwarding$(NC)"
	@kubectl port-forward svc/argocd-server -n $(ARGOCD_NAMESPACE) 8080:443

.PHONY: argocd-status
argocd-status: ## Check ArgoCD installation status
	@echo "$(GREEN)Checking ArgoCD status...$(NC)"
	@kubectl get pods -n $(ARGOCD_NAMESPACE)

# ============================================
# CDK8s Targets
# ============================================

.PHONY: infra-init
infra-init: ## Initialize CDK8s project dependencies
	@echo "$(GREEN)Installing CDK8s dependencies...$(NC)"
	@cd infrastructure/cdk8s && npm install
	@echo "$(GREEN)CDK8s dependencies installed!$(NC)"

.PHONY: infra-synth
infra-synth: ## Synthesize Kubernetes manifests from CDK8s
	@echo "$(GREEN)Synthesizing Kubernetes manifests...$(NC)"
	@cd infrastructure/cdk8s && npm run build && npm run synth
	@echo "$(GREEN)Manifests generated at infrastructure/cdk8s/dist/manifests/$(NC)"

.PHONY: infra-apply
infra-apply: infra-synth ## Apply CDK8s generated manifests to cluster
	@echo "$(GREEN)Applying manifests to cluster...$(NC)"
	@kubectl apply -f infrastructure/cdk8s/dist/manifests/
	@echo "$(GREEN)Manifests applied successfully!$(NC)"
