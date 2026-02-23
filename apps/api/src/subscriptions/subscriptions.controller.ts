import { Controller, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto, SetRentalFeeDto } from "./dto/update-subscription.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuditAction } from "../common/decorators/audit-action.decorator";

@ApiTags("global/subscriptions")
@ApiBearerAuth()
@Controller("global/subscriptions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("GLOBAL_ADMIN")
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @ApiOperation({ summary: "Create a subscription for a tenant" })
  @AuditAction("CREATE", "subscription")
  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @ApiOperation({ summary: "Update subscription details" })
  @AuditAction("UPDATE", "subscription")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, dto);
  }

  @ApiOperation({ summary: "Set rental fee for a subscription" })
  @AuditAction("SET_RENTAL_FEE", "subscription")
  @Patch(":id/rental-fee")
  setRentalFee(@Param("id") id: string, @Body() dto: SetRentalFeeDto) {
    return this.subscriptionsService.setRentalFee(id, dto);
  }
}
