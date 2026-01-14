import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const config = new pulumi.Config();
const gcpConfig = new pulumi.Config("gcp");

const poolId = config.require("workload-identity-pool-id");
const providerId = config.require("workload-identity-provider-id");

// Create the WIF
const githubPool = new gcp.iam.WorkloadIdentityPool("github-pool", {
  workloadIdentityPoolId: "wif-github-pool",
  displayName: "WIF Pool for Github actions"
});

// Create OIDC   Provider for Github
const providerName = "github-provider";
const githubProvider = new gcp.iam.WorkloadIdentityPoolProvider(providerName, {
  displayName: "WIF Github Provider",
  workloadIdentityPoolId: githubPool.workloadIdentityPoolId,
  workloadIdentityPoolProviderId: providerName,
  attributeMapping: {
    "google.subject": "assertion.sub",
    "attribute.repository": "assertion.repository"
  },
  oidc: {
    issuerUri: "https://token.actions.githubusercontent.com",
  },
});