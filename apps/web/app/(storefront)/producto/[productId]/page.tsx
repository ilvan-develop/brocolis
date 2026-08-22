import type { Metadata } from "next";
import { ProductClient } from "./product-client";

export const metadata: Metadata = {
  title: "Produto — Brócolis",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <ProductClient productId={productId} />
    </div>
  );
}
