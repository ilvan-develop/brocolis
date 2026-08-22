import { api } from "@/lib/api";
import { offlineCache } from "@/lib/offline";

/**
 * Fila local de pedidos pendentes (offline-first).
 *
 * Quando a criação de um pedido falha por falta de rede, o pedido é
 * persistido localmente (SecureStore, via `offlineCache`) em vez de ser
 * perdido. `syncQueuedOrders` tenta reenviar os pedidos pendentes — é
 * chamado quando a app volta ao primeiro plano (ver `providers/query-provider`).
 */

const QUEUE_KEY = "pending-orders";
const MAX_RETRIES = 5;

export type QueuedOrderPayload = {
  organizationId: string;
  marketCode: string;
  items: Array<{
    productId: string;
    pharmacyId: string;
    quantity: number;
  }>;
  deliveryAddress?: {
    zone: string;
    addressLine: string;
    city?: string;
    referencePoint?: string;
  };
};

export type QueuedOrder = QueuedOrderPayload & {
  id: string;
  queuedAt: number;
  retryCount: number;
};

export type QueueStorage = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
};

const defaultStorage: QueueStorage = offlineCache;

/**
 * Decide se um erro é uma falha de rede (candidata a retry offline) em vez de
 * um erro de negócio/validação vindo da API (que não deve ser reenfileirado
 * indefinidamente).
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    return /network|fetch|offline|failed to connect|timed? ?out/i.test(
      error.message,
    );
  }
  return false;
}

function generateId(): string {
  return `queued_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getQueuedOrders(
  storage: QueueStorage = defaultStorage,
): Promise<QueuedOrder[]> {
  const list = await storage.get<QueuedOrder[]>(QUEUE_KEY);
  return list ?? [];
}

export async function enqueueOrder(
  payload: QueuedOrderPayload,
  storage: QueueStorage = defaultStorage,
): Promise<QueuedOrder> {
  const queue = await getQueuedOrders(storage);
  const entry: QueuedOrder = {
    ...payload,
    id: generateId(),
    queuedAt: Date.now(),
    retryCount: 0,
  };
  await storage.set<QueuedOrder[]>(QUEUE_KEY, [...queue, entry]);
  return entry;
}

export async function removeQueuedOrder(
  id: string,
  storage: QueueStorage = defaultStorage,
): Promise<void> {
  const queue = await getQueuedOrders(storage);
  await storage.set<QueuedOrder[]>(
    QUEUE_KEY,
    queue.filter((order) => order.id !== id),
  );
}

export async function clearQueuedOrders(
  storage: QueueStorage = defaultStorage,
): Promise<void> {
  await storage.set<QueuedOrder[]>(QUEUE_KEY, []);
}

export type SyncResult = {
  synced: string[];
  failed: string[];
  dropped: string[];
};

type CreateOrderFn = (
  organizationId: string,
  marketCode: string,
  data: {
    items: QueuedOrderPayload["items"];
    deliveryAddress?: QueuedOrderPayload["deliveryAddress"];
  },
) => Promise<unknown>;

/**
 * Tenta reenviar todos os pedidos pendentes. Pedidos que sincronizam com
 * sucesso, ou que excedem MAX_RETRIES, saem da fila; os restantes ficam para
 * a próxima tentativa com o contador de retries incrementado.
 */
export async function syncQueuedOrders(
  createOrder: CreateOrderFn = api.order.create,
  storage: QueueStorage = defaultStorage,
): Promise<SyncResult> {
  const queue = await getQueuedOrders(storage);
  const synced: string[] = [];
  const failed: string[] = [];
  const dropped: string[] = [];
  const remaining: QueuedOrder[] = [];

  for (const order of queue) {
    try {
      await createOrder(order.organizationId, order.marketCode, {
        items: order.items,
        deliveryAddress: order.deliveryAddress,
      });
      synced.push(order.id);
    } catch (error) {
      const stillNetworkIssue = isNetworkError(error);
      const nextRetryCount = order.retryCount + 1;

      if (stillNetworkIssue && nextRetryCount < MAX_RETRIES) {
        remaining.push({ ...order, retryCount: nextRetryCount });
        failed.push(order.id);
      } else {
        // Erro persistente de negócio, ou excedeu o número de tentativas:
        // não faz sentido continuar a tentar silenciosamente.
        dropped.push(order.id);
      }
    }
  }

  await storage.set<QueuedOrder[]>(QUEUE_KEY, remaining);
  return { synced, failed, dropped };
}
