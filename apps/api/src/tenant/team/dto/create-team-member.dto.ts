import { IsString, IsEmail, MinLength, IsEnum, MaxLength } from "class-validator";

export enum TenantUserRoleEnum {
  TENANT_ADMIN = "TENANT_ADMIN",
  TENANT_USER = "TENANT_USER",
}

export class CreateTeamMemberDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(TenantUserRoleEnum)
  role!: TenantUserRoleEnum;
}
