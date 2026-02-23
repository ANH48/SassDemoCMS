import { IsString, IsEmail, MinLength, Matches, IsOptional } from "class-validator";

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9][a-z0-9_-]*$/, {
    message: "Slug must be lowercase alphanumeric with optional hyphens/underscores",
  })
  slug!: string;

  @IsString()
  @IsOptional()
  planId?: string;

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(6)
  adminPassword!: string;

  @IsString()
  @MinLength(2)
  adminName!: string;
}
