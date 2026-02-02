/**
 * Azure Built-in Role Definition IDs
 * These UUIDs are consistent across all Azure subscriptions
 * Reference: https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles
 */
export const AZURE_BUILT_IN_ROLES = {
  // Resource Management
  CONTRIBUTOR: "b24988ac-6180-42a0-ab88-20f7382dd24c",

  // Cognitive Services
  COGNITIVE_SERVICES_USER: "a97b65f3-24c7-4388-baec-2e87135dc908",
  COGNITIVE_SERVICES_CONTRIBUTOR: "25fbc0a9-bd7c-42a3-aa1a-3b75d497ee68",
} as const;
