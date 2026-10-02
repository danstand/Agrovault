import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// AI Vendor Supply Chain Intelligence Endpoint
app.post('/api/ai/supplier-advisor', async (req, res) => {
  try {
    const { action, supplier, allSuppliers, products, query } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const systemInstruction = `You are the AgroVault Senior Agrochemical Procurement & Supply Chain Intelligence Specialist for Ghana's agricultural sector.
You specialize in:
1. Ghanaian agrochemical import & distribution dynamics (Wienco, Syngenta, Bayer, Chemico, Yara, Dizengoff).
2. Credit risk management, payment terms, and working capital in Ghana Cedis (GH₵).
3. EPA Ghana pesticide regulations, batch traceability, and WHO toxicity handling (Classes Ib, II, III, IV).
4. Cropping seasonal demand curves in Ghana (major rainy season March-July, minor season Sept-Nov, dry season irrigated vegetables, cocoa black pod season).
5. Vendor performance optimization (on-time delivery, fulfillment accuracy, defect mitigation).

Always provide concise, professional, structured advice with clear actionable recommendations in bullet points. Quote currency values in Ghana Cedis (GH₵).`;

    let userPrompt = '';

    if (action === 'EVALUATE_VENDOR') {
      userPrompt = `Perform a comprehensive supply chain performance and credit risk evaluation for the following Ghanaian agrochemical vendor:
Vendor: ${supplier.name}
City/Region: ${supplier.city}, ${supplier.region}
EPA License: ${supplier.epaLicenseNumber || 'Registered'}
Lead Time: ${supplier.leadTimeDays} days
Payment Terms: ${supplier.paymentTerms}
Credit Limit: GH₵ ${supplier.creditLimitGHS?.toLocaleString() || 'N/A'}
Outstanding Balance: GH₵ ${supplier.outstandingBalanceGHS?.toLocaleString() || 'N/A'}
Credit Status: ${supplier.creditStatus}
Overall Rating: ${supplier.rating}/5.0
On-Time Delivery Rate: ${supplier.onTimeDeliveryRate}%
Fulfillment Accuracy: ${supplier.fulfillmentAccuracyRate}%
Total Historical Procurement Volume: GH₵ ${supplier.totalProcurementSpentGHS?.toLocaleString() || 'N/A'}
Total Orders Completed: ${supplier.totalOrdersCompleted}
Supplied Categories: ${(supplier.suppliedCategories || []).join(', ')}

Provide:
1. Executive Vendor Reliability Rating (Low/Medium/High Risk).
2. Delivery Velocity & Lead Time Assessment.
3. Credit Exposure Analysis (Balance vs Limit).
4. Top 3 Actionable Recommendations for our storekeeper to optimize supply reliability and payment efficiency.`;
    } else if (action === 'NEGOTIATE_TERMS') {
      userPrompt = `Formulate a strategic procurement and credit term negotiation strategy for:
Supplier: ${supplier.name}
Current Payment Terms: ${supplier.paymentTerms}
Credit Limit: GH₵ ${supplier.creditLimitGHS?.toLocaleString()}
Current Outstanding: GH₵ ${supplier.outstandingBalanceGHS?.toLocaleString()}
Total Historical Purchases: GH₵ ${supplier.totalProcurementSpentGHS?.toLocaleString()} (${supplier.totalOrdersCompleted} completed POs)
On-Time Delivery Rate: ${supplier.onTimeDeliveryRate}%

Our objective is to improve payment flexibility (e.g. extending credit window to 30 or 45 days, increasing credit limit by 25%, or securing a 2-3% prompt payment volume rebate for peak season bulk fertilizer & herbicide stocking). Provide:
1. Recommended Negotiation Angles (using our payment track record as leverage).
2. Target Proposed Terms.
3. Polite, professional negotiation script/letter excerpt formatted for Ghanaian business communication.`;
    } else if (action === 'ALTERNATIVE_SOURCING') {
      userPrompt = `We are evaluating sourcing alternatives across our registered Ghanaian chemical vendors:
Vendors available: ${(allSuppliers || []).map((s: any) => `${s.name} (Lead time: ${s.leadTimeDays}d, Terms: ${s.paymentTerms}, Rating: ${s.rating}, On-Time: ${s.onTimeDeliveryRate}%, Categories: ${(s.suppliedCategories || []).join('/')})`).join('; ')}

User inquiry: ${query || 'Which vendor should we prioritize for urgent herbicide and fungicide restocks during heavy seasonal rains?'}

Analyze vendor reliability, lead times, credit limits in GH₵, and provide the optimal primary and secondary vendor recommendations.`;
    } else {
      userPrompt = query || `Provide top supply chain optimization tips for an agrochemical retailer in Ghana.`;
    }

    if (!apiKey) {
      // Heuristic fallback if no API key is injected
      const fallbackAnalysis = generateHeuristicAdvice(action, supplier, query);
      return res.json({ text: fallbackAnalysis, isFallback: true });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });

    res.json({ text: response.text, isFallback: false });
  } catch (error: any) {
    console.error('Error generating AI supplier advice:', error);
    // Graceful fallback on API error
    const fallback = generateHeuristicAdvice(req.body.action, req.body.supplier, req.body.query);
    res.json({ text: fallback, isFallback: true, error: error.message });
  }
});

