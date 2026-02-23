import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { GlobalPrismaClient } from "@repo/database";

@Injectable()
export class GlobalPrismaService
  extends GlobalPrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
