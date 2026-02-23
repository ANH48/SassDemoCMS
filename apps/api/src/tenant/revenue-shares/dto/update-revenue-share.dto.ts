import { IsString, IsNumber, IsOptional, Min, Max, MaxLength } from "class-validator";

export class UpdateRevenueShareDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsString()
  type?: string;
}
