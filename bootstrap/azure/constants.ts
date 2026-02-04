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

/**
 * Azure AD Directory Role Template IDs
 * 
 * These UUIDs are globally consistent across all Azure AD tenants.
 * Directory Roles grant administrative privileges within Azure AD.
 * Reference: https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/permissions-reference
 */
export const AZURE_DIRECTORY_ROLES = {
  /**
   * Cloud Application Administrator - Can create and manage all aspects of app registrations and enterprise apps
   * except App Proxy. Cannot manage applications with high-privilege permissions.
   */
  CLOUD_APPLICATION_ADMINISTRATOR: "158c047a-c907-4556-b7ef-446551a6b5f7",

  /**
   * Application Administrator - Can create and manage all aspects of app registrations and enterprise apps.
   */
  APPLICATION_ADMINISTRATOR: "9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3",
} as const;
