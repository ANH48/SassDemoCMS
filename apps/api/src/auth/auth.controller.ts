import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { GlobalLoginDto } from "./dto/global-login.dto";
import { TenantLoginDto } from "./dto/tenant-login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: "Global admin login" })
  @Post("global/login")
  globalLogin(@Body() dto: GlobalLoginDto) {
    return this.authService.globalLogin(dto);
  }

  @ApiOperation({ summary: "Tenant user login" })
  @Post("tenant/login")
  tenantLogin(@Body() dto: TenantLoginDto) {
    return this.authService.tenantLogin(dto);
  }
}
