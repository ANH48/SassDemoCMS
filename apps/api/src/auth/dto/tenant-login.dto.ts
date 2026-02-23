import { IsEmail, IsString, MinLength } from "class-validator";

export class TenantLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  tenantSlug!: string;
}
