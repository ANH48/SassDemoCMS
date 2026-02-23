import { IsString } from "class-validator";

export class CreateSubscriptionDto {
  @IsString()
  tenantId!: string;

  @IsString()
  planId!: string;
}
