import { IsString, IsNumber, IsOptional, Min } from "class-validator";

export class UpdateSubscriptionDto {
  @IsString()
  @IsOptional()
  planId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  billingCycle?: string;
}

export class SetRentalFeeDto {
  @IsNumber()
  @Min(0)
  rentalFee!: number;
}
