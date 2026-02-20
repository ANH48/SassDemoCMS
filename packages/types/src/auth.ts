export type UserRole =
  | "GLOBAL_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_USER";

export type TokenType = "global" | "tenant";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: TokenType;
  tenantId?: string;
  tenantSlug?: string;
}
