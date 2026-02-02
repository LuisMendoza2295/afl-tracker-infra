import * as pulumi from "@pulumi/pulumi";

// Import both cloud providers and re-export their outputs
export * from "./gcp/infra";
export * from "./azure/infra";