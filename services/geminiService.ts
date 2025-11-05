import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult, ManpowerRate, EquipmentRate, MaterialRate } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        manpower: { type: Type.STRING },
        unit: { type: Type.STRING },
        unitPrice: { type: Type.NUMBER }, // This will be set to 0 and calculated client-side
        category: { 
            type: Type.STRING,
            description: "A high-level work category for the item, e.g., 'Earthworks', 'Concrete Works', 'MEP', 'Finishing'."
        },
        rateBreakdown: {
            type: Type.OBJECT,
            properties: {
                materials: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            item: { type: Type.STRING },
                            unit: { type: Type.STRING },
                            quantity: { type: Type.NUMBER },
                            unitPrice: { type: Type.NUMBER },
                            cost: { type: Type.NUMBER, description: "Calculated as quantity * unitPrice" },
                        },
                        required: ["item", "unit", "quantity", "unitPrice", "cost"],
                    },
                },
                labor: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            role: { type: Type.STRING },
                            hours: { type: Type.NUMBER },
                            rate: { type: Type.NUMBER },
                            cost: { type: Type.NUMBER },
                        },
                        required: ["role", "hours", "rate", "cost"],
                    },
                },
                equipment: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            item: { type: Type.STRING },
                            hours: { type: Type.NUMBER },
                            rate: { type: Type.NUMBER },
                            cost: { type: Type.NUMBER },
                        },
                        required: ["item", "hours", "rate", "cost"],
                    },
                },
                tools: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            item: { type: Type.STRING },
                            cost: { type: Type.NUMBER },
                        },
                        required: ["item", "cost"],
                    },
                },
                overhead: {
                    type: Type.OBJECT,
                    properties: {
                        percentage: { type: Type.NUMBER },
                    },
                    required: ["percentage"],
                },
                profit: {
                    type: Type.OBJECT,
                    properties: {
                        percentage: { type: Type.NUMBER },
                    },
                    required: ["percentage"],
                },
            },
            required: ["materials", "labor", "equipment", "tools", "overhead", "profit"],
        },
    },
    required: ["manpower", "unit", "unitPrice", "category", "rateBreakdown"],
};

const generateContent = async (prompt: string, schema: any) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.2,
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get response from AI.");
    }
};

export const analyzeDescription = async (
    description: string, 
    itemNotes: string, 
    generalNotes: string,
    sow: string,
    manpowerRates: ManpowerRate[],
    equipmentRates: EquipmentRate[],
    materialRates: MaterialRate[],
): Promise<AiAnalysisResult> => {
    
    const preDefinedRates = `
      ---
      **PRE-DEFINED RATES (Use these exact rates in your calculations):**
      
      **Manpower (QAR/hr):**
      ${manpowerRates.map(r => `- ${r.role}: ${r.effectiveHourlyRate.toFixed(2)}`).join('\n')}

      **Equipment (QAR/hr):**
      ${equipmentRates.map(r => `- ${r.item}: ${r.hourlyRate.toFixed(2)}`).join('\n')}

      **Materials (QAR):**
      ${materialRates.map(m => `- ${m.name}: ${m.unitPrice.toFixed(2)} per ${m.unit}`).join('\n')}

      If a specific role, equipment, or material required for the task is NOT in this list, estimate its rate based on the Qatar market. For all items IN THIS LIST, you MUST use the provided rate.
      ---
    `;

    const prompt = `
        Analyze the following construction work description. You MUST consider all provided context for an accurate result, in order of importance:
        1.  **Project Scope of Work (SOW)**: for the highest-level project objective.
        2.  **General Project Notes**: for overall project-wide details and constraints.
        3.  **Item-Specific Notes**: for details related to this specific task.
        4.  **PRE-DEFINED RATES**: for costing. You must prioritize using these rates.

        Based on standard industry practices and pricing in Doha, Qatar, provide:
        1.  The typical manpower required (e.g., '1 Mason, 2 Helpers').
        2.  The standard measurement unit (e.g., m³, m², kg).
        3.  A high-level work category (e.g., 'Earthworks', 'Concrete Works', 'Finishing').
        4.  A detailed breakdown of the unit price (BSR) in QAR, using the provided pre-defined rates where applicable. For materials, provide item, unit, quantity, unit price, and total cost.
        5.  A suggested overhead percentage.
        6.  A suggested profit percentage.

        ${preDefinedRates}

        ---
        **Project Scope of Work (SOW):**
        ${sow || 'Not provided'}
        ---
        **General Project Notes:**
        ${generalNotes || 'None'}
        ---
        **Item-Specific Notes:**
        ${itemNotes || 'None'}
        ---
        **Work Description:**
        "${description}"
        ---

        Return the response as a single, clean JSON object matching the provided schema. Ensure all costs are in QAR. The pricing should be comprehensive and reflect the context provided in the notes. Set the root 'unitPrice' field to 0 as it is calculated on the client.
    `;

    const result = await generateContent(prompt, responseSchema) as AiAnalysisResult;
    if (!result.rateBreakdown || !result.rateBreakdown.overhead || !result.rateBreakdown.profit) {
        throw new Error("Invalid JSON structure received from AI.");
    }
    return result;
};

export const analyzeRateForDatabase = async (role: string): Promise<Partial<ManpowerRate>> => {
    const prompt = `
        For a "${role}" in the construction industry in Doha, Qatar, provide a typical monthly and yearly cost breakdown. 
        I need:
        1. monthlySalary: A typical basic monthly salary in QAR.
        2. accommodation: A reasonable monthly allowance for shared accommodation.
        3. transport: A reasonable monthly allowance for transport to/from work sites.
        4. visaCostPerYear: The typical cost of visa renewal, averaged per year (e.g., if a 1000 QAR visa is renewed every 2 years, this value should be 500).
        5. annualFlightTicketCost: The cost of a flight ticket home, provided annually.
        6. leaveSettlementDaysPerYear: The number of days of basic salary accrued as end-of-service gratuity per year. This is standardly 21 in Qatar.

        Return a single, clean JSON object.
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            monthlySalary: { type: Type.NUMBER },
            accommodation: { type: Type.NUMBER },
            transport: { type: Type.NUMBER },
            visaCostPerYear: { type: Type.NUMBER },
            annualFlightTicketCost: { type: Type.NUMBER },
            leaveSettlementDaysPerYear: { type: Type.NUMBER, description: "Should typically be 21" },
        },
        required: ["monthlySalary", "accommodation", "transport", "visaCostPerYear", "annualFlightTicketCost", "leaveSettlementDaysPerYear"],
    };
    return await generateContent(prompt, schema);
};

export const analyzeMaterialForDatabase = async (materialName: string): Promise<Partial<MaterialRate>> => {
    const prompt = `
      For the construction material "${materialName}" in Doha, Qatar, provide the following:
      1. unit: The standard measurement unit (e.g., 'bag', 'm³', 'ton', 'kg').
      2. unitPrice: A typical market price for that unit in QAR.
      
      Return a single, clean JSON object.
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            unit: { type: Type.STRING },
            unitPrice: { type: Type.NUMBER },
        },
        required: ["unit", "unitPrice"],
    };
    return await generateContent(prompt, schema);
};