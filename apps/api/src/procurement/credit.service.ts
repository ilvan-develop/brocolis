import { database } from "@brocolis/db";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

export type CreditAccountRecord = {
  id: string;
  organizationId: string;
  marketCode: string;
  supplierId: string;
  creditLimitMinor: number;
  balanceMinor: number;
  currency: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCreditAccountInput = {
  organizationId: string;
  marketCode: string;
  supplierId: string;
  creditLimitMinor: number;
  currency?: string;
};

export type CheckCreditInput = {
  organizationId: string;
  marketCode: string;
  supplierId: string;
  amountMinor: number;
};

@Injectable()
export class CreditService {
  create(input: CreateCreditAccountInput): CreditAccountRecord {
    const existing = database().creditAccount.findFirst({
      where: {
        organizationId: input.organizationId,
        supplierId: input.supplierId,
      },
    });
    if (existing) {
      return existing as CreditAccountRecord;
    }
    const record = database().creditAccount.create({
      data: {
        organizationId: input.organizationId,
        marketCode: input.marketCode,
        supplierId: input.supplierId,
        creditLimitMinor: input.creditLimitMinor,
        balanceMinor: 0,
        currency: input.currency ?? "AOA",
        status: "ACTIVE",
      },
    });
    return record as CreditAccountRecord;
  }

  check(input: CheckCreditInput): {
    available: boolean;
    creditLimitMinor: number;
    balanceMinor: number;
    requestedMinor: number;
  } {
    const account = database().creditAccount.findFirst({
      where: {
        organizationId: input.organizationId,
        supplierId: input.supplierId,
      },
    });
    if (!account) {
      throw new NotFoundException(
        `Conta de crédito não encontrada para fornecedor ${input.supplierId}`,
      );
    }
    if (account.status !== "ACTIVE") {
      return {
        available: false,
        creditLimitMinor: account.creditLimitMinor,
        balanceMinor: account.balanceMinor,
        requestedMinor: input.amountMinor,
      };
    }
    const available =
      account.balanceMinor + input.amountMinor <= account.creditLimitMinor;
    return {
      available,
      creditLimitMinor: account.creditLimitMinor,
      balanceMinor: account.balanceMinor,
      requestedMinor: input.amountMinor,
    };
  }

  debit(
    organizationId: string,
    supplierId: string,
    amountMinor: number,
  ): CreditAccountRecord {
    const account = database().creditAccount.findFirst({
      where: { organizationId, supplierId },
    });
    if (!account) {
      throw new NotFoundException("Conta de crédito não encontrada");
    }
    if (account.status !== "ACTIVE") {
      throw new BadRequestException("Conta de crédito não está activa");
    }
    if (account.balanceMinor + amountMinor > account.creditLimitMinor) {
      throw new BadRequestException("Limite de crédito excedido");
    }
    const updated = database().creditAccount.update({
      where: { id: account.id },
      data: {
        balanceMinor: account.balanceMinor + amountMinor,
        updatedAt: new Date(),
      },
    });
    return updated as CreditAccountRecord;
  }

  credit(
    organizationId: string,
    supplierId: string,
    amountMinor: number,
  ): CreditAccountRecord {
    const account = database().creditAccount.findFirst({
      where: { organizationId, supplierId },
    });
    if (!account) {
      throw new NotFoundException("Conta de crédito não encontrada");
    }
    const updated = database().creditAccount.update({
      where: { id: account.id },
      data: {
        balanceMinor: Math.max(0, account.balanceMinor - amountMinor),
        updatedAt: new Date(),
      },
    });
    return updated as CreditAccountRecord;
  }

  getAccount(
    organizationId: string,
    supplierId: string,
  ): CreditAccountRecord | null {
    const account = database().creditAccount.findFirst({
      where: { organizationId, supplierId },
    });
    return (account ?? null) as CreditAccountRecord | null;
  }
}
