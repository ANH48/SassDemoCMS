import { Controller, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto, SetRentalFeeDto } from "./dto/update-subscription.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("global/subscriptions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("GLOBAL_ADMIN")
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, dto);
  }

  @Patch(":id/rental-fee")
  setRentalFee(@Param("id") id: string, @Body() dto: SetRentalFeeDto) {
    return this.subscriptionsService.setRentalFee(id, dto);
  }
}
