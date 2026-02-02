import * as pulumi from "@pulumi/pulumi";
import * as azuread from "@pulumi/azuread";
import * as azure from "@pulumi/azure-native";
import { AZURE_BUILT_IN_ROLES } from "./constants";

const config = new pulumi.Config();
const azureConfig = new pulumi.Config("azure-native");

const githubRepo = config.require("repositoryName");
const githubOrg = config.require("repositoryOrg");
const subscriptionId = azureConfig.require("subscriptionId");
const location = azureConfig.get("location") || "eastus";

// 1. Create an Azure AD App Registration (identity for CI/CD)
const infraApp = new azuread.Application("infra-manager-app", {
  displayName: "afl-tracker-infra-manager",
  description: "App Registration for AFL Tracker Infrastructure Manager",
});

// 2. Create a Service Principal for the App
const infraSP = new azuread.ServicePrincipal("infra-manager-sp", {
  clientId: infraApp.clientId,
  appRoleAssignmentRequired: false,
  description: "Service Principal for managing AFL Tracker Infrastructure",
});

// 3. Configure GitHub OIDC Federated Identity Credential
const githubFederatedCred = new azuread.ApplicationFederatedIdentityCredential("github-federated-cred", {
  applicationId: infraApp.id,
  displayName: "github-actions-oidc",
  description: "Federated credential for GitHub Actions OIDC",
  audiences: ["api://AzureADTokenExchange"],
  issuer: "https://token.actions.githubusercontent.com",
  subject: pulumi.interpolate`repo:${githubOrg}/${githubRepo}:ref:refs/heads/main`,
});

// 4. Assign Azure RBAC roles at subscription level
const contributorRoleId = pulumi.interpolate`/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/${AZURE_BUILT_IN_ROLES.CONTRIBUTOR}`;
const userAccessAdminRoleId = pulumi.interpolate`/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/${AZURE_BUILT_IN_ROLES.USER_ACCESS_ADMINISTRATOR}`;

// Contributor allows creating/managing resources
const contributorRoleAssignment = new azure.authorization.RoleAssignment("infra-contributor-role", {
  principalId: infraSP.objectId,
  principalType: azure.authorization.PrincipalType.ServicePrincipal,
  roleDefinitionId: contributorRoleId,
  scope: pulumi.interpolate`/subscriptions/${subscriptionId}`,
});

// User Access Administrator for managing IAM (be cautious with this)
const userAccessAdminRoleAssignment = new azure.authorization.RoleAssignment("infra-useraccess-role", {
  principalId: infraSP.objectId,
  principalType: azure.authorization.PrincipalType.ServicePrincipal,
  roleDefinitionId: userAccessAdminRoleId,
  scope: pulumi.interpolate`/subscriptions/${subscriptionId}`,
});

// Get the current tenant ID from Azure
const clientConfig = azuread.getClientConfigOutput({});

export const azureInfraAppClientId = infraApp.clientId;
export const azureInfraSPObjectId = infraSP.objectId;
export const azureInfraTenantId = clientConfig.tenantId;  // Use actual tenant ID
export const azureSubscriptionIdOutput = subscriptionId;
