export interface DashboardFilters {
  organizationIds?: string[];
  applicationIds?: string[];
  severities?: string[];
  statuses?: string[];
  reportPeriod?: string;
  reportDateFrom?: string;
  reportDateTo?: string;
  scanStatus?: string[];
  riskLevel?: string[];
  scanReportScope?: string;
  searchQuery?: string;
}
