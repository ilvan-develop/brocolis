import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "../auth/auth.service.js";

type UserSession = {
  userId: string;
  organizationId: string;
  marketCode: string;
  portal: string;
  roles: string[];
};

interface UserRequest extends Request {
  user?: UserSession | undefined;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: UserRequest, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.slice(7);
    try {
      const session = await this.authService.requireSession(token);
      req.user = {
        userId: session.userId,
        organizationId: session.organizationId,
        marketCode: session.marketCode,
        portal: session.portal,
        roles: session.roles,
      };
    } catch {
      req.user = undefined;
    }

    next();
  }
}
