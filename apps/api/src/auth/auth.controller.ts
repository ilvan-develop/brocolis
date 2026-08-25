import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { AuthService } from "./auth.service.js";
import type { PortalCode } from "@brocolis/auth";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { LocalAuthGuard } from "./guards/local-auth.guard.js";
import { RolesGuard } from "./roles.guard.js";

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
    name: string;
    organizationId: string;
    marketCode: string;
    portal: PortalCode;
    roles: string[];
  };
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: "Login com email e password" })
  @ApiResponse({ status: 200, description: "Login efetuado com sucesso" })
  @ApiResponse({ status: 401, description: "Credenciais inválidas" })
  async login(@Request() req: AuthenticatedRequest) {
    const session = await this.authService.issueSession(req.user!.userId);
    return {
      accessToken: session.token,
      expiresAt: session.expiresAt.toISOString(),
      user: {
        id: req.user?.userId,
        email: req.user?.email,
        name: req.user?.name,
        organizationId: req.user?.organizationId,
        marketCode: req.user?.marketCode,
        portal: req.user?.portal,
        roles: req.user?.roles,
      },
    };
  }

  @Post("register")
  @ApiOperation({ summary: "Registar novo utilizador" })
  @ApiResponse({ status: 201, description: "Utilizador criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  @ApiResponse({ status: 409, description: "Email já existe" })
  async register(
    @Body() body: {
      email: string;
      name: string;
      password: string;
      organizationId: string;
      marketCode: string;
      portal: PortalCode;
      roles: string[];
    },
  ) {
    const user = await this.authService.registerUser(body);
    const session = await this.authService.issueSession(user.userId);
    return {
      accessToken: session.token,
      expiresAt: session.expiresAt.toISOString(),
      user: {
        id: user.userId,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
        marketCode: user.marketCode,
        portal: user.portal,
        roles: user.roles,
      },
    };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Obter sessão atual" })
  @ApiResponse({ status: 200, description: "Sessão válida" })
  @ApiResponse({ status: 401, description: "Sessão inválida" })
  async me(@Request() req: AuthenticatedRequest) {
    return {
      user: {
        id: req.user?.userId,
        email: req.user?.email,
        name: req.user?.name,
        organizationId: req.user?.organizationId,
        marketCode: req.user?.marketCode,
        portal: req.user?.portal,
        roles: req.user?.roles,
      },
    };
  }

  @Delete("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Terminar sessão" })
  @ApiResponse({ status: 204, description: "Logout efetuado" })
  @ApiResponse({ status: 401, description: "Sessão inválida" })
  async logout(@Request() req: AuthenticatedRequest) {
    const authHeader = req.headers.get?.("authorization") ?? (req.headers as any)["authorization"];
    const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (token) {
      await this.authService.revokeSession(token);
    }
  }
}
