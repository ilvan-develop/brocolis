-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "TwoFactorType" AS ENUM ('TOTP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING', 'CLOSED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'WALLET', 'REFERENCE', 'COD', 'MOBILE');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT', 'ADJUSTMENT', 'DISPENSE', 'REFUND', 'RESERVATION', 'RELEASE');

-- CreateEnum
CREATE TYPE "InventoryAlertType" AS ENUM ('LOW', 'CRITICAL', 'EXPIRING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PharmacyVerificationStatus" AS ENUM ('VERIFIED', 'PREMIUM_VERIFIED', 'PENDING_VERIFICATION', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('INITIATED', 'APPROVED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "HealthcareProfessionalStatus" AS ENUM ('VERIFIED', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EPrescriptionStatus" AS ENUM ('ACTIVE', 'DISPENSED', 'EXPIRED', 'REVOKED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComplianceSubjectType" AS ENUM ('HEALTHCARE_PROFESSIONAL', 'PHARMACY', 'SUPPLIER', 'PRODUCT', 'E_PRESCRIPTION');

-- CreateEnum
CREATE TYPE "ComplianceDecisionOutcome" AS ENUM ('APPROVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "SaftExportType" AS ENUM ('FULL', 'SALES', 'PURCHASES');

-- CreateEnum
CREATE TYPE "SaftExportStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "B2b2cFlowStage" AS ENUM ('CONSUMER_ORDER', 'PHARMACY_CONFIRMATION', 'SUPPLIER_PULL', 'DELIVERY');

-- CreateEnum
CREATE TYPE "B2b2cFlowStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED');

-- CreateEnum
CREATE TYPE "B2b2cPartyType" AS ENUM ('PHARMACY', 'SUPPLIER', 'PLATFORM');

-- CreateEnum
CREATE TYPE "B2b2cStockSource" AS ENUM ('PHARMACY_STOCK', 'SUPPLIER_PULL');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('DRAFT', 'OPEN', 'QUOTED', 'AWARDED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PoStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONFIRMED', 'IN_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "image" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "marketCode" TEXT NOT NULL DEFAULT 'AO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "idleTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TwoFactorType" NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" "OrgStatus" NOT NULL DEFAULT 'PENDING',
    "marketCode" TEXT NOT NULL DEFAULT 'AO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_feature_flags" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "marketCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "marketCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "white_label_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "marketCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "white_label_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "marketCode" TEXT NOT NULL DEFAULT 'AO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dci" TEXT,
    "dosage" TEXT,
    "form" TEXT,
    "manufacturer" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "brandId" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_products" (
    "id" TEXT NOT NULL,
    "globalProductId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prescriptionRequired" BOOLEAN NOT NULL DEFAULT false,
    "availability" "Availability" NOT NULL DEFAULT 'AVAILABLE',
    "referencePriceMinor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_offers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "countryProductId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "priceAmountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "prescriptionRequired" BOOLEAN NOT NULL DEFAULT false,
    "status" "OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" TEXT NOT NULL,
    "globalProductId" TEXT NOT NULL,
    "composition" TEXT,
    "pharmaceuticalForm" TEXT,
    "classification" TEXT,
    "atcCode" TEXT,
    "controlledSubstance" BOOLEAN NOT NULL DEFAULT false,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_staff" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_hours" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_service_areas" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "feeAmountMinor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "id" TEXT NOT NULL,
    "cartId" TEXT,
    "orderId" TEXT,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "customerId" TEXT,
    "cartId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotalAmountMinor" INTEGER NOT NULL,
    "deliveryFeeAmountMinor" INTEGER NOT NULL DEFAULT 0,
    "vatAmountMinor" INTEGER NOT NULL DEFAULT 0,
    "discountAmountMinor" INTEGER NOT NULL DEFAULT 0,
    "totalAmountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "paymentMethod" TEXT,
    "deliveryAddress" JSONB,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceMinor" INTEGER NOT NULL,
    "lineTotalMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "from" "OrderStatus",
    "to" "OrderStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_splits" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "subtotalAmountMinor" INTEGER NOT NULL,
    "deliveryFeeAmountMinor" INTEGER NOT NULL DEFAULT 0,
    "totalAmountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_proofs" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_status_history" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "from" "PaymentStatus",
    "to" "PaymentStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finpay_webhook_logs" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "intentId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finpay_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "receivedQty" INTEGER NOT NULL,
    "remainingQty" INTEGER NOT NULL DEFAULT 0,
    "costPriceMinor" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "batchId" TEXT,
    "type" "StockMovementType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "reason" TEXT,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_alerts" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "type" "InventoryAlertType" NOT NULL,
    "message" TEXT,
    "thresholds" JSONB,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_verifications" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "status" "PharmacyVerificationStatus" NOT NULL,
    "documentUrls" JSONB,
    "verifiedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_settlements" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossMinor" INTEGER NOT NULL,
    "commissionRateBps" INTEGER NOT NULL,
    "commissionMinor" INTEGER NOT NULL,
    "netMinor" INTEGER NOT NULL,
    "reserveMinor" INTEGER NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "finpayRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'INITIATED',
    "finpayRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "rateBps" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_professionals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "credentialNumber" TEXT NOT NULL,
    "credentialIssuedBy" TEXT,
    "credentialIssuedAt" TIMESTAMP(3),
    "credentialExpiresAt" TIMESTAMP(3),
    "verificationStatus" "HealthcareProfessionalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "e_prescriptions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "patientRef" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "daysValid" INTEGER NOT NULL,
    "signatureHash" TEXT NOT NULL,
    "status" "EPrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "sourceMarketCode" TEXT NOT NULL,
    "dispensedByPharmacyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "e_prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "e_prescription_items" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "activeSubstance" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "e_prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulatory_policies" (
    "id" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "controlledSubstances" JSONB NOT NULL,
    "prescriptionRequiredCategories" JSONB NOT NULL,
    "maxPrescriptionDaysValid" INTEGER NOT NULL DEFAULT 30,
    "licenseRequirements" JSONB NOT NULL,
    "saftEnabled" BOOLEAN NOT NULL DEFAULT false,
    "agtEndpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_decisions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "subjectType" "ComplianceSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "decision" "ComplianceDecisionOutcome" NOT NULL,
    "reason" TEXT NOT NULL,
    "decidedBy" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saft_export_jobs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "type" "SaftExportType" NOT NULL DEFAULT 'FULL',
    "status" "SaftExportStatus" NOT NULL DEFAULT 'QUEUED',
    "requestedBy" TEXT NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saft_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b2c_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "customerId" TEXT,
    "pharmacyId" TEXT NOT NULL,
    "supplierId" TEXT,
    "currentStage" "B2b2cFlowStage" NOT NULL,
    "currentStatus" "B2b2cFlowStatus" NOT NULL,
    "stockSource" "B2b2cStockSource" NOT NULL DEFAULT 'PHARMACY_STOCK',
    "items" JSONB NOT NULL,
    "totalMinor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b2c_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b2c_timeline_entries" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stage" "B2b2cFlowStage" NOT NULL,
    "status" "B2b2cFlowStatus" NOT NULL,
    "responsibleParty" "B2b2cPartyType" NOT NULL,
    "responsibleId" TEXT NOT NULL,
    "stockSource" "B2b2cStockSource",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b2c_timeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "RfqStatus" NOT NULL DEFAULT 'DRAFT',
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "quotationId" TEXT,
    "supplierId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "PoStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "requestedDeliveryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceMinor" INTEGER NOT NULL,
    "lineTotalMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "level" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "creditLimitMinor" INTEGER NOT NULL,
    "balanceMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "status" "CreditStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_tiers" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "maxQty" INTEGER,
    "unitPriceMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volume_prices" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minVolume" INTEGER NOT NULL,
    "discountBps" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volume_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_organizationId_action_createdAt_idx" ON "audit_events"("organizationId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_marketCode_createdAt_idx" ON "audit_events"("marketCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_marketCode_createdAt_idx" ON "users"("marketCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_expiresAt_idx" ON "sessions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_token_key" ON "verifications"("token");

-- CreateIndex
CREATE INDEX "verifications_userId_type_idx" ON "verifications"("userId", "type");

-- CreateIndex
CREATE INDEX "two_factors_userId_type_idx" ON "two_factors"("userId", "type");

-- CreateIndex
CREATE INDEX "roles_organizationId_idx" ON "roles"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organizationId_name_key" ON "roles"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_key" ON "permissions"("action");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_marketCode_createdAt_idx" ON "organizations"("marketCode", "createdAt");

-- CreateIndex
CREATE INDEX "org_settings_organizationId_idx" ON "org_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "org_settings_organizationId_key_key" ON "org_settings"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "org_feature_flags_organizationId_feature_key" ON "org_feature_flags"("organizationId", "feature");

-- CreateIndex
CREATE INDEX "members_organizationId_marketCode_createdAt_idx" ON "members"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "members_organizationId_userId_key" ON "members"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_organizationId_marketCode_createdAt_idx" ON "invitations"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "white_label_configs_organizationId_key" ON "white_label_configs"("organizationId");

-- CreateIndex
CREATE INDEX "white_label_configs_organizationId_marketCode_createdAt_idx" ON "white_label_configs"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_marketCode_createdAt_idx" ON "categories"("marketCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "global_products_categoryId_idx" ON "global_products"("categoryId");

-- CreateIndex
CREATE INDEX "global_products_brandId_idx" ON "global_products"("brandId");

-- CreateIndex
CREATE INDEX "global_products_dci_idx" ON "global_products"("dci");

-- CreateIndex
CREATE INDEX "country_products_countryCode_marketCode_createdAt_idx" ON "country_products"("countryCode", "marketCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "country_products_globalProductId_countryCode_key" ON "country_products"("globalProductId", "countryCode");

-- CreateIndex
CREATE INDEX "market_offers_organizationId_marketCode_status_createdAt_idx" ON "market_offers"("organizationId", "marketCode", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "market_offers_pharmacyId_countryProductId_key" ON "market_offers"("pharmacyId", "countryProductId");

-- CreateIndex
CREATE UNIQUE INDEX "medicines_globalProductId_key" ON "medicines"("globalProductId");

-- CreateIndex
CREATE INDEX "medicines_atcCode_idx" ON "medicines"("atcCode");

-- CreateIndex
CREATE INDEX "pharmacies_organizationId_marketCode_createdAt_idx" ON "pharmacies"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacies_organizationId_slug_key" ON "pharmacies"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "pharmacy_staff_pharmacyId_idx" ON "pharmacy_staff"("pharmacyId");

-- CreateIndex
CREATE INDEX "pharmacy_hours_pharmacyId_idx" ON "pharmacy_hours"("pharmacyId");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_service_areas_pharmacyId_zone_key" ON "pharmacy_service_areas"("pharmacyId", "zone");

-- CreateIndex
CREATE UNIQUE INDEX "carts_sessionId_organizationId_marketCode_key" ON "carts"("sessionId", "organizationId", "marketCode");

-- CreateIndex
CREATE INDEX "cart_items_pharmacyId_idx" ON "cart_items"("pharmacyId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_productId_pharmacyId_key" ON "cart_items"("cartId", "productId", "pharmacyId");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_sessions_orderId_key" ON "checkout_sessions"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_sessions_idempotencyKey_key" ON "checkout_sessions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "checkout_sessions_organizationId_marketCode_createdAt_idx" ON "checkout_sessions"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotencyKey_key" ON "orders"("idempotencyKey");

-- CreateIndex
CREATE INDEX "orders_organizationId_marketCode_status_createdAt_idx" ON "orders"("organizationId", "marketCode", "status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_customerId_createdAt_idx" ON "orders"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE INDEX "order_status_history_orderId_createdAt_idx" ON "order_status_history"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "order_splits_orderId_idx" ON "order_splits"("orderId");

-- CreateIndex
CREATE INDEX "order_splits_pharmacyId_idx" ON "order_splits"("pharmacyId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_intentId_key" ON "payments"("intentId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_organizationId_marketCode_createdAt_idx" ON "payments"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_proofs_paymentId_key" ON "payment_proofs"("paymentId");

-- CreateIndex
CREATE INDEX "payment_proofs_paymentId_idx" ON "payment_proofs"("paymentId");

-- CreateIndex
CREATE INDEX "payment_status_history_paymentId_createdAt_idx" ON "payment_status_history"("paymentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "finpay_webhook_logs_eventId_key" ON "finpay_webhook_logs"("eventId");

-- CreateIndex
CREATE INDEX "finpay_webhook_logs_intentId_idx" ON "finpay_webhook_logs"("intentId");

-- CreateIndex
CREATE INDEX "finpay_webhook_logs_processed_createdAt_idx" ON "finpay_webhook_logs"("processed", "createdAt");

-- CreateIndex
CREATE INDEX "inventory_items_organizationId_marketCode_createdAt_idx" ON "inventory_items"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_productId_pharmacyId_key" ON "inventory_items"("productId", "pharmacyId");

-- CreateIndex
CREATE INDEX "batches_productId_pharmacyId_expiryDate_idx" ON "batches"("productId", "pharmacyId", "expiryDate");

-- CreateIndex
CREATE INDEX "batches_organizationId_marketCode_createdAt_idx" ON "batches"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_itemId_type_createdAt_idx" ON "stock_movements"("itemId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_organizationId_marketCode_createdAt_idx" ON "stock_movements"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE INDEX "inventory_alerts_itemId_type_createdAt_idx" ON "inventory_alerts"("itemId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "inventory_alerts_organizationId_marketCode_createdAt_idx" ON "inventory_alerts"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE INDEX "pharmacy_verifications_organizationId_marketCode_createdAt_idx" ON "pharmacy_verifications"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE INDEX "pharmacy_settlements_organizationId_marketCode_periodStart__idx" ON "pharmacy_settlements"("organizationId", "marketCode", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "refunds_orderId_idx" ON "refunds"("orderId");

-- CreateIndex
CREATE INDEX "refunds_organizationId_marketCode_createdAt_idx" ON "refunds"("organizationId", "marketCode", "createdAt");

-- CreateIndex
CREATE INDEX "commission_rates_organizationId_marketCode_active_createdAt_idx" ON "commission_rates"("organizationId", "marketCode", "active", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "commission_rates_organizationId_marketCode_key" ON "commission_rates"("organizationId", "marketCode");

-- CreateIndex
CREATE INDEX "healthcare_professionals_organizationId_marketCode_verifica_idx" ON "healthcare_professionals"("organizationId", "marketCode", "verificationStatus");

-- CreateIndex
CREATE INDEX "e_prescriptions_organizationId_marketCode_status_expiresAt_idx" ON "e_prescriptions"("organizationId", "marketCode", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "e_prescriptions_patientRef_idx" ON "e_prescriptions"("patientRef");

-- CreateIndex
CREATE INDEX "e_prescription_items_prescriptionId_idx" ON "e_prescription_items"("prescriptionId");

-- CreateIndex
CREATE INDEX "e_prescription_items_productId_idx" ON "e_prescription_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "regulatory_policies_marketCode_key" ON "regulatory_policies"("marketCode");

-- CreateIndex
CREATE INDEX "compliance_decisions_organizationId_marketCode_subjectType__idx" ON "compliance_decisions"("organizationId", "marketCode", "subjectType", "decidedAt");

-- CreateIndex
CREATE INDEX "compliance_decisions_subjectId_idx" ON "compliance_decisions"("subjectId");

-- CreateIndex
CREATE INDEX "saft_export_jobs_organizationId_marketCode_status_createdAt_idx" ON "saft_export_jobs"("organizationId", "marketCode", "status", "createdAt");

-- CreateIndex
CREATE INDEX "b2b2c_orders_organizationId_marketCode_currentStage_created_idx" ON "b2b2c_orders"("organizationId", "marketCode", "currentStage", "createdAt");

-- CreateIndex
CREATE INDEX "b2b2c_orders_pharmacyId_createdAt_idx" ON "b2b2c_orders"("pharmacyId", "createdAt");

-- CreateIndex
CREATE INDEX "b2b2c_timeline_entries_orderId_createdAt_idx" ON "b2b2c_timeline_entries"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "suppliers_organizationId_marketCode_status_createdAt_idx" ON "suppliers"("organizationId", "marketCode", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_organizationId_slug_key" ON "suppliers"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "rfqs_reference_key" ON "rfqs"("reference");

-- CreateIndex
CREATE INDEX "rfqs_organizationId_marketCode_status_createdAt_idx" ON "rfqs"("organizationId", "marketCode", "status", "createdAt");

-- CreateIndex
CREATE INDEX "rfqs_supplierId_createdAt_idx" ON "rfqs"("supplierId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_reference_key" ON "quotations"("reference");

-- CreateIndex
CREATE INDEX "quotations_organizationId_marketCode_status_createdAt_idx" ON "quotations"("organizationId", "marketCode", "status", "createdAt");

-- CreateIndex
CREATE INDEX "quotations_rfqId_createdAt_idx" ON "quotations"("rfqId", "createdAt");

-- CreateIndex
CREATE INDEX "quotations_supplierId_createdAt_idx" ON "quotations"("supplierId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_reference_key" ON "purchase_orders"("reference");

-- CreateIndex
CREATE INDEX "purchase_orders_organizationId_marketCode_status_createdAt_idx" ON "purchase_orders"("organizationId", "marketCode", "status", "createdAt");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_createdAt_idx" ON "purchase_orders"("supplierId", "createdAt");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchaseOrderId_idx" ON "purchase_order_items"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "purchase_order_items_productId_idx" ON "purchase_order_items"("productId");

-- CreateIndex
CREATE INDEX "approval_workflows_purchaseOrderId_status_idx" ON "approval_workflows"("purchaseOrderId", "status");

-- CreateIndex
CREATE INDEX "approval_workflows_approverId_status_idx" ON "approval_workflows"("approverId", "status");

-- CreateIndex
CREATE INDEX "credit_accounts_organizationId_marketCode_status_createdAt_idx" ON "credit_accounts"("organizationId", "marketCode", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "credit_accounts_organizationId_supplierId_key" ON "credit_accounts"("organizationId", "supplierId");

-- CreateIndex
CREATE INDEX "price_tiers_supplierId_productId_active_idx" ON "price_tiers"("supplierId", "productId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "price_tiers_supplierId_productId_minQty_key" ON "price_tiers"("supplierId", "productId", "minQty");

-- CreateIndex
CREATE INDEX "volume_prices_supplierId_productId_active_idx" ON "volume_prices"("supplierId", "productId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "volume_prices_supplierId_productId_minVolume_key" ON "volume_prices"("supplierId", "productId", "minVolume");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factors" ADD CONSTRAINT "two_factors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_settings" ADD CONSTRAINT "org_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_feature_flags" ADD CONSTRAINT "org_feature_flags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "white_label_configs" ADD CONSTRAINT "white_label_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_products" ADD CONSTRAINT "global_products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_products" ADD CONSTRAINT "global_products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_products" ADD CONSTRAINT "country_products_globalProductId_fkey" FOREIGN KEY ("globalProductId") REFERENCES "global_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_offers" ADD CONSTRAINT "market_offers_countryProductId_fkey" FOREIGN KEY ("countryProductId") REFERENCES "country_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_offers" ADD CONSTRAINT "market_offers_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_globalProductId_fkey" FOREIGN KEY ("globalProductId") REFERENCES "global_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_staff" ADD CONSTRAINT "pharmacy_staff_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_hours" ADD CONSTRAINT "pharmacy_hours_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_service_areas" ADD CONSTRAINT "pharmacy_service_areas_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "global_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "global_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_splits" ADD CONSTRAINT "order_splits_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_splits" ADD CONSTRAINT "order_splits_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_status_history" ADD CONSTRAINT "payment_status_history_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "global_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "global_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_verifications" ADD CONSTRAINT "pharmacy_verifications_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_settlements" ADD CONSTRAINT "pharmacy_settlements_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "e_prescriptions" ADD CONSTRAINT "e_prescriptions_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "healthcare_professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "e_prescription_items" ADD CONSTRAINT "e_prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "e_prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b2c_timeline_entries" ADD CONSTRAINT "b2b2c_timeline_entries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "b2b2c_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "global_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "global_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volume_prices" ADD CONSTRAINT "volume_prices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volume_prices" ADD CONSTRAINT "volume_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "global_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
