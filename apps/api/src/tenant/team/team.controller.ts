import { Controller, Get, Post, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { TeamService } from "./team.service";
import { CreateTeamMemberDto } from "./dto/create-team-member.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { TenantContextGuard } from "../../auth/guards/tenant-context.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../common/decorators/audit-action.decorator";

@ApiTags("tenant/team")
@ApiBearerAuth()
@Controller("tenant/team")
@UseGuards(JwtAuthGuard, RolesGuard, TenantContextGuard)
@Roles("TENANT_ADMIN")
export class TeamController {
  constructor(private service: TeamService) {}

  @ApiOperation({ summary: "List team members" })
  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll((req as any).tenantPrisma);
  }

  @ApiOperation({ summary: "Add a team member" })
  @AuditAction("CREATE", "team-member")
  @Post()
  create(@Req() req: Request, @Body() dto: CreateTeamMemberDto) {
    return this.service.create((req as any).tenantPrisma, dto);
  }
}
