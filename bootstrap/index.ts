import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const config = new pulumi.Config();

const githubRepo = config.require("repositoryName");
const githubOrg = config.require("repositoryOrg");

const currentProject = gcp.organizations.getProject({});
const projectNumber = currentProject.then(project => project.number!);

// Create the Workload Identity Pool (WIF)
const poolId = "afl-tracker-infra-pool";
const workloadIdentityPool = new gcp.iam.WorkloadIdentityPool("infra-pool", {
    workloadIdentityPoolId: poolId,
    description: "Workload Identity Federation Pool for AFL Tracker",
    displayName: "AFL Tracker WIF Pool",
    disabled: false,
});

// Create the OIDC Provider for GitHub Actions
const providerId = "afl-github-infra-provider";
const oidcProvider = new gcp.iam.WorkloadIdentityPoolProvider("infra-provider", {
    workloadIdentityPoolId: workloadIdentityPool.workloadIdentityPoolId,
    workloadIdentityPoolProviderId: providerId,
    displayName: "GitHub Actions OIDC Provider",
    description: "OIDC Provider for GitHub Actions to access GCP resources",
    oidc: {
        issuerUri: "https://token.actions.githubusercontent.com",
    },
    attributeMapping: {
        "google.subject": "assertion.sub",
        "attribute.actor": "assertion.actor",
        "attribute.repository": "assertion.repository",
    },
    attributeCondition: `attribute.repository == '${githubOrg}/${githubRepo}'`,
});

// Use Service Account Impersonation with the WIF pool and provider (Cannot use Direct Resource Access as we don't have an Organization)
const infraManagerSA = new gcp.serviceaccount.Account("infra-manager-sa", {
    accountId: "infra-manager-sa",
    displayName: "SA for managing AFL Tracker Infrastructure (Infra Repo)",
});

// Grant the afl-tracker-infra repo direct access to act as the following roles
// roles: roles/editor, resourcemanager.projectIamAdmin
const roles = ["roles/editor", "roles/resourcemanager.projectIamAdmin", "roles/iam.serviceAccountAdmin"];
const editorBinding = new gcp.projects.IAMMember("afl-tracker-infra-editor-binding", {
    project: gcp.config.project!,
    role: "roles/editor",
    member: pulumi.interpolate`serviceAccount:${infraManagerSA.email}`,
});
const iamAdminBinding = new gcp.projects.IAMMember("afl-tracker-infra-iamadmin-binding", {
    project: gcp.config.project!,
    role: "roles/resourcemanager.projectIamAdmin",
    member: pulumi.interpolate`serviceAccount:${infraManagerSA.email}`,
});
const serviceAccountAdminBinding = new gcp.projects.IAMMember("afl-tracker-infra-saadmin-binding", {
    project: gcp.config.project!,
    role: "roles/iam.serviceAccountAdmin",
    member: pulumi.interpolate`serviceAccount:${infraManagerSA.email}`,
});

// Grant the WIF pool the iam.workloadIdentityUser role on the infraManagerSA (Allow impersonation)
const infraManagerSABinding = new gcp.serviceaccount.IAMMember("infra-sa-to-impersonate", {
    serviceAccountId: infraManagerSA.name,
    role: "roles/iam.workloadIdentityUser",
    member: pulumi.interpolate`principalSet://iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/attribute.repository/${githubOrg}/${githubRepo}`,
});

export const workloadIdentityPoolName = workloadIdentityPool.name;
export const oidcProviderName = oidcProvider.name;
export const infraManagerSAEmail = infraManagerSA.email;