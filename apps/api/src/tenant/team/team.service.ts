import { Injectable, ConflictException } from "@nestjs/common";
import { TenantPrismaClient } from "@repo/database";
import * as bcrypt from "bcrypt";
import { CreateTeamMemberDto } from "./dto/create-team-member.dto";

@Injectable()
export class TeamService {
  async findAll(prisma: TenantPrismaClient) {
    return prisma.tenantUser.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(prisma: TenantPrismaClient, dto: CreateTeamMemberDto) {
    const existing = await prisma.tenantUser.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Email already in use");

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return prisma.tenantUser.create({
      data: { name: dto.name, email: dto.email, password: hashedPassword, role: dto.role },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }
}