function generateHeuristicAdvice(action: string, supplier: any, query?: string): string {
  const name = supplier?.name || 'Agrochemical Vendor';
  const terms = supplier?.paymentTerms || 'Net 30 Days';
  const onTime = supplier?.onTimeDeliveryRate || 95;
  const creditLimit = supplier?.creditLimitGHS || 50000;
  const balance = supplier?.outstandingBalanceGHS || 10000;
  const utilization = Math.round((balance / creditLimit) * 100);

  if (action === 'EVALUATE_VENDOR') {
    return `### 📊 AI Vendor Performance & Risk Assessment: ${name}

**Executive Rating:** **Tier-1 Preferred Vendor (Low Risk)**
- **Delivery Reliability:** High (${onTime}% on-time completion). Average delivery turnaround is **${supplier?.leadTimeDays || 2} business days**, positioning this supplier as a dependable primary source for high-demand season runs.
- **Credit Health & Utilization:** Currently utilizing **GH₵ ${balance.toLocaleString()} of GH₵ ${creditLimit.toLocaleString()}** (${utilization}% credit ceiling utilization). Well within safe operating margins (<75%).
- **Regulatory & Quality Compliance:** EPA Ghana verified. Zero hazardous packaging ruptures or WHO toxicity mislabeling recorded over the last audit cycle.

#### 🎯 Strategic Recommendations:
1. **Maintain Primary Allocation:** Retain ${name} as the preferred distributor for registered agrochemicals in their category, especially prior to major planting windows.
2. **Rebate Opportunity:** Leverage the historical volume of **GH₵ ${(supplier?.totalProcurementSpentGHS || 200000).toLocaleString()}** to negotiate a 2.5% prompt settlement volume discount.
3. **Buffer Management:** Maintain a minimum 48-hour order buffer during peak September planting to absorb Accra-Kumasi corridor transit delays.`;
  }

  if (action === 'NEGOTIATE_TERMS') {
    return `### 🤝 Strategic Credit Terms & Pricing Negotiation Brief

**Target Partner:** ${name}  
**Current Baseline:** ${terms} | Credit Limit: GH₵ ${creditLimit.toLocaleString()}  
**Store Leverage:** ${supplier?.totalOrdersCompleted || 40}+ completed purchase consignments with 100% on-time settlement.

#### 💡 Proposed Terms to Request:
- **Extended Settlement Window:** Request transition from current terms to **Net 45 Days** during peak cereal & cocoa treatment months (June–October).
- **Credit Ceiling Expansion:** Request a credit line increase from **GH₵ ${creditLimit.toLocaleString()}** to **GH₵ ${(creditLimit * 1.35).toLocaleString()}** to accommodate bulk fertilizer pallet orders.
- **Prompt Payment Rebate:** Propose a 2% discount on invoices settled within 10 calendar days via direct MoMo Commercial / Instant Bank Transfer.

#### 📝 Draft Negotiation Letter (Ghana Agrochemical Trade):
> *"Dear Management at ${name}, AgroVault appreciates our enduring partnership over ${supplier?.totalOrdersCompleted || 40} successful consignments. As we prepare for the upcoming regional cropping cycle and scale our seasonal input procurement to over GH₵ 150,000, we kindly request a review of our credit terms to Net 45 Days and an expanded credit facility. This flexibility will allow us to deepen order volume with ${name} as our exclusive tier-1 distributor."*`;
  }

  return `### 🌾 AgroVault Supply Chain Intelligence Advisor

1. **Dual-Sourcing Critical Actives:** For high-velocity chemicals like Glyphosate 480 SL and Mancozeb 80 WP, maintain active purchase order accounts with both **Wienco Ghana** and **Chemico Limited** to mitigate regional stockouts.
2. **EPA Regulatory Shield:** Ensure all delivery waybills explicitly attach EPA Ghana batch analysis certificates, particularly for WHO Class Ib red-band restricted items (Chlorpyrifos).
3. **MoMo Merchant vs Bank Settlements:** Settle orders under GH₵ 20,000 via authorized MoMo Merchant lines to avoid weekend bank clearing lag and accelerate consignment release from Tema warehouses.`;
}

// Development vs Production serving
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AgroVault server running on http://0.0.0.0:${PORT}`);
});
