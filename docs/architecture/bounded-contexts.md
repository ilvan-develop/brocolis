# Bounded contexts

> Detalhe: `blueprint/02-ARQUITETURA-CONTRATOS.md` §3.

| Contexto | Módulo | Aggregate roots |
|----------|--------|-----------------|
| Identity & Access (IAM) | `auth` | User |
| Tenants & Organizations | `tenants` | Organization |
| Market & Compliance | `markets`, `compliance` | — (config) |
| Catalog & Products | `catalog` | Product |
| Pharmacy | `pharmacy` | Pharmacy |
| Inventory & Batch | `inventory` | — |
| Pricing & Offers | `pricing` | — |
| Cart & Checkout | `cart` | Cart |
| Orders & Fulfillment | `orders` | Order |
| Procurement (B2B) | `procurement` | PurchaseOrder |
| Prescriptions | `prescriptions` | Prescription |
| Payments & Settlement | `payments` | Payment |
| Delivery & Logistics | `delivery` | Delivery |
| Notifications | `notifications` | Notification |
| Audit & Platform | `audit`, `platform` | — |

## Regras

- Cada contexto é dono da sua persistência; comunica via `@brocolis/contracts`.
- `organizationId` + `marketCode` obrigatórios em todo input scoped.
- Audit & Compliance são *Conformist* (consomem eventos de todos).