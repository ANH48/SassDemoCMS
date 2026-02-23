import { Module } from "@nestjs/common";
import { RevenueSharesController } from "./revenue-shares.controller";
import { RevenueSharesService } from "./revenue-shares.service";

@Module({
  controllers: [RevenueSharesController],
  providers: [RevenueSharesService],
})
export class RevenueSharesModule {}
