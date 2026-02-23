import { Type } from "class-transformer";
import {
  IsUUID, IsInt, IsNumber, IsOptional, IsArray, Min, Max, ValidateNested,
} from "class-validator";

export class CreateOrderItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  priceTier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsUUID()
  staffId?: string;
}

export class CreateOrderDto {
  @IsUUID()
  customerId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
