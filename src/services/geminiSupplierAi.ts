import { Supplier, AgrochemicalProduct } from '../types/agrochemical';

export interface AiSupplierResponse {
  text: string;
  isFallback: boolean;
  error?: string;
}

export async function requestSupplierAiAdvisor(params: {
  action: 'EVALUATE_VENDOR' | 'NEGOTIATE_TERMS' | 'ALTERNATIVE_SOURCING' | 'CUSTOM_QUERY';
  supplier?: Supplier;
  allSuppliers?: Supplier[];
  products?: AgrochemicalProduct[];
  query?: string;
}): Promise<AiSupplierResponse> {
  try {
    const res = await fetch('/api/ai/supplier-advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      text: data.text || 'No response generated.',
      isFallback: !!data.isFallback,
      error: data.error
    };
  } catch (err: any) {
    console.warn('AI Advisor API call failed, generating localized intelligence fallback:', err);
    // Provide responsive client-side fallback if server route is not ready
    return {
      text: generateClientFallback(params.action, params.supplier, params.query),
      isFallback: true,
      error: err.message
    };
  }
}

function generateClientFallback(action: string, supplier?: Supplier, query?: string): string {
  const name = supplier?.name || 'Agrochemical Partner';
  const terms = supplier?.paymentTerms || 'Net 30 Days';
  const onTime = supplier?.onTimeDeliveryRate || 95;
  const creditLimit = supplier?.creditLimitGHS || 50000;
  const balance = supplier?.outstandingBalanceGHS || 12000;
  const spent = supplier?.totalProcurementSpentGHS || 200000;
  const completed = supplier?.totalOrdersCompleted || 40;

  if (action === 'EVALUATE_VENDOR') {
    return `### 📊 AI Vendor Performance & Risk Assessment: ${name}

**Status:** **Tier-1 Approved Partner (Score: ${supplier?.rating || 4.8}/5.0)**
- **Delivery Velocity:** ${onTime}% on-time completion across ${completed} recorded consignments. Average lead time is **${supplier?.leadTimeDays || 2} days**.
- **Credit Health:** Outstanding balance of **GH₵ ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}** against a ceiling of **GH₵ ${creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}** (${Math.round((balance / creditLimit) * 100)}% utilization).
- **Quality Compliance:** ${(supplier?.qualityComplianceRate || 100)}% batch safety pass rate with intact EPA safety seals.

#### 🎯 Strategic Takeaways:
1. **Low Risk Profile:** Ideal primary partner for bulk early-season fertilizer and herbicide orders.
2. **Buffer Advisory:** Allow 48-hour delivery cushion for road transit into Kumasi and Sunyani hubs.
3. **Volume Leverage:** With total procurement volume of **GH₵ ${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}**, you qualify for tier-1 bulk rebates.`;
  }

  if (action === 'NEGOTIATE_TERMS') {
    return `### 🤝 Strategic Credit Terms & Price Negotiation Strategy

**Target Supplier:** ${name}  
**Current Baseline:** ${terms} | Credit Facility: GH₵ ${creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}  
**Leverage:** High lifetime spend of GH₵ ${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })} with 100% on-time account settlement.

#### 💡 Proposed Negotiation Terms:
1. **Extend Settlement Window:** Request **Net 45 Days** during peak cereal and cocoa preparation months (May–September).
2. **Expand Credit Facility:** Request increase to **GH₵ ${(creditLimit * 1.3).toLocaleString('en-US', { minimumFractionDigits: 2 })}** to absorb bulk container shipments without prepayment friction.
3. **Prompt Payment Rebate:** Propose 2% cash discount on invoices settled within 10 days via MoMo Merchant or instant bank transfer.

#### 📝 Sample Negotiation Draft (Ghana Agrochemical Trade):
> *"Dear Management at ${name}, AgroVault values our partnership across ${completed} successful consignments. In preparation for the upcoming regional cropping season where our input procurement will expand, we kindly propose an adjustment of our credit window to Net 45 Days and a facility expansion. This will enable us to consolidate all regional fungicide and herbicide orders with ${name}."*`;
  }

  return `### 🌾 AgroVault Supply Chain Intelligence Advisor

- **Seasonal Hedging:** Build safe buffer stocks for non-selective herbicides (Glyphosate) 3 weeks before major rains begin.
- **Credit Management:** Balance supplier liabilities so that no single distributor exceeds 75% of your approved credit ceiling.
- **EPA Traceability:** Ensure all consignments have verifiable batch barcodes and manufacturing dates with at least 24 months remaining shelf life.`;
}
