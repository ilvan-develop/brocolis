import {
  addToCartInputSchema,
  getCartInputSchema,
  removeCartItemInputSchema,
  updateCartItemInputSchema,
} from "@brocolis/contracts";
import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import type { CatalogService } from "../catalog/catalog.service.js";
import { nextCuid } from "../cuid.js";

export type CartItemRecord = {
  productId: string;
  pharmacyId: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  currency: string;
};

export type CartRecord = {
  id: string;
  sessionId: string;
  organizationId: string;
  marketCode: string;
  items: CartItemRecord[];
  subtotalMinor: number;
  itemCount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

const keyOf = (sessionId: string, organizationId: string, marketCode: string) =>
  `${sessionId}:${organizationId}:${marketCode}`;

const sumItems = (items: readonly CartItemRecord[]) =>
  items.reduce((sum, item) => sum + item.unitPriceMinor * item.quantity, 0);

const countItems = (items: readonly CartItemRecord[]) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

/**
 * Carrinho F2 — multi-farmácia, chaveado por sessão + tenant + mercado.
 * O preço unitário vem sempre do catálogo (nunca do cliente).
 */
@Injectable()
export class CartService {
  private readonly carts = new Map<string, CartRecord>();

  constructor(@Optional() private readonly catalog?: CatalogService) {}

  add(sessionId: string, input: unknown): CartRecord {
    const parsed = addToCartInputSchema.parse(input);
    const cart = this.ensureCart(
      sessionId,
      parsed.organizationId,
      parsed.marketCode,
    );
    const existing = cart.items.find(
      (item) =>
        item.productId === parsed.productId &&
        item.pharmacyId === parsed.pharmacyId,
    );
    if (existing) {
      existing.quantity += parsed.quantity;
      existing.lineTotalMinor = existing.unitPriceMinor * existing.quantity;
    } else {
      const offer = this.pricedOffer(
        parsed.organizationId,
        parsed.marketCode,
        parsed.productId,
        parsed.pharmacyId,
      );
      cart.items.push({
        productId: parsed.productId,
        pharmacyId: parsed.pharmacyId,
        quantity: parsed.quantity,
        unitPriceMinor: offer.priceMinor,
        lineTotalMinor: offer.priceMinor * parsed.quantity,
        currency: offer.currency,
      });
    }
    cart.subtotalMinor = sumItems(cart.items);
    cart.itemCount = countItems(cart.items);
    cart.updatedAt = new Date();
    return cart;
  }

  update(sessionId: string, input: unknown): CartRecord {
    const parsed = updateCartItemInputSchema.parse(input);
    const cart = this.ensureCart(
      sessionId,
      parsed.organizationId,
      parsed.marketCode,
    );
    const item = cart.items.find(
      (i) =>
        i.productId === parsed.productId && i.pharmacyId === parsed.pharmacyId,
    );
    if (!item) {
      throw new NotFoundException("Item não está no carrinho");
    }
    item.quantity = parsed.quantity;
    item.lineTotalMinor = item.unitPriceMinor * item.quantity;
    cart.subtotalMinor = sumItems(cart.items);
    cart.itemCount = countItems(cart.items);
    cart.updatedAt = new Date();
    return cart;
  }

  remove(sessionId: string, input: unknown): CartRecord {
    const parsed = removeCartItemInputSchema.parse(input);
    const cart = this.ensureCart(
      sessionId,
      parsed.organizationId,
      parsed.marketCode,
    );
    cart.items = cart.items.filter(
      (i) =>
        !(
          i.productId === parsed.productId && i.pharmacyId === parsed.pharmacyId
        ),
    );
    cart.subtotalMinor = sumItems(cart.items);
    cart.itemCount = countItems(cart.items);
    cart.updatedAt = new Date();
    return cart;
  }

  get(sessionId: string, input: unknown): CartRecord {
    const parsed = getCartInputSchema.parse(input);
    return this.ensureCart(sessionId, parsed.organizationId, parsed.marketCode);
  }

  clear(sessionId: string, input: unknown): CartRecord {
    const parsed = getCartInputSchema.parse(input);
    const cart = this.ensureCart(
      sessionId,
      parsed.organizationId,
      parsed.marketCode,
    );
    cart.items = [];
    cart.subtotalMinor = 0;
    cart.itemCount = 0;
    cart.updatedAt = new Date();
    return cart;
  }

  private ensureCart(
    sessionId: string,
    organizationId: string,
    marketCode: string,
  ): CartRecord {
    const key = keyOf(sessionId, organizationId, marketCode);
    const existing = this.carts.get(key);
    if (existing) {
      return existing;
    }
    const now = new Date();
    const cart: CartRecord = {
      id: nextCuid(),
      sessionId,
      organizationId,
      marketCode,
      items: [],
      subtotalMinor: 0,
      itemCount: 0,
      currency: "AOA",
      createdAt: now,
      updatedAt: now,
    };
    this.carts.set(key, cart);
    return cart;
  }

  private pricedOffer(
    organizationId: string,
    marketCode: string,
    productId: string,
    pharmacyId: string,
  ) {
    if (!this.catalog) {
      throw new NotFoundException(
        "Catálogo indisponível para precificar o item",
      );
    }
    return this.catalog.getOffer(
      organizationId,
      marketCode,
      productId,
      pharmacyId,
    );
  }
}
