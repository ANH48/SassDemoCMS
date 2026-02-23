import { IsOptional, IsString, IsUUID, IsEnum } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { ProductTypeEnum } from "./create-product.dto";

export class QueryProductDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ProductTypeEnum)
  productType?: ProductTypeEnum;

  @IsOptional()
  @IsString()
  status?: string;
}
