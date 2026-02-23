import { IsString, IsBoolean } from "class-validator";

export class ToggleFeatureDto {
  @IsString()
  featureId!: string;

  @IsBoolean()
  enabled!: boolean;
}
