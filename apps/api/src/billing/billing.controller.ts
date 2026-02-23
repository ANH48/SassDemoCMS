import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { BillingService } from "./billing.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("global/billing")
@ApiBearerAuth()
@Controller("global/billing")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("GLOBAL_ADMIN")
export class BillingController {
  constructor(private billingService: BillingService) {}

  @ApiOperation({ summary: "Get billing overview (subscriptions + revenue)" })
  @Get()
  getOverview() {
    return this.billingService.getOverview();
  }
}
