import { IsString, IsNumber, Min, MinLength } from "class-validator";

export class CreatePlanDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(1)
  maxProducts!: number;

  @IsNumber()
  @Min(1)
  maxUsers!: number;
}
