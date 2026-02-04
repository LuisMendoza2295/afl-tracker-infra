import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import * as azuread from "@pulumi/azuread";
import * as cognitiveservices from "@pulumi/azure-native/cognitiveservices";
import { AZURE_BUILT_IN_ROLES } from "./constants";

const config = new pulumi.Config();
const azureConfig = new pulumi.Config("azure-native");

const env = pulumi.getStack();
const location = azureConfig.get("location") || "eastus";
const subscriptionId = azureConfig.require("subscriptionId");
const repositoryOrg = config.require("repositoryOrg");
const repositories = config.requireObject<string[]>("repositories");

// 1. Create Resource Group (shared by all applications)
const resourceGroup = new azure.resources.ResourceGroup("afl-tracker-rg", {
  resourceGroupName: `afl-tracker-${env}-rg`,
  location: location,
  tags: {
    environment: env,
    application: "afl-tracker",
    managedBy: "pulumi",
  },
});

// Register Cognitive Services Provider (required for Custom Vision)
// This infrastructure deployment is performed by an entity with Subscription-level permissions
// We create a low-cost/free account to trigger the namespace registration
const registrationHelper = new cognitiveservices.Account("init-cognitive-services", {
  resourceGroupName: resourceGroup.name,
  kind: "ComputerVision",
  sku: {
    name: "F0",
  },
  location: location,
  properties: {
    customSubDomainName: pulumi.interpolate`afl-cv-init-${env}`,
  },
});

// 2. Create App Registration for app deployments (similar to GCP app-deployer-sa)
const appDeployerApp = new azuread.Application("app-deployer-app", {
  displayName: `afl-app-deployer-${env}`,
  description: "App Registration for deploying AFL Tracker applications",
});

const appDeployerSP = new azuread.ServicePrincipal("app-deployer-sp", {
  clientId: appDeployerApp.clientId,
  appRoleAssignmentRequired: false,
  description: "Service Principal for AFL application deployments",
});

// Configure federated credentials for frontend/backend repos
for (const repo of repositories) {
  new azuread.ApplicationFederatedIdentityCredential(`app-deployer-fed-${repo}`, {
    applicationId: appDeployerApp.id,
    displayName: `github-actions-${repo}`,
    description: `Federated credential for ${repo} repository`,
    audiences: ["api://AzureADTokenExchange"],
    issuer: "https://token.actions.githubusercontent.com",
    subject: pulumi.interpolate`repo:${repositoryOrg}/${repo}:environment:${env}`,
  });
}

// Using well-known Azure built-in role definition IDs
const contributorRoleId = pulumi.interpolate`/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/${AZURE_BUILT_IN_ROLES.CONTRIBUTOR}`;

// Grant app deployer contributor permissions on the resource group
new azure.authorization.RoleAssignment("app-deployer-contributor", {
  principalId: appDeployerSP.objectId,
  principalType: azure.authorization.PrincipalType.ServicePrincipal,
  roleDefinitionId: contributorRoleId,
  scope: resourceGroup.id,
});

// Create a Custom Role for managing Role Assignments (Least Privilege)
const roleAssignmentManagerRole = new azure.authorization.RoleDefinition("app-deployer-iam-role", {
  roleName: "afl-iam-manager",
  description: "Allows managing Role Assignments within the Resource Group",
  scope: resourceGroup.id,
  permissions: [{
    actions: ["Microsoft.Authorization/roleAssignments/write"],
    notActions: [],
  }],
  assignableScopes: [resourceGroup.id],
});

// Grant the Custom Role to the app deployer
new azure.authorization.RoleAssignment("app-deployer-iam-manager", {
  principalId: appDeployerSP.objectId,
  principalType: azure.authorization.PrincipalType.ServicePrincipal,
  roleDefinitionId: roleAssignmentManagerRole.id,
  scope: resourceGroup.id,
});

// 3. Create Managed Identity for backend runtime (equivalent to backend-runtime-sa)
const backendIdentity = new azure.managedidentity.UserAssignedIdentity("backend-runtime-identity", {
  resourceGroupName: resourceGroup.name,
  resourceName: `afl-backend-runtime-${env}`,
  location: location,
  tags: {
    environment: env,
    service: "backend-runtime",
  },
});

// 4. Create Managed Identity for frontend runtime (equivalent to frontend-runtime-sa)
const frontendIdentity = new azure.managedidentity.UserAssignedIdentity("frontend-runtime-identity", {
  resourceGroupName: resourceGroup.name,
  resourceName: `afl-frontend-runtime-${env}`,
  location: location,
  tags: {
    environment: env,
    service: "frontend-runtime",
  },
});

// Exports - Shared platform resources
export const azureResourceGroupName = resourceGroup.name;
export const azureResourceGroupId = resourceGroup.id;
export const azureLocation = pulumi.output(location);
export const azureBackendIdentityClientId = backendIdentity.clientId;
export const azureBackendIdentityPrincipalId = backendIdentity.principalId;
export const azureFrontendIdentityClientId = frontendIdentity.clientId;
export const azureFrontendIdentityPrincipalId = frontendIdentity.principalId;
export const azureAppDeployerClientId = appDeployerApp.clientId;
export const azureAppDeployerSPObjectId = appDeployerSP.objectId;
