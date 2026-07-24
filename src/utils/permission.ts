export function hasPermission(permissions: string[] | undefined, code: string): boolean {
  if (!permissions?.length) return false;
  if (permissions.includes('*')) return true;
  return permissions.includes(code);
}

export function hasAnyPermission(permissions: string[] | undefined, codes: string[]): boolean {
  return codes.some((code) => hasPermission(permissions, code));
}

export function isTenantAdmin(permissions?: string[], isTenantAdminFlag?: boolean): boolean {
  if (isTenantAdminFlag) return true;
  return hasPermission(permissions, '*');
}
