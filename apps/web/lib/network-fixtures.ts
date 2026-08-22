import {
  buildNetworkStages,
  type NetworkOrderEvent,
  type NetworkStage,
  type NetworkStageConfig,
} from "./network-timeline";

export const DEMO_ORDER_ID = "c000000000000000000000301";

const T0 = new Date("2026-08-20T09:00:00Z");
const HOUR = 60 * 60 * 1000;

function at(hoursAfterT0: number): Date {
  return new Date(T0.getTime() + hoursAfterT0 * HOUR);
}

export const DEMO_NETWORK_STAGE_CONFIGS: readonly NetworkStageConfig[] = [
  {
    stage: "CONSUMER_ORDER",
    owner: "João Manuel",
    slaAt: at(1),
    responsibleParty: "PLATFORM",
  },
  {
    stage: "PHARMACY_CONFIRMATION",
    owner: "Farmácia Sagrada Esperança",
    slaAt: at(4),
    responsibleParty: "PHARMACY",
  },
  {
    stage: "SUPPLIER_PULL",
    owner: "Angomed Distribuição",
    slaAt: at(24),
    responsibleParty: "SUPPLIER",
  },
  {
    stage: "DELIVERY",
    owner: "Estafeta Brócolis #12",
    slaAt: at(32),
    responsibleParty: "PHARMACY",
  },
];

/** Encomenda B2B2C completa: cliente → farmácia → fornecedor → entrega. */
export const DEMO_B2B2C_ORDER_EVENTS: readonly NetworkOrderEvent[] = [
  { stage: "CONSUMER_ORDER", at: at(0) },
  { stage: "PHARMACY_CONFIRMATION", at: at(2) },
  { stage: "SUPPLIER_PULL", at: at(18) },
  { stage: "DELIVERY", at: at(30) },
];

export function demoCompletedTimeline(now: Date = at(31)): NetworkStage[] {
  return buildNetworkStages(
    DEMO_NETWORK_STAGE_CONFIGS,
    DEMO_B2B2C_ORDER_EVENTS,
    now,
  );
}

/** Encomenda a meio, com a etapa do fornecedor em curso. */
export const DEMO_IN_FLIGHT_ORDER_EVENTS: readonly NetworkOrderEvent[] = [
  { stage: "CONSUMER_ORDER", at: at(0) },
  { stage: "PHARMACY_CONFIRMATION", at: at(2) },
];

export function demoInFlightTimeline(now: Date = at(6)): NetworkStage[] {
  return buildNetworkStages(
    DEMO_NETWORK_STAGE_CONFIGS,
    DEMO_IN_FLIGHT_ORDER_EVENTS,
    now,
  );
}

/** Encomenda com SLA da farmácia estourado (sem confirmação). */
export function demoBreachedTimeline(now: Date = at(6)): NetworkStage[] {
  return buildNetworkStages(
    DEMO_NETWORK_STAGE_CONFIGS,
    [{ stage: "CONSUMER_ORDER", at: at(0) }],
    now,
  );
}
