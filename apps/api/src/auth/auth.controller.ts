import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { GlobalLoginDto } from "./dto/global-login.dto";
import { TenantLoginDto } from "./dto/tenant-login.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("global/login")
  globalLogin(@Body() dto: GlobalLoginDto) {
    return this.authService.globalLogin(dto);
  }

  @Post("tenant/login")
  tenantLogin(@Body() dto: TenantLoginDto) {
    return this.authService.tenantLogin(dto);
  }
}
