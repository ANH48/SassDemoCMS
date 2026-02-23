import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { TenantsService } from "./tenants.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { AuditAction } from "../common/decorators/audit-action.decorator";

@ApiTags("global/tenants")
@ApiBearerAuth()
@Controller("global/tenants")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("GLOBAL_ADMIN")
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @ApiOperation({ summary: "List all tenants (paginated)" })
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.tenantsService.findAll(query.page, query.limit);
  }

  @ApiOperation({ summary: "Get tenant by ID" })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tenantsService.findOne(id);
  }

  @ApiOperation({ summary: "Create and provision a new tenant" })
  @AuditAction("CREATE", "tenant")
  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @ApiOperation({ summary: "Update tenant details" })
  @AuditAction("UPDATE", "tenant")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @ApiOperation({ summary: "Suspend a tenant" })
  @AuditAction("SUSPEND", "tenant")
  @Delete(":id")
  suspend(@Param("id") id: string) {
    return this.tenantsService.suspend(id);
  }
}
