# AFL Tracker Infrastructure

Multi-cloud infrastructure as code for the AFL Tracker project using Pulumi with TypeScript.

## Architecture Overview

This repository manages infrastructure across **Google Cloud Platform (GCP)** and **Microsoft Azure** using a unified structure with cloud-specific implementations.

### Repository Structure

```
.
├── bootstrap/           # Bootstrap layer - Identity & Access Management
│   ├── index.ts        # Entry point (cloud router)
│   ├── gcp/
│   │   └── infra.ts    # GCP WIF, service accounts, IAM
│   ├── azure/
│   │   └── infra.ts    # Azure App Registration, service principals, RBAC
│   └── README.md       # Bootstrap documentation
├── main/               # Main layer - Application infrastructure
│   ├── index.ts        # Entry point (cloud router)
│   ├── gcp/
│   │   └── infra.ts    # GCP VPC, Artifact Registry, service accounts
│   ├── azure/
│   │   └── infra.ts    # Azure Resource Group, Custom Vision, managed identities
│   └── README.md       # Main infrastructure documentation
└── .github/workflows/  # CI/CD pipelines
    ├── deploy-gcp-main.yml
    └── deploy-azure-main.yml
```

## Deployment Layers

### 1. Bootstrap Layer
**Purpose**: Creates foundational identity and access management for CI/CD

**Deploy manually** with admin credentials (one-time setup):
```bash
cd bootstrap
pulumi up --stack dev-gcp    # For GCP
pulumi up --stack dev-azure  # For Azure
```

See [bootstrap/README.md](bootstrap/README.md) for details.

### 2. Main Layer
**Purpose**: Creates application infrastructure resources

**Deployed automatically** via GitHub Actions on push to main, or manually:
```bash
cd main
pulumi up --stack dev-gcp    # For GCP
pulumi up --stack dev-azure  # For Azure
```

See [main/README.md](main/README.md) for details.

## Cloud Provider Selection

Each layer uses a **single entry point** (`index.ts`) that routes to cloud-specific code based on the `cloudProvider` configuration:

```typescript
const cloudProvider = config.require("cloudProvider"); // "gcp" or "azure"
switch (cloudProvider) {
    case "gcp": await import("./gcp/infra"); break;
    case "azure": await import("./azure/infra"); break;
}
```

Configuration is set in `Pulumi.<stack>.yaml`:
```yaml
config:
  <project-name>:cloudProvider: gcp  # or "azure"
  # ... cloud-specific configs
```

## Prerequisites

### Tools
- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/) (v3.0+)
- [Node.js](https://nodejs.org/) (v18+)
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) (for GCP)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) (for Azure)

### Accounts
- GCP account with a project
- Azure account with a subscription
- Pulumi account (for state management)
- GitHub repository

## Initial Setup

### 1. Install Dependencies

```bash
cd bootstrap && npm install
cd ../main && npm install
```

### 2. Configure Pulumi Stacks

Create cloud-specific stacks:

```bash
# GCP stacks
cd bootstrap && pulumi stack init dev-gcp
cd ../main && pulumi stack init dev-gcp

# Azure stacks
cd ../bootstrap && pulumi stack init dev-azure
cd ../main && pulumi stack init dev-azure
```

### 3. Configure Stack Values

Edit `Pulumi.<stack>.yaml` files to set cloud-specific configuration values. See README files in each layer for required configuration.

### 4. Deploy Bootstrap Layer

```bash
cd bootstrap
gcloud auth application-default login  # For GCP
# or
az login  # For Azure

pulumi up --stack dev-gcp    # Deploy GCP bootstrap
pulumi up --stack dev-azure  # Deploy Azure bootstrap
```

### 5. Configure GitHub Secrets

From bootstrap outputs, configure GitHub repository secrets:

**For GCP:**
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`

**For Azure:**
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

**For both:**
- `PULUMI_ACCESS_TOKEN`

### 6. Deploy Main Infrastructure

Push to main branch to trigger CI/CD, or deploy manually:

```bash
cd main
pulumi up --stack dev-gcp    # For GCP
pulumi up --stack dev-azure  # For Azure
```

## CI/CD Workflows

### GCP Deployment
- **Trigger**: Push to `main` with changes in `main/gcp/**` or configuration files
- **Authentication**: Workload Identity Federation
- **Workflow**: [.github/workflows/deploy-gcp-main.yml](.github/workflows/deploy-gcp-main.yml)

### Azure Deployment
- **Trigger**: Push to `main` with changes in `main/azure/**` or configuration files
- **Authentication**: Federated Identity Credentials
- **Workflow**: [.github/workflows/deploy-azure-main.yml](.github/workflows/deploy-azure-main.yml)

## Azure Custom Vision

The Azure infrastructure includes **Cognitive Services Custom Vision** for ML-based image classification:

- **Training Service**: Create and train custom vision models
- **Prediction Service**: Real-time inference API

Backend applications use the managed identity to authenticate with Custom Vision services. See [main/README.md](main/README.md) for integration details.

## Development Workflow

1. **Make changes** to cloud-specific code in `bootstrap/{cloud}/infra.ts` or `main/{cloud}/infra.ts`
2. **Test locally**: `pulumi preview --stack dev-{cloud}`
3. **Commit and push** to trigger CI/CD
4. **Monitor deployment** in GitHub Actions

## Best Practices

- ✅ **Bootstrap once**: Deploy bootstrap layer manually with admin credentials
- ✅ **Use CI/CD**: Deploy main layer via GitHub Actions
- ✅ **Separate stacks**: Use different stacks per cloud and environment
- ✅ **Least privilege**: Grant minimal necessary permissions
- ✅ **Secrets management**: Use Pulumi secrets for sensitive values
- ✅ **Resource tagging**: Tag resources with environment and purpose

## Troubleshooting

### Pulumi State Conflicts
If you encounter state conflicts when switching between clouds:
```bash
pulumi cancel  # Cancel any pending operations
pulumi refresh  # Sync state with actual resources
```

### Authentication Issues
- **GCP**: Ensure `GOOGLE_APPLICATION_CREDENTIALS` is set or use `gcloud auth application-default login`
- **Azure**: Ensure Azure CLI is authenticated with `az login`

### TypeScript Errors
Rebuild after changes:
```bash
cd bootstrap && npm run build
cd main && npm run build
```

## Support

For issues or questions:
- Check layer-specific README files ([bootstrap/README.md](bootstrap/README.md), [main/README.md](main/README.md))
- Review [Pulumi documentation](https://www.pulumi.com/docs/)
- Review cloud provider documentation ([GCP](https://cloud.google.com/docs), [Azure](https://docs.microsoft.com/azure/))
