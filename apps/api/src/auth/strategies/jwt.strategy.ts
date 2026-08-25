import { Injectable } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AuthService } from "../auth.service.js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") ?? "change-me-in-production",
    });
  }

  async validate(payload: { sub: string; email: string; roles?: string[] }) {
    try {
      const session = await this.authService.requireSession(payload.sub);
      return {
        userId: session.userId,
        email: payload.email,
        organizationId: session.organizationId,
        marketCode: session.marketCode,
        portal: session.portal,
        roles: session.roles,
      };
    } catch {
      return null;
    }
  }
}
