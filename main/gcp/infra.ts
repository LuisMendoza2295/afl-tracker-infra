import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const config = new pulumi.Config();
const env = pulumi.getStack();
const currentProject = gcp.organizations.getProject({});
const projectNumber = currentProject.then(project => project.number!);

// Networking
const vpc = new gcp.compute.Network("afl-tracker-vpc", {
    name: "afl-tracker-vpc",
    autoCreateSubnetworks: false,
});

const publicSubnet = new gcp.compute.Subnetwork("public-subnet", {
    name: "public-subnet",
    ipCidrRange: "10.0.1.0/24",
    network: vpc.id,
    region: gcp.config.region!,
    description: "AFL Public subnet",
});

const privateSubnet = new gcp.compute.Subnetwork("private-subnet", {
    name: "private-subnet",
    ipCidrRange: "10.0.2.0/24",
    network: vpc.id,
    region: gcp.config.region!,
    description: "AFL Private subnet",
    privateIpGoogleAccess: true,
});

// Artifact Registry
const artifactRegistry = new gcp.artifactregistry.Repository("afl-tracker-repo", {
    repositoryId: "afl-tracker-repo",
    format: "DOCKER",
    location: gcp.config.region!,
    description: "Artifact Registry for Docker images",
});

// WIF setup for dev projects (frontend/backend) with Github Actions
const pool = config.require("poolName");
const repositoryOrg = config.require("repositoryOrg");
const repositoryNames = config.requireObject<string[]>("repositories");
const roles = config.requireObject<string[]>("wifRoles");
const projectId = gcp.config.project!;

// Service Account for deploying applications
const appDeployerSA = new gcp.serviceaccount.Account("app-deployer-sa", {
    accountId: "app-deployer-sa",
    displayName: "SA for deploying AFL Tracker Applications (Frontend/Backend Repos)",
});

for (const repoName of repositoryNames) {
    new gcp.serviceaccount.IAMMember(`app-deployer-wif-binding-${repoName}`, {
        serviceAccountId: appDeployerSA.name,
        role: "roles/iam.workloadIdentityUser",
        member: pulumi.interpolate`principalSet://iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${pool}/attribute.repository/${repositoryOrg}/${repoName}`,
    });
}
for (const role of roles) {
    new gcp.projects.IAMMember(`app-deployer-role-binding-${role.split("/")[1].replace(".", "-")}`, {
        project: projectId,
        role: role,
        member: pulumi.interpolate`serviceAccount:${appDeployerSA.email}`,
    });
}

// Service Account for the runtime of applications
const backendRuntimeSA = new gcp.serviceaccount.Account("afl-backend-runtime-sa", {
    accountId: "afl-backend-runtime",
    displayName: "Runtime identity for AFL Quarkus Backend Application",
});

const frontendRuntimeSA = new gcp.serviceaccount.Account("afl-frontend-runtime-sa", {
    accountId: "afl-frontend-runtime",
    displayName: "Runtime identity for AFL Vue Frontend Application",
});

export const gcpVpcName = vpc.name;
export const gcpPublicSubnetName = publicSubnet.name;
export const gcpPrivateSubnetName = privateSubnet.name;
export const gcpArtifactRegistryName = artifactRegistry.name;
export const gcpAppDeployerSAEmail = appDeployerSA.email;
export const gcpBackendRuntimeSAEmail = backendRuntimeSA.email;
export const gcpFrontendRuntimeSAEmail = frontendRuntimeSA.email;