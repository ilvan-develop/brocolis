import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@brocolis/db/src/generated/prisma/client.js";

@Injectable()
export class PrismaService
  extends PrismaClient<never, never, never>
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await (this as any).$connect();
  }

  async onModuleDestroy() {
    await (this as any).$disconnect();
  }
}
