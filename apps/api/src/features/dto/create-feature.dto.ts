import { IsString, MinLength, IsOptional } from "class-validator";

export class CreateFeatureDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
