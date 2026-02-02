/**
 * Azure Built-in Role Definition IDs
 * 
 * These UUIDs are globally consistent across all Azure subscriptions.
 * Reference: https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles
 */
export const AZURE_BUILT_IN_ROLES = {
  /**
   * Contributor - Grants full access to manage all resources, but does not allow you to assign roles in Azure RBAC,
   * manage assignments in Azure Blueprints, or share image galleries.
   */
  CONTRIBUTOR: "b24988ac-6180-42a0-ab88-20f7382dd24c",

  /**
   * User Access Administrator - Lets you manage user access to Azure resources.
   */
  USER_ACCESS_ADMINISTRATOR: "18d7d88d-d35e-4fb5-a5c3-7773c20a72d9",

  /**
   * Owner - Grants full access to manage all resources, including the ability to assign roles in Azure RBAC.
   */
  OWNER: "8e3af657-a8ff-443c-a75c-2fe8c4bcb635",

  /**
   * Reader - View all resources, but does not allow you to make any changes.
   */
  READER: "acdd72a7-3385-48ef-bd42-f606fba81ae7",
} as const;
