import { IsString, IsOptional, IsUUID, IsInt, Min, MaxLength, MinLength } from "class-validator";

export class CreateProductCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
