import { Controller, Get, UseGuards } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("global/billing")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("GLOBAL_ADMIN")
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get()
  getOverview() {
    return this.billingService.getOverview();
  }
}
