import type { SaftExportJob } from "@brocolis/contracts";
import { database } from "@brocolis/db";
import { Injectable, NotFoundException } from "@nestjs/common";

type OrderRow = {
  id: string;
  organizationId: string;
  marketCode: string;
  status: string;
  subtotalAmountMinor: number;
  deliveryFeeAmountMinor: number;
  vatAmountMinor: number;
  discountAmountMinor: number;
  totalAmountMinor: number;
  currency: string;
  createdAt: Date;
};

type PaymentRow = {
  id: string;
  organizationId: string;
  marketCode: string;
  amountMinor: number;
  currency: string;
  method: string;
  status: string;
  createdAt: Date;
};

type SaftFileReference = {
  jobId: string;
  fileName: string;
  mimeType: string;
  bytes: number;
};

@Injectable()
export class SaftExportService {
  async generate(jobId: string): Promise<SaftFileReference> {
    const db = await database();
    const job = await db.saftExportJob.findFirst({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException(`Job SAF-T ${jobId} não encontrado`);
    }
    await db.saftExportJob.update({
      where: { id: jobId },
      data: { status: "RUNNING" },
    });

    const [orders, payments] = await Promise.all([
      db.order.findMany({
        where: {
          organizationId: job.organizationId,
          marketCode: job.marketCode,
          createdAt: {
            gte: job.periodStart,
            lte: job.periodEnd,
          },
        },
        orderBy: { createdAt: "asc" },
      }) as Promise<OrderRow[]>,
      db.payment.findMany({
        where: {
          organizationId: job.organizationId,
          marketCode: job.marketCode,
          createdAt: {
            gte: job.periodStart,
            lte: job.periodEnd,
          },
        },
        orderBy: { createdAt: "asc" },
      }) as Promise<PaymentRow[]>,
    ]);

    const xml = buildSaftXml({
      job,
      orders,
      payments,
    });

    await db.saftExportJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        fileUrl: `saft://exports/${jobId}.xml`,
      },
    });

    return {
      jobId,
      fileName: `saft-${job.marketCode}-${job.periodStart.getFullYear()}${String(job.periodStart.getMonth() + 1).padStart(2, "0")}.xml`,
      mimeType: "application/xml",
      bytes: Buffer.byteLength(xml, "utf8"),
    };
  }

  async getJob(jobId: string): Promise<SaftExportJob | null> {
    const db = await database();
    const record = await db.saftExportJob.findFirst({
      where: { id: jobId },
    });
    if (!record) return null;
    return {
      id: record.id,
      organizationId: record.organizationId,
      marketCode: record.marketCode,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
      type: record.type as SaftExportJob["type"],
      status: record.status as SaftExportJob["status"],
      requestedBy: record.requestedBy,
      fileUrl: record.fileUrl ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function buildSaftXml(params: {
  job: {
    id: string;
    organizationId: string;
    marketCode: string;
    periodStart: Date;
    periodEnd: Date;
    type: string;
    requestedBy: string;
    createdAt: Date;
  };
  orders: OrderRow[];
  payments: PaymentRow[];
}): string {
  const { job, orders, payments } = params;
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:1.0">',
    `  <Header>`,
    `    <AuditFileVersion>1.0</AuditFileVersion>`,
    `    <CompanyID>${escapeXml(job.organizationId)}</CompanyID>`,
    `    <TaxRegistrationNumber></TaxRegistrationNumber>`,
    `    <TaxEntity>${escapeXml(job.marketCode)}</TaxEntity>`,
    `    <PeriodStart>${formatDate(job.periodStart)}</PeriodStart>`,
    `    <PeriodEnd>${formatDate(job.periodEnd)}</PeriodEnd>`,
    `    <Currency>${escapeXml(job.type === "SALES" ? "AOA" : "AOA")}</Currency>`,
    `    <SoftwareID>brocolis</SoftwareID>`,
    `    <ProductID></ProductID>`,
    `    <ProductVersion>1.0</ProductVersion>`,
    `    <HeaderComment>SAF-T exportado automaticamente pela plataforma Brócolis</HeaderComment>`,
    `    <Telephone></Telephone>`,
    `    <Fax></Fax>`,
    `    <Email></Email>`,
    `    <Website></Website>`,
    `    <Address>`,
    `      <AddressDetail></AddressDetail>`,
    `      <City></City>`,
    `      <PostalCode></PostalCode>`,
    `      <Province></Province>`,
    `      <Country>${escapeXml(job.marketCode)}</Country>`,
    `    </Address>`,
    `  </Header>`,
    `  <MasterFiles>`,
    `    <GeneralLedger>`,
    `      <Account>`,
    `        <AccountID>401</AccountID>`,
    `        <AccountDescription>Sales</AccountDescription>`,
    `        <AccountType>G</AccountType>`,
    `      </Account>`,
    `      <Account>`,
    `        <AccountID>501</AccountID>`,
    `        <AccountDescription>Cost of Sales</AccountDescription>`,
    `        <AccountType>E</AccountType>`,
    `      </Account>`,
    `      <Account>`,
    `        <AccountID>701</AccountID>`,
    `        <AccountDescription>Payments received</AccountDescription>`,
    `        <AccountType>A</AccountType>`,
    `      </Account>`,
    `    </GeneralLedger>`,
    `    <Customer>`,
    `      <CustomerID>online</CustomerID>`,
    `      <AccountID>701</AccountID>`,
    `      <CustomerTaxID></CustomerTaxID>`,
    `      <CompanyName>Consumidor Final Online</CompanyName>`,
    `      <Contact>`,
    `        <ContactPerson></ContactPerson>`,
    `        <Telephone></Telephone>`,
    `        <Fax></Fax>`,
    `        <Email></Email>`,
    `        <Website></Website>`,
    `      </Contact>`,
    `      <BillingAddress>`,
    `        <AddressDetail></AddressDetail>`,
    `        <City></City>`,
    `        <PostalCode></PostalCode>`,
    `        <Province></Province>`,
    `        <Country>${escapeXml(job.marketCode)}</Country>`,
    `      </BillingAddress>`,
    `      <ShipAddress>`,
    `        <AddressDetail></AddressDetail>`,
    `        <City></City>`,
    `        <PostalCode></PostalCode>`,
    `        <Province></Province>`,
    `        <Country>${escapeXml(job.marketCode)}</Country>`,
    `      </ShipAddress>`,
    `    </Customer>`,
    `    <Supplier>`,
    `      <SupplierID>pharmacy</SupplierID>`,
    `      <AccountID>501</AccountID>`,
    `      <SupplierTaxID></SupplierTaxID>`,
    `      <CompanyName>Pharmacy Platform</CompanyName>`,
    `      <Contact>`,
    `        <ContactPerson></ContactPerson>`,
    `        <Telephone></Telephone>`,
    `        <Fax></Fax>`,
    `        <Email></Email>`,
    `        <Website></Website>`,
    `      </Contact>`,
    `      <BillingAddress>`,
    `        <AddressDetail></AddressDetail>`,
    `        <City></City>`,
    `        <PostalCode></PostalCode>`,
    `        <Province></Province>`,
    `        <Country>${escapeXml(job.marketCode)}</Country>`,
    `      </BillingAddress>`,
    `      <ShipAddress>`,
    `        <AddressDetail></AddressDetail>`,
    `        <City></City>`,
    `        <PostalCode></PostalCode>`,
    `        <Province></Province>`,
    `        <Country>${escapeXml(job.marketCode)}</Country>`,
    `      </ShipAddress>`,
    `    </Supplier>`,
    `  </MasterFiles>`,
    `  <GeneralLedgerEntries>`,
  ];

  let totalDebit = 0;
  let totalCredit = 0;

  for (const order of orders) {
    const debit = order.totalAmountMinor;
    const credit = 0;
    totalDebit += debit;
    lines.push(
      `    <Journal>`,
      `      <TransactionID>${escapeXml(order.id)}</TransactionID>`,
      `      <Period>${formatDate(order.createdAt)}</Period>`,
      `      <TransactionDate>${formatDate(order.createdAt)}</TransactionDate>`,
      `      <SourceID>ONL</SourceID>`,
      `      <CustomerID>online</CustomerID>`,
      `      <SupplierID></SupplierID>`,
      `      <Entry>`,
      `        <LineNumber>1</LineNumber>`,
      `        <AccountID>401</AccountID>`,
      `        <SourceDocumentID>${escapeXml(order.id)}</SourceDocumentID>`,
      `        <SystemEntryDate>${formatDateTime(order.createdAt)}</SystemEntryDate>`,
      `        <Description>Order ${escapeXml(order.id)}</Description>`,
      `        <DebitAmount>${debit}</DebitAmount>`,
      `        <CreditAmount>${credit}</CreditAmount>`,
      `      </Entry>`,
      `    </Journal>`,
    );
  }

  for (const payment of payments) {
    const debit = 0;
    const credit = payment.amountMinor;
    totalCredit += credit;
    lines.push(
      `    <Journal>`,
      `      <TransactionID>${escapeXml(payment.id)}</TransactionID>`,
      `      <Period>${formatDate(payment.createdAt)}</Period>`,
      `      <TransactionDate>${formatDate(payment.createdAt)}</TransactionDate>`,
      `      <SourceID>PAY</SourceID>`,
      `      <CustomerID>online</CustomerID>`,
      `      <SupplierID></SupplierID>`,
      `      <Entry>`,
      `        <LineNumber>1</LineNumber>`,
      `        <AccountID>701</AccountID>`,
      `        <SourceDocumentID>${escapeXml(payment.id)}</SourceDocumentID>`,
      `        <SystemEntryDate>${formatDateTime(payment.createdAt)}</SystemEntryDate>`,
      `        <Description>Payment ${escapeXml(payment.id)}</Description>`,
      `        <DebitAmount>${debit}</DebitAmount>`,
      `        <CreditAmount>${credit}</CreditAmount>`,
      `      </Entry>`,
      `    </Journal>`,
    );
  }

  lines.push(
    `    <TotalDebit>${totalDebit}</TotalDebit>`,
    `    <TotalCredit>${totalCredit}</TotalCredit>`,
    `  </GeneralLedgerEntries>`,
    `  <SourceDocuments>`,
    `    <SalesInvoices>`,
  );

  for (const order of orders) {
    lines.push(
      `      <Invoice>`,
      `        <InvoiceNo>${escapeXml(order.id)}</InvoiceNo>`,
      `        <InvoiceStatus>${escapeXml(order.status)}</InvoiceStatus>`,
      `        <Hash>${escapeXml(order.id)}</Hash>`,
      `        <HashControl></HashControl>`,
      `        <Period>${formatDate(order.createdAt)}</Period>`,
      `        <InvoiceDate>${formatDate(order.createdAt)}</InvoiceDate>`,
      `        <InvoiceType>FT</InvoiceType>`,
      `        <CustomerID>online</CustomerID>`,
      `        <Line>`,
      `          <LineNumber>1</LineNumber>`,
      `          <ProductCode></ProductCode>`,
      `          <ProductDescription>Order ${escapeXml(order.id)}</ProductDescription>`,
      `          <Quantity>0</Quantity>`,
      `          <UnitPrice>0</UnitPrice>`,
      `          <TaxPointDate>${formatDate(order.createdAt)}</TaxPointDate>`,
      `          <CreditAmount>0</CreditAmount>`,
      `        </Line>`,
      `        <DocumentTotals>`,
      `          <TaxPayable>${order.vatAmountMinor}</TaxPayable>`,
      `          <NetTotal>${order.subtotalAmountMinor - order.discountAmountMinor}</NetTotal>`,
      `          <GrossTotal>${order.totalAmountMinor}</GrossTotal>`,
      `        </DocumentTotals>`,
      `      </Invoice>`,
    );
  }

  lines.push(`    </SalesInvoices>`, `    <Payments>`);

  for (const payment of payments) {
    lines.push(
      `      <Payment>`,
      `        <PaymentRefNo>${escapeXml(payment.id)}</PaymentRefNo>`,
      `        <Period>${formatDate(payment.createdAt)}</Period>`,
      `        <TransactionDate>${formatDate(payment.createdAt)}</TransactionDate>`,
      `        <PaymentType>${escapeXml(payment.method)}</PaymentType>`,
      `        <Amount>${payment.amountMinor}</Amount>`,
      `        <Currency>${escapeXml(payment.currency)}</Currency>`,
      `        <CustomerID>online</CustomerID>`,
      `      </Payment>`,
    );
  }

  lines.push(`    </Payments>`, `  </SourceDocuments>`, `</AuditFile>`);

  return lines.join("\n");
}
