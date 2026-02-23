import { IsUUID, IsInt, Min } from "class-validator";

export class AddPackageItemDto {
  @IsUUID()
  childProductId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
