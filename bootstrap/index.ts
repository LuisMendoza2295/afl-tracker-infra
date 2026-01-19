import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const config = new pulumi.Config();

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
    attributeCondition: "attribute.repository == 'LuisMendoza2295/afl-tracker-infra'",
});

// Grant the afl-tracker-infra repo direct access to act as the following roles
// roles: roles/editor, resourcemanager.projectIamAdmin
// Use Direct Resource Access instead of a Service Account for simplicity
const githubRepo = config.require("repositoryName");
const githubOrg = config.require("repositoryOrg");
const editorBinding = new gcp.projects.IAMMember("afl-tracker-infra-editor-binding", {
    project: gcp.config.project!,
    role: "roles/editor",
    member: pulumi.interpolate`principalSet://iam.googleapis.com/${workloadIdentityPool.name}/attribute.repository/${githubOrg}/${githubRepo}`,
});
const iamAdminBinding = new gcp.projects.IAMMember("afl-tracker-infra-iamadmin-binding", {
    project: gcp.config.project!,
    role: "roles/resourcemanager.projectIamAdmin",
    member: pulumi.interpolate`principalSet://iam.googleapis.com/${workloadIdentityPool.name}/attribute.repository/${githubOrg}/${githubRepo}`,
});


export const workloadIdentityPoolName = workloadIdentityPool.name;
export const oidcProviderName = oidcProvider.name;