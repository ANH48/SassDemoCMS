import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PlansService } from "./plans.service";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuditAction } from "../common/decorators/audit-action.decorator";

@ApiTags("global/plans")
@ApiBearerAuth()
@Controller("global/plans")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("GLOBAL_ADMIN")
export class PlansController {
  constructor(private plansService: PlansService) {}

  @ApiOperation({ summary: "List all subscription plans" })
  @Get()
  findAll() {
    return this.plansService.findAll();
  }

  @ApiOperation({ summary: "Create a subscription plan" })
  @AuditAction("CREATE", "plan")
  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }
}
