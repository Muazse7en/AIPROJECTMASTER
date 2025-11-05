export interface Material {
  item: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  cost: number;
}

export interface Labor {
  role: string;
  hours: number;
  rate: number;
  cost: number;
}

export interface Equipment {
  item: string;
  hours: number;
  rate: number;
  cost: number;
}

export interface Tool {
    item: string;
    cost: number;
}

export interface Overhead {
    percentage: number;
    amount: number;
}

export interface Profit {
    percentage: number;
    amount: number;
}

export interface RateBreakdown {
  materials: Material[];
  labor: Labor[];
  equipment: Equipment[];
  tools: Tool[];
  subtotal: number;
  overhead: Overhead;
  profit: Profit;
  total: number;
  quotedUnitPrice: number;
}

export interface BOQItem {
  id: number;
  description: string;
  unit: string;
  quantity: number;
  manpower: string;
  unitPrice: number;
  total: number;
  rateBreakdown: RateBreakdown | null;
  isAiAssisted: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  notes?: string;
  category?: string;
}

export interface AiAnalysisResult {
    manpower: string;
    unit: string;
    unitPrice: number; 
    category: string;
    rateBreakdown: Omit<RateBreakdown, 'subtotal' | 'total' | 'overhead' | 'profit' | 'quotedUnitPrice'> & {
        overhead: { percentage: number };
        profit: { percentage: number };
    };
}

// --- New Database Types ---

export interface ManpowerRate {
    id: number;
    role: string;
    monthlySalary: number; // QAR
    accommodation: number; // QAR/month
    transport: number; // QAR/month
    visaCostPerYear: number; // QAR
    annualFlightTicketCost: number; // QAR
    leaveSettlementDaysPerYear: number; // e.g., 21 days of basic salary
    effectiveHourlyRate: number; // Calculated
}

export interface EquipmentRate {
    id: number;
    item: string;
    hourlyRate: number; // QAR
}

export interface MaterialRate {
    id: number;
    name: string;
    unit: string;
    unitPrice: number; // QAR
    supplier?: string;
}

export interface ClientProfile {
    id: number;
    name: string;
    markupPercentage: number; // e.g., 10 for 10%
}

export interface Database {
    manpowerRates: ManpowerRate[];
    equipmentRates: EquipmentRate[];
    clientProfiles: ClientProfile[];
    materialRates: MaterialRate[];
}