import { describe, expect, it } from "vitest";
import {
  DEMO_B2B2C_ORDER_EVENTS,
  DEMO_NETWORK_STAGE_CONFIGS,
  demoBreachedTimeline,
  demoCompletedTimeline,
  demoInFlightTimeline,
} from "./network-fixtures";
import {
  buildNetworkStages,
  detectSlaBreach,
  hasSupplierPull,
  NETWORK_STAGE_KEY,
  NETWORK_STATUS_KEY,
  NETWORK_STATUS_VARIANT,
  type NetworkStage,
  RESPONSIBLE_PARTY_KEY,
  RESPONSIBLE_PARTY_VARIANT,
  STOCK_SOURCE_KEY,
  STOCK_SOURCE_VARIANT,
  stockSourceFor,
  supplierVisible,
  visibleStages,
} from "./network-timeline";

const T0 = new Date("2026-08-20T09:00:00Z");
const HOUR = 60 * 60 * 1000;

function at(hoursAfterT0: number): Date {
  return new Date(T0.getTime() + hoursAfterT0 * HOUR);
}

describe("network-timeline — buildNetworkStages", () => {
  it("constrói as 4 etapas na ordem canónica", () => {
    const stages = demoCompletedTimeline();
    expect(stages.map((s) => s.stage)).toEqual([
      "CONSUMER_ORDER",
      "PHARMACY_CONFIRMATION",
      "SUPPLIER_PULL",
      "DELIVERY",
    ]);
    expect(stages.every((s) => s.status === "COMPLETED")).toBe(true);
  });

  it("marca etapa em curso e futuras como PENDING", () => {
    const stages = demoInFlightTimeline();
    expect(stages.map((s) => s.status)).toEqual([
      "COMPLETED",
      "COMPLETED",
      "IN_PROGRESS",
      "PENDING",
    ]);
  });

  it("ignora eventos futuros ao construir estados", () => {
    const stages = buildNetworkStages(
      DEMO_NETWORK_STAGE_CONFIGS,
      DEMO_B2B2C_ORDER_EVENTS,
      at(10),
    );
    expect(stages.map((s) => s.status)).toEqual([
      "COMPLETED",
      "COMPLETED",
      "IN_PROGRESS",
      "PENDING",
    ]);
  });

  it("cada etapa mostra dono, responsável e SLA", () => {
    const stages = demoCompletedTimeline();
    expect(stages[0]).toMatchObject({
      owner: "João Manuel",
      responsibleParty: "PLATFORM",
    });
    expect(stages[1]?.responsibleParty).toBe("PHARMACY");
    expect(stages[2]?.responsibleParty).toBe("SUPPLIER");
    expect(stages[2]?.owner).toBe("Angomed Distribuição");
    expect(stages.every((s) => s.slaAt instanceof Date)).toBe(true);
  });

  it("descarta configs de etapas desconhecidas", () => {
    const stages = buildNetworkStages(
      [
        ...DEMO_NETWORK_STAGE_CONFIGS,
        {
          stage: "UNKNOWN" as never,
          owner: "x",
          slaAt: at(1),
          responsibleParty: "PLATFORM" as const,
        },
      ],
      [],
      T0,
    );
    expect(stages).toHaveLength(4);
  });
});

describe("network-timeline — SLA", () => {
  it("deteta breach quando passou o SLA sem concluir", () => {
    const stage: NetworkStage = {
      stage: "PHARMACY_CONFIRMATION",
      owner: "Farmácia",
      status: "IN_PROGRESS",
      slaAt: at(4),
      responsibleParty: "PHARMACY",
    };
    expect(detectSlaBreach(stage, at(5))).toBe(true);
    expect(detectSlaBreach(stage, at(4))).toBe(false);
  });

  it("etapa concluída nunca está em breach", () => {
    const stage: NetworkStage = {
      stage: "PHARMACY_CONFIRMATION",
      owner: "Farmácia",
      status: "COMPLETED",
      slaAt: at(4),
      responsibleParty: "PHARMACY",
    };
    expect(detectSlaBreach(stage, at(50))).toBe(false);
  });

  it("marca etapas atrasadas como DELAYED", () => {
    const stages = demoBreachedTimeline();
    expect(stages.map((s) => s.status)).toEqual([
      "COMPLETED",
      "DELAYED",
      "PENDING",
      "PENDING",
    ]);
  });
});

describe("network-timeline — visibilidade do fornecedor", () => {
  it("fornecedor só visível com etapa SUPPLIER_PULL e flag ativa", () => {
    const stages = demoInFlightTimeline();
    expect(supplierVisible(stages, true)).toBe(true);
    expect(supplierVisible(stages, false)).toBe(false);
  });

  it("sem etapa SUPPLIER_PULL a flag não cria visibilidade", () => {
    const stages = demoCompletedTimeline().filter(
      (s) => s.stage !== "SUPPLIER_PULL",
    );
    expect(supplierVisible(stages, true)).toBe(false);
  });

  it("visibleStages esconde o fornecedor do cliente por defeito", () => {
    const stages = demoInFlightTimeline();
    const consumerView = visibleStages(stages, false);
    expect(consumerView.map((s) => s.stage)).not.toContain("SUPPLIER_PULL");
    expect(visibleStages(stages, true)).toHaveLength(4);
  });

  it("hasSupplierPull identifica rede com fornecedor", () => {
    expect(hasSupplierPull(demoInFlightTimeline())).toBe(true);
    expect(
      hasSupplierPull(
        demoCompletedTimeline().filter((s) => s.stage !== "SUPPLIER_PULL"),
      ),
    ).toBe(false);
  });
});

describe("network-timeline — origem do stock", () => {
  it("SUPPLIER_PULL quando a reposição está em curso ou concluída", () => {
    expect(stockSourceFor(demoInFlightTimeline())).toBe("SUPPLIER_PULL");
    expect(stockSourceFor(demoCompletedTimeline())).toBe("SUPPLIER_PULL");
  });

  it("PHARMACY_STOCK enquanto a reposição não começou", () => {
    expect(stockSourceFor(demoBreachedTimeline())).toBe("PHARMACY_STOCK");
  });
});

describe("network-timeline — mapas de badge e i18n", () => {
  it("mapeia estados para chaves i18n e variantes", () => {
    expect(NETWORK_STATUS_KEY.DELAYED).toBe("network.status.delayed");
    expect(NETWORK_STATUS_VARIANT.DELAYED).toBe("destructive");
    expect(NETWORK_STATUS_VARIANT.COMPLETED).toBe("outline");
    expect(NETWORK_STATUS_VARIANT.IN_PROGRESS).toBe("default");
    expect(NETWORK_STATUS_VARIANT.PENDING).toBe("secondary");
  });

  it("mapeia etapas, partes e origem de stock", () => {
    expect(NETWORK_STAGE_KEY.SUPPLIER_PULL).toBe("network.stage.supplier_pull");
    expect(RESPONSIBLE_PARTY_KEY.PLATFORM).toBe("network.party.platform");
    expect(RESPONSIBLE_PARTY_VARIANT.PHARMACY).toBe("default");
    expect(STOCK_SOURCE_KEY.PHARMACY_STOCK).toBe(
      "network.stock.pharmacy_stock",
    );
    expect(STOCK_SOURCE_VARIANT.SUPPLIER_PULL).toBe("secondary");
  });
});
