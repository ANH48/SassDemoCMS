import { RolesGuard } from "./roles.guard";
import { Reflector } from "@nestjs/core";
import { ForbiddenException } from "@nestjs/common";
import { ExecutionContext } from "@nestjs/common";

function makeContext(role: string, requiredRoles: string[] | undefined): ExecutionContext {
  const reflector = new Reflector();
  jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(requiredRoles as any);
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    getHandler: () => ({}),
    getClass:   () => ({}),
  } as any;
}

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it("allows when no roles required", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    const ctx = makeContext("TENANT_USER", undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("allows when user has required role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["GLOBAL_ADMIN"]);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: "GLOBAL_ADMIN" } }) }),
      getHandler: () => ({}),
      getClass:   () => ({}),
    } as any;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("throws ForbiddenException when user lacks role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["GLOBAL_ADMIN"]);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: "TENANT_USER" } }) }),
      getHandler: () => ({}),
      getClass:   () => ({}),
    } as any;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("throws ForbiddenException when no user", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["GLOBAL_ADMIN"]);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: null }) }),
      getHandler: () => ({}),
      getClass:   () => ({}),
    } as any;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
