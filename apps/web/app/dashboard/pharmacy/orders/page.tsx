"use client";

import { formatCurrency } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import { Button } from "@brocolis/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@brocolis/ui/components/dialog";
import { Input } from "@brocolis/ui/components/input";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@brocolis/ui/components/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderPrescriptionBadge } from "@/components/pharmacy/order-prescription-badge";
import { PaymentStatusBadge } from "@/components/pharmacy/payment-status-badge";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import {
  advanceOrder,
  DEMO_PHARMACY_ORDERS,
  deliveryZoneLabelKey,
  filterOrdersByQuery,
  filterOrdersByTab,
  nextOrderAction,
  ORDER_ACTION_KEY,
  PAYMENT_METHOD_KEY,
  PHARMACY_ORDER_TABS,
  type PharmacyOrder,
  type PharmacyOrderTab,
} from "@/lib/pharmacy-orders";

function OrderWorkspace({
  order,
  onAdvance,
}: {
  order: PharmacyOrder;
  onAdvance: (orderId: string) => void;
}) {
  const action = nextOrderAction(order);

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>
          {t("order.title")} {order.number}
        </DialogTitle>
        <DialogDescription>
          {order.customerName} · {order.items.length}{" "}
          {t("pharmacy.orders.items")}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="font-medium">{t("pharmacy.orders.payment")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {t(PAYMENT_METHOD_KEY[order.paymentMethod])}
            </Badge>
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-medium">{t("pharmacy.orders.prescription")}</p>
          <OrderPrescriptionBadge prescription={order.prescription} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-medium">
            {t("pharmacy.orders.workspace.products")}
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-2 pr-4 font-medium">
                  {t("pharmacy.orders.workspace.product")}
                </th>
                <th className="py-2 pr-4 font-medium">
                  {t("pharmacy.orders.workspace.quantity")}
                </th>
                <th className="py-2 font-medium">
                  {t("pharmacy.orders.workspace.price")}
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId} className="border-b last:border-0">
                  <td className="py-2 pr-4">{item.productName}</td>
                  <td className="py-2 pr-4">{item.quantity}</td>
                  <td className="py-2 text-muted-foreground">
                    {formatCurrency(
                      item.lineTotal.amount,
                      item.lineTotal.currency,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-medium">
            {t("pharmacy.orders.workspace.delivery")}
          </p>
          <dl className="text-muted-foreground flex flex-col gap-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt>{t("pharmacy.orders.workspace.zone")}</dt>
              <dd>{t(deliveryZoneLabelKey(order.delivery.zone))}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("pharmacy.orders.workspace.deliveryAddress")}</dt>
              <dd className="text-right">
                {order.delivery.addressLine}, {order.delivery.city}
                {order.delivery.referencePoint !== null
                  ? ` (${order.delivery.referencePoint})`
                  : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("delivery.fee")}</dt>
              <dd>
                {formatCurrency(
                  order.delivery.fee.amount,
                  order.delivery.fee.currency,
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("delivery.eta")}</dt>
              <dd>{order.delivery.etaMinutes} min</dd>
            </div>
          </dl>
        </div>
      </div>

      <DialogFooter>
        {action !== null && (
          <Button onClick={() => onAdvance(order.id)}>
            {t(ORDER_ACTION_KEY[action.step])}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

export default function PharmacyOrdersPage() {
  const loading = useSimulatedLoad();
  const [orders, setOrders] = useState<PharmacyOrder[]>(() => [
    ...DEMO_PHARMACY_ORDERS,
  ]);
  const [activeTab, setActiveTab] = useState<PharmacyOrderTab>("all");
  const [query, setQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabbed = filterOrdersByTab(orders, activeTab);
  const filtered = filterOrdersByQuery(tabbed, query);
  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? null;

  function handleAdvance(orderId: string) {
    setOrders((previous) =>
      previous.map((order) =>
        order.id === orderId ? advanceOrder(order) : order,
      ),
    );
    toast.success(t("pharmacy.orders.workspace.updated"));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold tracking-tight text-2xl">
          {t("pharmacy.orders.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("pharmacy.orders.subtitle")}
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>{t("pharmacy.orders.title")}</CardTitle>
            <CardDescription>{t("pharmacy.orders.subtitle")}</CardDescription>
          </div>
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("pharmacy.orders.search.placeholder")}
            aria-label={t("pharmacy.orders.search.aria")}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error !== null ? (
            <div className="flex flex-col items-start gap-2">
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
              >
                {t("catalog.retry")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as PharmacyOrderTab)
                }
              >
                <TabsList className="flex-wrap">
                  {PHARMACY_ORDER_TABS.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {t(tab.key)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value={activeTab}>
                  {filtered.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      {t("pharmacy.orders.empty")}
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b text-left">
                          <th className="py-2 pr-4 font-medium">
                            {t("pharmacy.orders.number")}
                          </th>
                          <th className="py-2 pr-4 font-medium">
                            {t("pharmacy.orders.customer")}
                          </th>
                          <th className="py-2 pr-4 font-medium">
                            {t("pharmacy.orders.items")}
                          </th>
                          <th className="py-2 pr-4 font-medium">
                            {t("pharmacy.orders.total")}
                          </th>
                          <th className="py-2 pr-4 font-medium">
                            {t("pharmacy.orders.payment")}
                          </th>
                          <th className="py-2 pr-4 font-medium">
                            {t("pharmacy.orders.prescription")}
                          </th>
                          <th className="py-2 pr-4 font-medium">
                            {t("pharmacy.orders.status")}
                          </th>
                          <th className="py-2 font-medium">
                            {t("pharmacy.orders.action")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((order) => (
                          <tr key={order.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">
                              {order.number}
                            </td>
                            <td className="py-2 pr-4 text-muted-foreground">
                              {order.customerName}
                            </td>
                            <td className="py-2 pr-4 text-muted-foreground">
                              {order.items.length}
                            </td>
                            <td className="py-2 pr-4">
                              {formatCurrency(
                                order.totals.total.amount,
                                order.totals.total.currency,
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              <PaymentStatusBadge
                                status={order.paymentStatus}
                              />
                            </td>
                            <td className="py-2 pr-4">
                              <OrderPrescriptionBadge
                                prescription={order.prescription}
                              />
                            </td>
                            <td className="py-2 pr-4">
                              <OrderStatusBadge status={order.status} />
                            </td>
                            <td className="py-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrderId(order.id)}
                              >
                                {t("pharmacy.orders.open")}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selectedOrderId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrderId(null);
          }
        }}
      >
        {selectedOrder !== null && (
          <OrderWorkspace order={selectedOrder} onAdvance={handleAdvance} />
        )}
      </Dialog>
    </div>
  );
}
