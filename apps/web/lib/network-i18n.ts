import type { Locale } from "@brocolis/i18n";
import { defaultLocale } from "@brocolis/i18n";

/**
 * Catálogo local das chaves `network.*` usadas pelos componentes da rede
 * B2B2C. Fonte canónica: `packages/i18n/src/f6-messages.ts` (prefixos
 * `network.*`, `rxdigital.*`, `compliance.*`). Este shim existe enquanto o
 * subpath `@brocolis/i18n/f6-messages` não está exposto no exports map do
 * pacote — ver ADR-0014 e relatório da F6.
 */
export type NetworkMessageKey =
  | "network.timeline.title"
  | "network.stage.consumer_order"
  | "network.stage.pharmacy_confirmation"
  | "network.stage.supplier_pull"
  | "network.stage.delivery"
  | "network.status.pending"
  | "network.status.in_progress"
  | "network.status.completed"
  | "network.status.delayed"
  | "network.party.pharmacy"
  | "network.party.supplier"
  | "network.party.platform"
  | "network.supplier.hidden"
  | "network.sla.label"
  | "network.sla.breached"
  | "network.stock.source"
  | "network.stock.pharmacy_stock"
  | "network.stock.supplier_pull";

export const NETWORK_MESSAGES: Record<
  Locale,
  Record<NetworkMessageKey, string>
> = {
  "pt-AO": {
    "network.timeline.title": "Linha temporal da encomenda",
    "network.stage.consumer_order": "Pedido do cliente",
    "network.stage.pharmacy_confirmation": "Confirmação da farmácia",
    "network.stage.supplier_pull": "Reposição do fornecedor",
    "network.stage.delivery": "Entrega",
    "network.status.pending": "Pendente",
    "network.status.in_progress": "Em curso",
    "network.status.completed": "Concluída",
    "network.status.delayed": "Atrasada",
    "network.party.pharmacy": "Farmácia",
    "network.party.supplier": "Fornecedor",
    "network.party.platform": "Plataforma",
    "network.supplier.hidden": "Gerido pela sua farmácia",
    "network.sla.label": "SLA",
    "network.sla.breached": "Fora do prazo",
    "network.stock.source": "Origem do stock",
    "network.stock.pharmacy_stock": "Stock da farmácia",
    "network.stock.supplier_pull": "Vindo do fornecedor",
  },
  "pt-MZ": {
    "network.timeline.title": "Linha temporal da encomenda",
    "network.stage.consumer_order": "Pedido do cliente",
    "network.stage.pharmacy_confirmation": "Confirmação da farmácia",
    "network.stage.supplier_pull": "Reposição do fornecedor",
    "network.stage.delivery": "Entrega",
    "network.status.pending": "Pendente",
    "network.status.in_progress": "Em curso",
    "network.status.completed": "Concluída",
    "network.status.delayed": "Atrasada",
    "network.party.pharmacy": "Farmácia",
    "network.party.supplier": "Fornecedor",
    "network.party.platform": "Plataforma",
    "network.supplier.hidden": "Gerido pela sua farmácia",
    "network.sla.label": "SLA",
    "network.sla.breached": "Fora do prazo",
    "network.stock.source": "Origem do stock",
    "network.stock.pharmacy_stock": "Stock da farmácia",
    "network.stock.supplier_pull": "Vindo do fornecedor",
  },
  "en-KE": {
    "network.timeline.title": "Order timeline",
    "network.stage.consumer_order": "Customer order",
    "network.stage.pharmacy_confirmation": "Pharmacy confirmation",
    "network.stage.supplier_pull": "Supplier restock",
    "network.stage.delivery": "Delivery",
    "network.status.pending": "Pending",
    "network.status.in_progress": "In progress",
    "network.status.completed": "Completed",
    "network.status.delayed": "Delayed",
    "network.party.pharmacy": "Pharmacy",
    "network.party.supplier": "Supplier",
    "network.party.platform": "Platform",
    "network.supplier.hidden": "Handled by your pharmacy",
    "network.sla.label": "SLA",
    "network.sla.breached": "Past due",
    "network.stock.source": "Stock source",
    "network.stock.pharmacy_stock": "Pharmacy stock",
    "network.stock.supplier_pull": "From supplier",
  },
  "en-NG": {
    "network.timeline.title": "Order timeline",
    "network.stage.consumer_order": "Customer order",
    "network.stage.pharmacy_confirmation": "Pharmacy confirmation",
    "network.stage.supplier_pull": "Supplier restock",
    "network.stage.delivery": "Delivery",
    "network.status.pending": "Pending",
    "network.status.in_progress": "In progress",
    "network.status.completed": "Completed",
    "network.status.delayed": "Delayed",
    "network.party.pharmacy": "Pharmacy",
    "network.party.supplier": "Supplier",
    "network.party.platform": "Platform",
    "network.supplier.hidden": "Handled by your pharmacy",
    "network.sla.label": "SLA",
    "network.sla.breached": "Past due",
    "network.stock.source": "Stock source",
    "network.stock.pharmacy_stock": "Pharmacy stock",
    "network.stock.supplier_pull": "From supplier",
  },
  "fr-SN": {
    "network.timeline.title": "Chronologie de la commande",
    "network.stage.consumer_order": "Commande du client",
    "network.stage.pharmacy_confirmation": "Confirmation de la pharmacie",
    "network.stage.supplier_pull": "Réapprovisionnement fournisseur",
    "network.stage.delivery": "Livraison",
    "network.status.pending": "En attente",
    "network.status.in_progress": "En cours",
    "network.status.completed": "Terminée",
    "network.status.delayed": "Retardée",
    "network.party.pharmacy": "Pharmacie",
    "network.party.supplier": "Fournisseur",
    "network.party.platform": "Plateforme",
    "network.supplier.hidden": "Géré par votre pharmacie",
    "network.sla.label": "SLA",
    "network.sla.breached": "Hors délai",
    "network.stock.source": "Source du stock",
    "network.stock.pharmacy_stock": "Stock de la pharmacie",
    "network.stock.supplier_pull": "Venant du fournisseur",
  },
  "ar-EG": {
    "network.timeline.title": "الجدول الزمني للطلب",
    "network.stage.consumer_order": "طلب العميل",
    "network.stage.pharmacy_confirmation": "تأكيد الصيدلية",
    "network.stage.supplier_pull": "التزويد من المورّد",
    "network.stage.delivery": "التوصيل",
    "network.status.pending": "قيد الانتظار",
    "network.status.in_progress": "جارٍ التنفيذ",
    "network.status.completed": "مكتملة",
    "network.status.delayed": "متأخرة",
    "network.party.pharmacy": "الصيدلية",
    "network.party.supplier": "المورّد",
    "network.party.platform": "المنصة",
    "network.supplier.hidden": "تتولاه صيدليتك",
    "network.sla.label": "اتفاقية مستوى الخدمة",
    "network.sla.breached": "تجاوز المهلة",
    "network.stock.source": "مصدر المخزون",
    "network.stock.pharmacy_stock": "مخزون الصيدلية",
    "network.stock.supplier_pull": "من المورّد",
  },
};

export function tNetwork(
  key: NetworkMessageKey,
  locale: Locale = defaultLocale,
): string {
  return (
    NETWORK_MESSAGES[locale]?.[key] ??
    NETWORK_MESSAGES[defaultLocale][key] ??
    key
  );
}
