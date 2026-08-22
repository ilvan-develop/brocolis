import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";

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
  private readonly accounts = new Map<string, CreditAccountRecord>();
  private readonly byOrgSupplier = new Map<string, string>();

  create(input: CreateCreditAccountInput): CreditAccountRecord {
    const key = `${input.organizationId}:${input.supplierId}`;
    const existing = this.byOrgSupplier.get(key);
    if (existing) {
      const acc = this.accounts.get(existing);
      if (acc) return acc;
    }
    const id = nextCuid();
    const now = new Date();
    const record: CreditAccountRecord = {
      id,
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      supplierId: input.supplierId,
      creditLimitMinor: input.creditLimitMinor,
      balanceMinor: 0,
      currency: input.currency ?? "AOA",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    this.accounts.set(id, record);
    this.byOrgSupplier.set(key, id);
    return record;
  }

  check(input: CheckCreditInput): {
    available: boolean;
    creditLimitMinor: number;
    balanceMinor: number;
    requestedMinor: number;
  } {
    const key = `${input.organizationId}:${input.supplierId}`;
    const accountId = this.byOrgSupplier.get(key);
    if (!accountId) {
      throw new NotFoundException(
        `Conta de crédito não encontrada para fornecedor ${input.supplierId}`,
      );
    }
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new NotFoundException("Conta de crédito não encontrada");
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
    const key = `${organizationId}:${supplierId}`;
    const accountId = this.byOrgSupplier.get(key);
    if (!accountId) {
      throw new NotFoundException("Conta de crédito não encontrada");
    }
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new NotFoundException("Conta de crédito não encontrada");
    }
    if (account.status !== "ACTIVE") {
      throw new BadRequestException("Conta de crédito não está activa");
    }
    if (account.balanceMinor + amountMinor > account.creditLimitMinor) {
      throw new BadRequestException("Limite de crédito excedido");
    }
    account.balanceMinor += amountMinor;
    account.updatedAt = new Date();
    return account;
  }

  credit(
    organizationId: string,
    supplierId: string,
    amountMinor: number,
  ): CreditAccountRecord {
    const key = `${organizationId}:${supplierId}`;
    const accountId = this.byOrgSupplier.get(key);
    if (!accountId) {
      throw new NotFoundException("Conta de crédito não encontrada");
    }
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new NotFoundException("Conta de crédito não encontrada");
    }
    account.balanceMinor = Math.max(0, account.balanceMinor - amountMinor);
    account.updatedAt = new Date();
    return account;
  }

  getAccount(
    organizationId: string,
    supplierId: string,
  ): CreditAccountRecord | null {
    const key = `${organizationId}:${supplierId}`;
    const accountId = this.byOrgSupplier.get(key);
    if (!accountId) return null;
    return this.accounts.get(accountId) ?? null;
  }
}
