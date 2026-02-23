import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { FeaturesService } from "./features.service";
import { CreateFeatureDto } from "./dto/create-feature.dto";
import { ToggleFeatureDto } from "./dto/toggle-feature.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("global")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("GLOBAL_ADMIN")
export class FeaturesController {
  constructor(private featuresService: FeaturesService) {}

  @Get("features")
  findAll() {
    return this.featuresService.findAll();
  }

  @Post("features")
  create(@Body() dto: CreateFeatureDto) {
    return this.featuresService.create(dto);
  }

  @Post("tenants/:id/features")
  toggleForTenant(@Param("id") tenantId: string, @Body() dto: ToggleFeatureDto) {
    return this.featuresService.toggleForTenant(tenantId, dto);
  }
}
