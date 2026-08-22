import { can } from "@brocolis/auth";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

export type RequireAction = {
  action: string;
  resource: string;
};

export type RolesGuardOptions = {
  portal?: string;
  requiredRoles?: string[];
  requiredActions?: RequireAction[];
};

export type AuthenticatedUser = {
  userId: string;
  roles?: string[];
  portal?: string;
};

export type AuthenticatedRequest = {
  user?: AuthenticatedUser;
};

/**
 * RolesGuard — valida `request.user.roles` e o portal da sessão.
 * Uso: `new RolesGuard('PHARMACY')` ou `new RolesGuard({ requiredRoles: ['OWNER'] })`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly options: RolesGuardOptions;

  constructor(options: string | RolesGuardOptions = {}) {
    this.options = typeof options === "string" ? { portal: options } : options;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user?.userId) {
      throw new UnauthorizedException("Sessão não autenticada");
    }
    const roles = user.roles ?? [];
    const { portal, requiredRoles, requiredActions } = this.options;

    if (portal && user.portal !== portal) {
      throw new ForbiddenException(
        `Acesso negado para o portal ${user.portal ?? "desconhecido"}`,
      );
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const allowed = requiredRoles.some((role) => roles.includes(role));
      if (!allowed) {
        throw new ForbiddenException("Role exigida em falta");
      }
    }

    if (requiredActions && requiredActions.length > 0) {
      const allowed = requiredActions.every(({ action, resource }) =>
        roles.some((role) => can(role, action, resource)),
      );
      if (!allowed) {
        throw new ForbiddenException("Permissão em falta");
      }
    }

    return true;
  }
}
