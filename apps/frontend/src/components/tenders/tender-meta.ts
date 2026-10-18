export const TENDER_CATEGORIES = [
  'Road Construction',
  'Building Construction',
  'Bridge & Structures',
  'Water & Irrigation',
  'Earthworks',
  'Machinery Rental',
  'Supply',
  'Consultancy',
  'Other',
];

export const TENDER_PROCUREMENT_METHODS = [
  'Open National Bidding',
  'Open International Bidding',
  'Restricted Bidding',
  'Request for Quotation',
  'Direct Procurement',
];

export const TENDER_SOURCES = ['e-GP Portal', 'Newspaper', 'Direct Invitation', 'Le’Kiray Marketplace', 'Other'];

export const TENDER_BID_SECURITY_TYPES = ['Bank Guarantee', 'CPO', 'Insurance Bond', 'Cash'];

/** Board columns, in pipeline order */
export const PIPELINE_STAGES = ['Identified', 'Preparing', 'Submitted', 'Under Evaluation'] as const;
export const CLOSED_STAGES = ['Won', 'Lost', 'No Bid', 'Cancelled'] as const;

/** Mirrors STATUS_TRANSITIONS in the backend tenders.service.ts */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  Identified: ['Preparing', 'No Bid', 'Cancelled'],
  Preparing: ['Identified', 'Submitted', 'No Bid', 'Cancelled'],
  Submitted: ['Under Evaluation', 'Cancelled'],
  'Under Evaluation': ['Submitted', 'Cancelled'],
  'No Bid': ['Identified'],
  Cancelled: [],
  Won: [],
  Lost: [],
};

export const STAGE_STYLES: Record<string, { dot: string; badge: string; column: string }> = {
  Identified: { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 border-slate-200', column: 'border-t-slate-400' },
  Preparing: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 border-amber-200', column: 'border-t-amber-500' },
  Submitted: { dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-800 border-sky-200', column: 'border-t-sky-500' },
  'Under Evaluation': { dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-800 border-violet-200', column: 'border-t-violet-500' },
  Won: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', column: 'border-t-emerald-500' },
  Lost: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-800 border-rose-200', column: 'border-t-rose-500' },
  'No Bid': { dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-500 border-slate-200', column: 'border-t-slate-300' },
  Cancelled: { dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-500 border-slate-200 line-through', column: 'border-t-slate-300' },
};

export interface TenderListItem {
  id: string;
  tenderNumber: string;
  title: string;
  procuringEntity: string;
  category: string;
  procurementMethod: string;
  requiredGrade?: string | null;
  regionOrCity?: string | null;
  location?: string | null;
  status: string;
  winProbability: number;
  estimatedValue: number;
  bidAmount?: number | null;
  awardedAmount?: number | null;
  bidSecurityAmount: number;
  submissionDeadline: string;
  bidManager?: { id: string; firstName: string; lastName: string } | null;
  convertedProject?: { id: string; projectName: string } | null;
  checklistTotal: number;
  checklistDone: number;
}

export interface TenderSummary {
  totalTenders: number;
  openCount: number;
  byStatus: Record<string, number>;
  openPipelineValue: number;
  weightedPipelineValue: number;
  wonCount: number;
  lostCount: number;
  wonValue: number;
  winRate: number | null;
  dueThisWeek: number;
  overdue: number;
  bidSecurityOutstanding: number;
}

/** "ETB 185.4M" style compact money for dense cards */
export function formatCompactETB(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `ETB ${(amount / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `ETB ${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `ETB ${(amount / 1_000).toFixed(0)}K`;
  return `ETB ${amount.toFixed(0)}`;
}

export type DeadlineTone = 'overdue' | 'critical' | 'soon' | 'normal' | 'closed';

/** Human countdown to the submission deadline, with an urgency tone for styling */
export function describeDeadline(deadline: string, status: string, now = Date.now()): { label: string; tone: DeadlineTone } {
  const preSubmission = status === 'Identified' || status === 'Preparing';
  const ms = new Date(deadline).getTime() - now;

  if (!preSubmission) {
    return { label: new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), tone: 'closed' };
  }
  if (ms < 0) return { label: 'Deadline passed', tone: 'overdue' };

  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (hours < 48) {
    return { label: hours < 1 ? 'Due within the hour' : `${days > 0 ? `${days}d ` : ''}${hours % 24}h left`, tone: 'critical' };
  }
  if (days <= 7) return { label: `${days} days left`, tone: 'soon' };
  return { label: `${days} days left`, tone: 'normal' };
}

export function toDateInput(value?: string | null): string {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

/** Value for <input type="datetime-local"> in the user's local time */
export function toDateTimeInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}
