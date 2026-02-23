import {
  IsString, IsOptional, IsUUID, IsNumber, IsInt, IsBoolean, IsEnum,
  Min, Max, MaxLength, MinLength,
} from "class-validator";
import { ProductTypeEnum } from "./create-product.dto";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductTypeEnum)
  productType?: ProductTypeEnum;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice1?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice3?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice4?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  importPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  dosageUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  conversionRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate1?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate3?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  treatmentCycleDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  treatmentSessions?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isOpenPrice?: boolean;
}
