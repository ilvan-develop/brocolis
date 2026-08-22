import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SentryModule } from "@sentry/nestjs/setup";
import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { B2b2cModule } from "./b2b2c/b2b2c.module.js";
import { CartModule } from "./cart/cart.module.js";
import { CatalogModule } from "./catalog/catalog.module.js";
import { CheckoutModule } from "./checkout/checkout.module.js";
import { RateLimitModule } from "./common/rate-limit/rate-limit.module.js";
import { ComplianceModule } from "./compliance/compliance.module.js";
import { DispensingModule } from "./dispensing/dispensing.module.js";
import { HealthModule } from "./health/health.module.js";
import { InventoryModule } from "./inventory/inventory.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { PaymentsModule } from "./payments/payments.module.js";
import { PharmacyModule } from "./pharmacy/pharmacy.module.js";
import { PrescriptionDigitalModule } from "./prescription-digital/prescription-digital.module.js";
import { ProcurementModule } from "./procurement/procurement.module.js";
import { SettlementsModule } from "./settlements/settlements.module.js";
import { TenantsModule } from "./tenants/tenants.module.js";

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    RateLimitModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    CatalogModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    InventoryModule,
    DispensingModule,
    SettlementsModule,
    PharmacyModule,
    PrescriptionDigitalModule,
    ComplianceModule,
    ProcurementModule,
    B2b2cModule,
    AuditModule,
  ],
})
export class AppModule {}
