import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const config = new pulumi.Config();
// const gcpConfig = new pulumi.Config("gcp");
const env = pulumi.getStack();

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

for (const repoName of repositoryNames) {
    for (const role of roles) {
        const binding = new gcp.projects.IAMMember(`${repoName}-${role}-binding`, {
            project: projectId,
            role: role,
            member: pulumi.interpolate`principalSet://iam.googleapis.com/projects/${projectId}/locations/global/workloadIdentityPools/${pool}/attribute.repository/${repositoryOrg}/${repoName}`,
        });
    }
}

export const vpcName = vpc.name;
export const publicSubnetName = publicSubnet.name;
export const privateSubnetName = privateSubnet.name;
export const artifactRegistryName = artifactRegistry.name;