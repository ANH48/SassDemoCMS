import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { FeaturesService } from "./features.service";
import { CreateFeatureDto } from "./dto/create-feature.dto";
import { ToggleFeatureDto } from "./dto/toggle-feature.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuditAction } from "../common/decorators/audit-action.decorator";

@ApiTags("global/features")
@ApiBearerAuth()
@Controller("global")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("GLOBAL_ADMIN")
export class FeaturesController {
  constructor(private featuresService: FeaturesService) {}

  @ApiOperation({ summary: "List all feature flags" })
  @Get("features")
  findAll() {
    return this.featuresService.findAll();
  }

  @ApiOperation({ summary: "Create a feature flag" })
  @AuditAction("CREATE", "feature")
  @Post("features")
  create(@Body() dto: CreateFeatureDto) {
    return this.featuresService.create(dto);
  }

  @ApiOperation({ summary: "Toggle a feature flag for a tenant" })
  @AuditAction("TOGGLE_FEATURE", "tenant")
  @Post("tenants/:id/features")
  toggleForTenant(@Param("id") tenantId: string, @Body() dto: ToggleFeatureDto) {
    return this.featuresService.toggleForTenant(tenantId, dto);
  }
}
