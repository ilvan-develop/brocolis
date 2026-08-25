import { searchCatalogInputSchema } from "@brocolis/contracts";
import { Injectable } from "@nestjs/common";

export type CatalogOffer = {
  id: string;
  organizationId: string;
  marketCode: string;
  pharmacyId: string;
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  brandName: string | null;
  priceMinor: number;
  currency: string;
  stock: number;
  prescriptionRequired: boolean;
};

export type CatalogSearchResult = {
  items: CatalogOffer[];
  total: number;
  page: number;
  pageSize: number;
};

const ORG = "00000000-0000-4000-8000-000000000000";
const PH_A = "c1234567890abcdef00000001";
const PH_B = "c1234567890abcdef00000002";
const CAT_ANALGESICOS = "c1234567890abcdef00000011";
const CAT_ANTIBIOTICOS = "c1234567890abcdef00000012";
const CAT_VITAMINAS = "c1234567890abcdef00000013";
const P_PARACETAMOL = "c1234567890abcdef00000021";
const P_IBUPROFENO = "c1234567890abcdef00000022";
const P_AMOXICILINA = "c1234567890abcdef00000023";
const P_VITAMINA_C = "c1234567890abcdef00000024";
const P_ASPIRINA = "c1234567890abcdef00000025";

export function createSeedCatalog(): CatalogOffer[] {
  return [
    {
      id: "c1234567890abcdef00000091",
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH_A,
      productId: P_PARACETAMOL,
      productName: "Paracetamol 500mg",
      categoryId: CAT_ANALGESICOS,
      categoryName: "Analgésicos",
      brandName: "Generis",
      priceMinor: 250,
      currency: "AOA",
      stock: 120,
      prescriptionRequired: false,
    },
    {
      id: "c1234567890abcdef00000092",
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH_B,
      productId: P_PARACETAMOL,
      productName: "Paracetamol 500mg",
      categoryId: CAT_ANALGESICOS,
      categoryName: "Analgésicos",
      brandName: "Generis",
      priceMinor: 270,
      currency: "AOA",
      stock: 12,
      prescriptionRequired: false,
    },
    {
      id: "c1234567890abcdef00000093",
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH_A,
      productId: P_IBUPROFENO,
      productName: "Ibuprofeno 400mg",
      categoryId: CAT_ANALGESICOS,
      categoryName: "Analgésicos",
      brandName: null,
      priceMinor: 450,
      currency: "AOA",
      stock: 0,
      prescriptionRequired: false,
    },
    {
      id: "c1234567890abcdef00000094",
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH_A,
      productId: P_AMOXICILINA,
      productName: "Amoxicilina 500mg",
      categoryId: CAT_ANTIBIOTICOS,
      categoryName: "Antibióticos",
      brandName: "Generis",
      priceMinor: 1200,
      currency: "AOA",
      stock: 34,
      prescriptionRequired: true,
    },
    {
      id: "c1234567890abcdef00000095",
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH_B,
      productId: P_VITAMINA_C,
      productName: "Vitamina C 1000mg",
      categoryId: CAT_VITAMINAS,
      categoryName: "Vitaminas",
      brandName: "Bayer",
      priceMinor: 800,
      currency: "AOA",
      stock: 60,
      prescriptionRequired: false,
    },
    {
      id: "c1234567890abcdef00000096",
      organizationId: ORG,
      marketCode: "AO",
      pharmacyId: PH_A,
      productId: P_ASPIRINA,
      productName: "Aspirina 100mg",
      categoryId: CAT_ANALGESICOS,
      categoryName: "Analgésicos",
      brandName: "Bayer",
      priceMinor: 350,
      currency: "AOA",
      stock: 5,
      prescriptionRequired: false,
    },
  ];
}

/**
 * Catálogo F2 — pesquisa em memória com filtros puros e paginação.
 * Apenas ofertas com stock (disponibilidade) são devolvidas.
 */
@Injectable()
export class CatalogService {
  private readonly offers: CatalogOffer[];

  constructor() {
    this.offers = createSeedCatalog();
  }

  search(input: unknown): CatalogSearchResult {
    const parsed = searchCatalogInputSchema.parse(input);
    const { page, pageSize } = parsed;
    const q = parsed.query?.trim().toLowerCase();

    const filtered = this.offers.filter((offer) => {
      if (offer.organizationId !== parsed.organizationId) {
        return false;
      }
      if (offer.marketCode !== parsed.marketCode) {
        return false;
      }
      if (offer.stock <= 0) {
        return false;
      }
      if (parsed.pharmacyId && offer.pharmacyId !== parsed.pharmacyId) {
        return false;
      }
      if (parsed.categoryId && offer.categoryId !== parsed.categoryId) {
        return false;
      }
      if (q && !offer.productName.toLowerCase().includes(q)) {
        return false;
      }
      if (parsed.minPrice !== undefined && offer.priceMinor < parsed.minPrice) {
        return false;
      }
      if (parsed.maxPrice !== undefined && offer.priceMinor > parsed.maxPrice) {
        return false;
      }
      return true;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return { items, total, page, pageSize };
  }

  getOffer(
    organizationId: string,
    marketCode: string,
    productId: string,
    pharmacyId: string,
  ): CatalogOffer {
    const offer = this.offers.find(
      (o) =>
        o.organizationId === organizationId &&
        o.marketCode === marketCode &&
        o.productId === productId &&
        o.pharmacyId === pharmacyId,
    );
    if (!offer || offer.stock <= 0) {
      throw new Error(`Oferta indisponível (${productId} em ${pharmacyId})`);
    }
    return offer;
  }
}
