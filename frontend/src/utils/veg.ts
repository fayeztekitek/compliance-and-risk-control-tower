export const REGIONS = ["EU", "Americas", "UK", "APAC"];
export const BUSINESS_LINES = ["Colline", "Soliam", "Solife", "Megara", "Digital", "Regulatory", "Numilog", "Insurance France", "Wealth Management", "Shared"];
export const DECISIONS = ["GO FINAL", "GO INITIAL", "GO without Committee", "BID", "Differed", "No GO", "Postponed", "BACKLOG", "WITHDRAWN", "CANCELLED"];
export const WF_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CONTRACT_SIGNATURE"];
export const WF_TYPES = ["RFI", "RFP", "NEW_CLIENT_REQUEST", "BD_REQUEST", "ACC_CODE_CREATION", "BID_COMMITTEE_OVERSIGHT"];

export function fmtNum(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function fmtK(num: number) {
  if (num >= 1000) return (num / 1000).toFixed(1) + "M";
  return fmtNum(num) + "K";
}
