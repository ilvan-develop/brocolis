import type { BadgeVariant } from "./badge-variant";
import type { NetworkMessageKey } from "./network-i18n";

export type NetworkStageName =
  | "CONSUMER_ORDER"
  | "PHARMACY_CONFIRMATION"
  | "SUPPLIER_PULL"
  | "DELIVERY";

export type NetworkStageStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DELAYED";

export type ResponsibleParty = "PHARMACY" | "SUPPLIER" | "PLATFORM";

export type StockSource = "PHARMACY_STOCK" | "SUPPLIER_PULL";

export const NETWORK_STAGE_ORDER: readonly NetworkStageName[] = [
  "CONSUMER_ORDER",
  "PHARMACY_CONFIRMATION",
  "SUPPLIER_PULL",
  "DELIVERY",
];

export type NetworkStage = {
  stage: NetworkStageName;
  owner: string;
  status: NetworkStageStatus;
  slaAt: Date;
  responsibleParty: ResponsibleParty;
};

export type NetworkStageConfig = {
  stage: NetworkStageName;
  owner: string;
  slaAt: Date;
  responsibleParty: ResponsibleParty;
};

export type NetworkOrderEvent = {
  stage: NetworkStageName;
  at: Date;
};

export function detectSlaBreach(
  stage: Pick<NetworkStage, "status" | "slaAt">,
  now: Date,
): boolean {
  return stage.status !== "COMPLETED" && now.getTime() > stage.slaAt.getTime();
}

function stageIndex(stage: NetworkStageName): number {
  return NETWORK_STAGE_ORDER.indexOf(stage);
}

/**
 * Constrói as etapas da rede B2B2C (Cliente → Farmácia → Fornecedor →
 * Entrega) a partir dos eventos do pedido. Cada etapa mostra dono, estado e
 * SLA; a etapa ainda em curso fica IN_PROGRESS, as futuras PENDING e as que
 * ultrapassaram o SLA sem concluir ficam DELAYED.
 */
export function buildNetworkStages(
  configs: readonly NetworkStageConfig[],
  events: readonly NetworkOrderEvent[],
  now: Date,
): NetworkStage[] {
  const completedAt = new Map<NetworkStageName, Date>();
  for (const event of events) {
    if (event.at.getTime() <= now.getTime()) {
      completedAt.set(event.stage, event.at);
    }
  }

  const ordered = [...configs]
    .filter((config) => stageIndex(config.stage) !== -1)
    .sort((a, b) => stageIndex(a.stage) - stageIndex(b.stage));

  let currentFound = false;
  return ordered.map((config) => {
    const isCompleted = completedAt.has(config.stage);
    let status: NetworkStageStatus;
    if (isCompleted) {
      status = "COMPLETED";
    } else if (!currentFound) {
      currentFound = true;
      status = "IN_PROGRESS";
    } else {
      status = "PENDING";
    }
    const stage: NetworkStage = {
      stage: config.stage,
      owner: config.owner,
      status,
      slaAt: config.slaAt,
      responsibleParty: config.responsibleParty,
    };
    if (detectSlaBreach(stage, now)) {
      stage.status = "DELAYED";
    }
    return stage;
  });
}

/** O fornecedor só é visível quando há etapa SUPPLIER_PULL e a flag permite. */
export function supplierVisible(
  stages: readonly NetworkStage[],
  showSupplier: boolean,
): boolean {
  return (
    showSupplier && stages.some((stage) => stage.stage === "SUPPLIER_PULL")
  );
}

export function visibleStages(
  stages: readonly NetworkStage[],
  showSupplier: boolean,
): NetworkStage[] {
  if (supplierVisible(stages, showSupplier)) {
    return [...stages];
  }
  return stages.filter((stage) => stage.stage !== "SUPPLIER_PULL");
}

export function hasSupplierPull(stages: readonly NetworkStage[]): boolean {
  return stages.some((stage) => stage.stage === "SUPPLIER_PULL");
}

export function stockSourceFor(stages: readonly NetworkStage[]): StockSource {
  const pull = stages.find(
    (stage) =>
      stage.stage === "SUPPLIER_PULL" &&
      (stage.status === "IN_PROGRESS" || stage.status === "COMPLETED"),
  );
  return pull ? "SUPPLIER_PULL" : "PHARMACY_STOCK";
}

export const NETWORK_STAGE_KEY: Record<NetworkStageName, NetworkMessageKey> = {
  CONSUMER_ORDER: "network.stage.consumer_order",
  PHARMACY_CONFIRMATION: "network.stage.pharmacy_confirmation",
  SUPPLIER_PULL: "network.stage.supplier_pull",
  DELIVERY: "network.stage.delivery",
};

export const NETWORK_STATUS_KEY: Record<NetworkStageStatus, NetworkMessageKey> =
  {
    PENDING: "network.status.pending",
    IN_PROGRESS: "network.status.in_progress",
    COMPLETED: "network.status.completed",
    DELAYED: "network.status.delayed",
  };

export const RESPONSIBLE_PARTY_KEY: Record<
  ResponsibleParty,
  NetworkMessageKey
> = {
  PHARMACY: "network.party.pharmacy",
  SUPPLIER: "network.party.supplier",
  PLATFORM: "network.party.platform",
};

export const STOCK_SOURCE_KEY: Record<StockSource, NetworkMessageKey> = {
  PHARMACY_STOCK: "network.stock.pharmacy_stock",
  SUPPLIER_PULL: "network.stock.supplier_pull",
};

export const NETWORK_STATUS_VARIANT: Record<NetworkStageStatus, BadgeVariant> =
  {
    PENDING: "secondary",
    IN_PROGRESS: "default",
    COMPLETED: "outline",
    DELAYED: "destructive",
  };

export const RESPONSIBLE_PARTY_VARIANT: Record<ResponsibleParty, BadgeVariant> =
  {
    PHARMACY: "default",
    SUPPLIER: "secondary",
    PLATFORM: "outline",
  };

export const STOCK_SOURCE_VARIANT: Record<StockSource, BadgeVariant> = {
  PHARMACY_STOCK: "outline",
  SUPPLIER_PULL: "secondary",
};
