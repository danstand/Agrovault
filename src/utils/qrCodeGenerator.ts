import QRCode from 'qrcode';
import { AgrochemicalProduct } from '../types/agrochemical';

export interface AgrochemicalQrPayload {
  app: 'AgroVault';
  type: 'INVENTORY_SKU';
  id: string;
  sku: string;
  name: string;
  tradeName: string;
  activeIngredient: string;
  category: string;
  hazardBand: string;
  regNumber: string;
  batchNumber: string;
  expiryDate: string;
  packageSize: string;
  unit: string;
  costPrice: number;
  price: number;
  storageLocation: string;
  minStockLevel: number;
}

/**
 * Creates a structured JSON payload string for an agrochemical product
 */
export function createProductQrString(product: AgrochemicalProduct): string {
  const payload: AgrochemicalQrPayload = {
    app: 'AgroVault',
    type: 'INVENTORY_SKU',
    id: product.id,
    sku: product.id,
    name: product.name,
    tradeName: product.tradeName,
    activeIngredient: product.activeIngredient,
    category: product.category,
    hazardBand: product.hazardBand,
    regNumber: product.regNumber,
    batchNumber: product.batchNumber,
    expiryDate: product.expiryDate,
    packageSize: product.packageSize,
    unit: product.unit,
    costPrice: product.costPrice,
    price: product.price,
    storageLocation: product.storageLocation,
    minStockLevel: product.restockLevel !== undefined ? product.restockLevel : product.minStockLevel
  };
  return JSON.stringify(payload);
}

/**
 * Generates a high-resolution Data URL (PNG) of the QR code
 */
export async function generateProductQrDataUrl(
  product: AgrochemicalProduct,
  options?: { width?: number; margin?: number }
): Promise<string> {
  const data = createProductQrString(product);
  return QRCode.toDataURL(data, {
    width: options?.width || 360,
    margin: options?.margin ?? 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#064e3b', // Deep emerald color matching brand
      light: '#ffffff'
    }
  });
}

/**
 * Parses raw text from a QR code / barcode scan into an item lookup identifier
 */
export function parseScannedQrCode(scannedText: string): { productId: string; payload?: AgrochemicalQrPayload } | null {
  const clean = scannedText.trim();
  if (!clean) return null;

  // Try parsing as JSON first
  try {
    const parsed = JSON.parse(clean);
    if (parsed && (parsed.id || parsed.sku)) {
      return {
        productId: parsed.id || parsed.sku,
        payload: parsed
      };
    }
  } catch {
    // Not JSON, continue with string heuristics
  }

  // Check if it starts with PROD-
  const prodMatch = clean.match(/(PROD-\d+)/i);
  if (prodMatch) {
    return { productId: prodMatch[1].toUpperCase() };
  }

  // Check if it's a URL with product ID
  const urlMatch = clean.match(/product[=/](PROD-\d+)/i);
  if (urlMatch) {
    return { productId: urlMatch[1].toUpperCase() };
  }

  // Fallback: return raw string trimmed
  return { productId: clean };
}
