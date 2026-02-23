import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("SaaS Multi-Tenant E-Commerce API")
    .setDescription("Global admin and tenant management API")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth",          "Authentication")
    .addTag("global/tenants","Tenant management")
    .addTag("global/plans",  "Plan management")
    .addTag("global/subscriptions", "Subscription management")
    .addTag("global/features",      "Feature flags")
    .addTag("global/billing",       "Billing")
    .addTag("tenant/products",      "Product management (CMS Billing)")
    .addTag("tenant/orders",        "Order management")
    .addTag("tenant/customers",     "Customer management")
    .addTag("tenant/team",          "Team management")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
