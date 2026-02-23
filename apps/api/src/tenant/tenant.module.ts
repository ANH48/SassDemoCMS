import { Module } from "@nestjs/common";
import { ProductCategoriesModule } from "./product-categories/product-categories.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { CustomersModule } from "./customers/customers.module";
import { RevenueSharesModule } from "./revenue-shares/revenue-shares.module";
import { ServiceRecordsModule } from "./service-records/service-records.module";
import { TeamModule } from "./team/team.module";

@Module({
  imports: [
    ProductCategoriesModule,
    ProductsModule,
    OrdersModule,
    CustomersModule,
    RevenueSharesModule,
    ServiceRecordsModule,
    TeamModule,
  ],
})
export class TenantModule {}
