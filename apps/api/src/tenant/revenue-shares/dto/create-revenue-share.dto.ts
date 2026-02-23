import { IsString, IsNumber, Min, Max, MaxLength } from "class-validator";

export class CreateRevenueShareDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage!: number;

  @IsString()
  type!: string;
}
