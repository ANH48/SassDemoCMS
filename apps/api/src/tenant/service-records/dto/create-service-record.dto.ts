import { IsUUID, IsOptional, IsString } from "class-validator";

export class CreateServiceRecordDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  customerId!: string;

  @IsUUID()
  staffId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
