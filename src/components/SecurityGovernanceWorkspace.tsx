/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Sliders,
  AlertTriangle,
  Plus,
  ArrowRight,
  Database,
  Lock,
  Calendar,
  FileText,
  Globe,
  Upload,
  Activity,
  Check,
  RefreshCw,
  Layers,
  Package,
  Briefcase,
  GitBranch,
  AlertCircle,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import {
  store,
  getCurrentRole,
  addAuditTrail,
  createNotification,
} from "../store/complianceStore";
import { Vulnerability, Waiver, RiskAcceptance } from "../types";

// --- Security Scan Ingestion & Spreadsheet Definitions ---
import * as XLSX from "xlsx";

export interface SecurityScanRow {
  id: string;
  product: string;
  scanType: string;
  sonarCritical: number;
  sonarHigh: number;
  fortifyCritical: number;
  fortifyHigh: number;
  sonatypeCritical: number; // Nexus-IQ (Sonatype)
  sonatypeHigh: number;
  date: string;
  comment: string;
  ingested?: boolean;
}

const INITIAL_EXCEL_SCANS: SecurityScanRow[] = [
  {
    id: "sc-001",
    product: "(LSB_CRETA_SSOAT_Officialrelease)",
    scanType: "Last scan(08 Jun 2026)",
    sonarCritical: 0,
    sonarHigh: 0,
    fortifyCritical: 0,
    fortifyHigh: 0,
    sonatypeCritical: 17,
    sonatypeHigh: 75,
    date: "08 Jun 2026",
    comment: "High vulnerability footprint detected due to obsolete SSO token library dependencies"
  },
  {
    id: "sc-002",
    product: "Issuer CSD (Standard) | Patch_trunk_5 (Patch_trunk_5)",
    scanType: "Previous scan(01 Jun 2026)",
    sonarCritical: 0,
    sonarHigh: 0,
    fortifyCritical: 0,
    fortifyHigh: 0,
    sonatypeCritical: 9,
    sonatypeHigh: 77,
    date: "01 Jun 25",
    comment: "Baseline security scan verified"
  },
  {
    id: "sc-003",
    product: "Issuer CSD (Standard) | Patch_trunk_5 (Patch_trunk_5)",
    scanType: "Last scan(08 Jun 2026)",
    sonarCritical: 0,
    sonarHigh: 0,
    fortifyCritical: 0,
    fortifyHigh: 0,
    sonatypeCritical: 9,
    sonatypeHigh: 78,
    date: "08 Jun 2026",
    comment: "Regression detected in Sonatype Nexus-IQ (1 new high-severity package vulnerability)"
  },
  {
    id: "sc-004",
    product: "Issuer CSD (Standard) | Prod Copenhagen (Patch_22.9.1.29.1_Vul)",
    scanType: "Previous scan(01 Jun 2026)",
    sonarCritical: 0,
    sonarHigh: 0,
    fortifyCritical: 0,
    fortifyHigh: 0,
    sonatypeCritical: 8,
    sonatypeHigh: 78,
    date: "01 Jun 2026",
    comment: "Stable release point"
  },
  {
    id: "sc-005",
    product: "Issuer CSD (Standard) | Prod Copenhagen (Patch_22.9.1.29.1_Vul)",
    scanType: "Last scan(08 Jun 2026)",
    sonarCritical: 0,
    sonarHigh: 0,
    fortifyCritical: 0,
    fortifyHigh: 0,
    sonatypeCritical: 8,
    sonatypeHigh: 79,
    date: "08 Jun 2026",
    comment: "Minor version release scan"
  },
  {
    id: "sc-006",
    product: "Issuer CSD (Standard) | Prod Porto (STD_Support_Megara_25.11)",
    scanType: "Previous scan(01 Jun 2026)",
    sonarCritical: 0,
    sonarHigh: 0,
    fortifyCritical: 0,
    fortifyHigh: 0,
    sonatypeCritical: 8,
    sonatypeHigh: 78,
    date: "01 Jun 2026",
    comment: "Legacy core engine baseline"
  },
  {
    id: "sc-007",
    product: "Issuer CSD (Standard) | Prod Porto (STD_Support_Megara_25.11)",
    scanType: "Last scan(08 Jun 2026)",
    sonarCritical: 0,
    sonarHigh: 0,
    fortifyCritical: 0,
    fortifyHigh: 0,
    sonatypeCritical: 8,
    sonatypeHigh: 79,
    date: "08 Jun 2026",
    comment: "Scheduled security audit run"
  }
];

interface DevOpsSecVulnerability {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  sourceScanner: "VERACODE" | "NEXPOSE" | "PEN_TEST";
  detectedDate: string;
  slaDueDate: string;
  targetProduct: string;
  owner: string;
  description: string;
}

const DEVOPS_SEC_VULNERABILITIES: Record<string, DevOpsSecVulnerability[]> = {
  megara: [
    {
      id: "VULN-MEG-2026-01",
      title: "Broken Encryption standards in Megara Token Agent API",
      severity: "HIGH",
      sourceScanner: "NEXPOSE",
      detectedDate: "2026-06-05",
      slaDueDate: "2026-07-05",
      targetProduct: "Megara Security Token Registry",
      owner: "Jean Dupont",
      description: "Fallback to vulnerable DES key agreement protocols allows an active network eavesdropper to reconstruct communication payloads.",
    },
    {
      id: "VULN-MEG-2026-02",
      title: "Java deserialization of untrusted data in Megara Token Broker",
      severity: "CRITICAL",
      sourceScanner: "VERACODE",
      detectedDate: "2026-06-06",
      slaDueDate: "2026-06-13",
      targetProduct: "Megara Security Token Registry",
      owner: "Thomas Lemaire",
      description: "Unsafe ObjectInputStream reading of Megara tokens triggers automated code execution chain.",
    },
    {
      id: "VULN-MEG-2026-03",
      title: "JSON Web Token (JWT) Signature Verification Bypass on central broker",
      severity: "CRITICAL",
      sourceScanner: "PEN_TEST",
      detectedDate: "2026-06-08",
      slaDueDate: "2026-06-15",
      targetProduct: "Megara Security Token Registry",
      owner: "Thomas Lemaire",
      description: "Acceptance of 'none' algorithm block in authorization header permits attackers to generate arbitrary administrative sessions.",
    }
  ],
  soliam: [
    {
      id: "VULN-SOL-2026-01",
      title: "Unsecured document storage bucket path leakage in Soliam Portal",
      severity: "CRITICAL",
      sourceScanner: "PEN_TEST",
      detectedDate: "2026-05-02",
      slaDueDate: "2026-05-09",
      targetProduct: "Soliam Cloud Migration",
      owner: "Sarah Laroche",
      description: "Insecure direct storage patterns in Soliam cloud templates leave audit transcripts available to the broader web without key verification.",
    },
    {
      id: "VULN-SOL-2026-02",
      title: "Improper Access Control in Soliam Document Rest Endpoint",
      severity: "HIGH",
      sourceScanner: "VERACODE",
      detectedDate: "2026-06-02",
      slaDueDate: "2026-07-02",
      targetProduct: "Soliam Cloud Migration",
      owner: "Sarah Laroche",
      description: "Unauthorized tenants can fetch other users' portfolio ledger indexes via parameter tampering of REST file parameters.",
    },
    {
      id: "VULN-SOL-2026-03",
      title: "Unrestricted PostgreSQL Ingress on Soliam DB Subnet",
      severity: "HIGH",
      sourceScanner: "NEXPOSE",
      detectedDate: "2026-06-07",
      slaDueDate: "2026-07-07",
      targetProduct: "Soliam Cloud Migration",
      owner: "Robert Martin",
      description: "Database port 5432 is exposed directly on external VPC interfaces, enabling brute-forcing of ledger administrator credentials.",
    },
    {
      id: "VULN-SOL-2026-04",
      title: "Missing Rate Limiting on Soliam OTP endpoint",
      severity: "HIGH",
      sourceScanner: "VERACODE",
      detectedDate: "2026-06-08",
      slaDueDate: "2026-07-08",
      targetProduct: "Soliam Cloud Migration",
      owner: "Robert Martin",
      description: "Absence of client rate throttling allows systematic OTP confirmation guessing during high-worth transaction signing processes.",
    }
  ],
  digital_insurance: [
    {
      id: "VULN-INS-2026-01",
      title: "Client-side XSS on Vermeg Digital Insurance Quote Calculator",
      severity: "HIGH",
      sourceScanner: "VERACODE",
      detectedDate: "2026-06-04",
      slaDueDate: "2026-07-04",
      targetProduct: "DIG Digital Insurance",
      owner: "Sarah Laroche",
      description: "Reflection of client quote calculations back to browser scripts without sanitizing HTML tags allows script injections.",
    },
    {
      id: "VULN-INS-2026-02",
      title: "Broker profile information leakage on Digital Insurance Middleware",
      severity: "CRITICAL",
      sourceScanner: "PEN_TEST",
      detectedDate: "2026-06-10",
      slaDueDate: "2026-06-17",
      targetProduct: "DIG Digital Insurance",
      owner: "Thomas Lemaire",
      description: "Unauthenticated API path exposes private broker identities, contract margins, and commission percentages back to regular browsers.",
    }
  ],
  solife: [
    {
      id: "VULN-SLF-2026-01",
      title: "Cross-Site Scripting (Reflected) in Solife Admin Panel",
      severity: "HIGH",
      sourceScanner: "VERACODE",
      detectedDate: "2026-04-10",
      slaDueDate: "2026-05-10",
      targetProduct: "Solife Custom Client Portal",
      owner: "Sarah Laroche",
      description: "Unescaped name feedback fields in Solife administration dashboard facilitate reflected scripts inside customer helpdesks.",
    },
    {
      id: "VULN-SLF-2026-02",
      title: "Unencrypted Redis Session Cache in Solife",
      severity: "HIGH",
      sourceScanner: "NEXPOSE",
      detectedDate: "2026-03-10",
      slaDueDate: "2026-04-09",
      targetProduct: "Solife Custom Client Portal",
      owner: "Robert Martin",
      description: "Session tokens are stored and synchronized in plain text to the shared Redis backend in the default cluster configuration.",
    },
    {
      id: "VULN-SLF-2026-03",
      title: "Actuarial formula evaluator shell command injections",
      severity: "CRITICAL",
      sourceScanner: "VERACODE",
      detectedDate: "2026-06-01",
      slaDueDate: "2026-06-08",
      targetProduct: "Solife Custom Client Portal",
      owner: "Sarah Laroche",
      description: "Mathematical computation wrapper utilizes user-submitted mathematical signs directly in command line executions.",
    }
  ],
  framework: [
    {
      id: "VULN-FRM-2026-01",
      title: "Missing Co-sign / Sigstore Signatures for Palmyra Docker Images",
      severity: "HIGH",
      sourceScanner: "PEN_TEST",
      detectedDate: "2026-06-08",
      slaDueDate: "2026-07-08",
      targetProduct: "Palmyra Platform",
      owner: "Thomas Lemaire",
      description: "Production container templates are pulled from repository hubs without verifying digest signatures, opening path for image poisoning.",
    },
    {
      id: "VULN-FRM-2026-02",
      title: "Plaintext Vault Token Exposure in Palmyra GitLab Runner Environment Variables",
      severity: "CRITICAL",
      sourceScanner: "VERACODE",
      detectedDate: "2026-06-09",
      slaDueDate: "2026-06-16",
      targetProduct: "Palmyra Platform",
      owner: "Thomas Lemaire",
      description: "Vulnerabilities parsed through the CI runner allow arbitrary users with repository reading rights to fetch master Vault credentials.",
    },
    {
      id: "VULN-FRM-2026-03",
      title: "Remote Code Execution in Apache Commons Configuration (CVE-2026-1926)",
      severity: "CRITICAL",
      sourceScanner: "VERACODE",
      detectedDate: "2026-05-24",
      slaDueDate: "2026-06-23",
      targetProduct: "Palmyra Platform",
      owner: "Thomas Lemaire",
      description: "Palmyra configuration parser uses vulnerable classloaders supporting unsafe file system resolution mechanics.",
    },
    {
      id: "VULN-FRM-2026-04",
      title: "Improper Validation of XML Entities (XXE) in Palmyra Parser",
      severity: "HIGH",
      sourceScanner: "VERACODE",
      detectedDate: "2026-05-27",
      slaDueDate: "2026-06-26",
      targetProduct: "Palmyra Platform",
      owner: "Thomas Lemaire",
      description: "Security parsing logic doesn't turn off external entities loading, exposing localized system file assets to user view.",
    }
  ],
  solife_plat: [
    {
      id: "VULN-SDP-2026-01",
      title: "Insecure Direct Object Reference (IDOR) on Solife Digital Platform user profile",
      severity: "CRITICAL",
      sourceScanner: "VERACODE",
      detectedDate: "2026-06-02",
      slaDueDate: "2026-06-09",
      targetProduct: "Solife Custom Client Portal",
      owner: "Sarah Laroche",
      description: "Querying profile identity metrics accepts random keys, disclosing client portfolio balances across the web.",
    },
    {
      id: "VULN-SDP-2026-02",
      title: "Unvalidated SAML XML Signatures on Digital Platform login provider",
      severity: "HIGH",
      sourceScanner: "PEN_TEST",
      detectedDate: "2026-06-05",
      slaDueDate: "2026-07-05",
      targetProduct: "Solife Custom Client Portal",
      owner: "Sarah Laroche",
      description: "Login token validators allow incoming authorization envelopes without checking matching cryptographical signs.",
    }
  ],
  digital_banking: [
    {
      id: "VULN-DBK-2026-01",
      title: "SAML Service Provider XML Signature Wrapping in DIG Suite",
      severity: "HIGH",
      sourceScanner: "PEN_TEST",
      detectedDate: "2026-06-01",
      slaDueDate: "2026-07-01",
      targetProduct: "DIG Digital Banking Onboarding",
      owner: "Thomas Lemaire",
      description: "Attackers can intercept authentication responses and inject custom user roles inside separate soap envelop wrapping layers.",
    },
    {
      id: "VULN-DBK-2026-02",
      title: "Unauthenticated Actuator Endpoint leakage in DIG Retail gateway",
      severity: "MEDIUM",
      sourceScanner: "NEXPOSE",
      detectedDate: "2026-05-20",
      slaDueDate: "2026-08-18",
      targetProduct: "DIG Digital Banking Onboarding",
      owner: "Clara Besson",
      description: "Standard spring actuators expose java system environment details, revealing connection links and active vault logins.",
    },
    {
      id: "VULN-DBK-2026-03",
      title: "Hardcoded Sandbox Credential in Test Script on DIG Retail testsuites",
      severity: "MEDIUM",
      sourceScanner: "VERACODE",
      detectedDate: "2026-06-05",
      slaDueDate: "2026-09-03",
      targetProduct: "DIG Digital Banking Onboarding",
      owner: "Clara Besson",
      description: "QA test configurations integrate direct plain-text connection codes, cached in public automation build artifacts.",
    }
  ],
  colline: [
    {
      id: "VULN-COL-2026-01",
      title: "SQL Injection in Colline Query Processor",
      severity: "CRITICAL",
      sourceScanner: "VERACODE",
      detectedDate: "2026-05-18",
      slaDueDate: "2026-06-17",
      targetProduct: "Colline Integration",
      owner: "Thomas Lemaire",
      description: "Colline filter parser directly feeds string parameters to sql queries, enabling arbitrary command insertions.",
    },
    {
      id: "VULN-COL-2026-02",
      title: "Remote Code Execution in Spring Boot framework dependency (Colline REST backend)",
      severity: "CRITICAL",
      sourceScanner: "VERACODE",
      detectedDate: "2026-06-05",
      slaDueDate: "2026-06-12",
      targetProduct: "Colline Integration",
      owner: "Thomas Lemaire",
      description: "Vulnerable Spring modules in the REST backend allow deserialization attacks, enabling shell commands execute permissions.",
    },
    {
      id: "VULN-COL-2026-03",
      title: "Insecure JWT Key rotation inside Colline collateral parser app",
      severity: "HIGH",
      sourceScanner: "PEN_TEST",
      detectedDate: "2026-06-08",
      slaDueDate: "2026-07-08",
      targetProduct: "Colline Integration",
      owner: "Thomas Lemaire",
      description: "Collateral APIs reuse expired token keys indefinitely, bypassing regular user session validation timers.",
    }
  ]
};

export default function SecurityGovernanceWorkspace() {
  const role = getCurrentRole();
  const rawVulns = store.getVulnerabilities();
  const rawWaivers = store.getWaivers();
  const rawAccepts = store.getRiskAcceptances();
  const rawSlaIncidents = store.getSlaIncidents();
  const rawProjects = store.getProjects();
  const rawRoadmaps = store.getRoadmaps();

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterScanner, setFilterScanner] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const [activeSegment, setActiveSegment] = useState<"VULNERABILITIES" | "EXCEPTIONS" | "SLA_INCIDENTS" | "EXECUTIVE_COMMITTEE">("VULNERABILITIES");
  const [vulnerabilitiesLayoutMode, setVulnerabilitiesLayoutMode] = useState<"LIST" | "PRODUCT" | "PROJECT" | "VERSION" | "HEATMAP">("LIST");

  // Heatmap extra states
  const [heatmapProductFilter, setHeatmapProductFilter] = useState<string>("ALL");
  const [heatmapProjectFilter, setHeatmapProjectFilter] = useState<string>("ALL");
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{ probability: number; impact: number } | null>(null);

  // --- Predictive Risk Projection Engine ---
  const [riskProjectionEnabled, setRiskProjectionEnabled] = useState(false);
  const [projectionTimelineDays, setProjectionTimelineDays] = useState<number>(30);

  // Derive historical velocities
  const computedForecastStats = (() => {
    const totalCount = rawVulns.length;
    
    // Remediation rate from raw list (Remediated or False positive represent resolved efforts)
    const remediatedVulns = rawVulns.filter(v => v.status === "REMEDIATED");
    const remediatedCount = remediatedVulns.length;

    // Detection timeframe span
    const dates = rawVulns.map(v => new Date(v.detectedDate).getTime()).filter(t => !isNaN(t));
    const earliestDate = dates.length > 0 ? Math.min(...dates) : new Date("2026-05-01").getTime();
    const currentDate = new Date("2026-06-10").getTime();
    
    const scopeDays = Math.max(15, (currentDate - earliestDate) / (1000 * 60 * 60 * 24));
    
    // Velocity per day (remediation)
    const remediationRate = remediatedCount / scopeDays;
    const finalRemVelocity = Math.max(0.12, remediationRate); // Ensure realistic minimum velocity

    // Arrival rate per day (new detections)
    const arrivalRate = totalCount / scopeDays;
    const finalArrVelocity = Math.max(0.25, arrivalRate); // Ensure realistic minimum incoming

    const netRate = finalArrVelocity - finalRemVelocity;

    return {
      scopeDays,
      remediationVelocity: finalRemVelocity,
      arrivalVelocity: finalArrVelocity,
      netRate,
      remediatedCount,
      totalCount
    };
  })();

  // Build projected list of vulnerabilities
  const projectedVulnsList: Array<Vulnerability & { isProjectedNew?: boolean; isProjectedResolved?: boolean; forecastLabel?: string }> = (() => {
    if (!riskProjectionEnabled) {
      return rawVulns;
    }

    // Capacity calculations
    const capacityToRemediate = Math.round(projectionTimelineDays * computedForecastStats.remediationVelocity);
    const capacityToAdd = Math.round(projectionTimelineDays * computedForecastStats.arrivalVelocity);

    // Filter open/unresolved vulnerabilities needing attention
    const unresolvedVulns = rawVulns.filter(v => v.status !== "REMEDIATED" && v.status !== "FALSE_POSITIVE");

    // Rank unresolved vulnerabilities by remediation priority (CRITICAL/HIGH first, then oldest detectedDate)
    const sortedToRemediate = [...unresolvedVulns].sort((a, b) => {
      const getSevRank = (sev: string) => {
        if (sev === "CRITICAL") return 4;
        if (sev === "HIGH") return 3;
        if (sev === "MEDIUM") return 2;
        return 1;
      };
      const rankDiff = getSevRank(b.severity) - getSevRank(a.severity);
      if (rankDiff !== 0) return rankDiff;
      
      return new Date(a.detectedDate).getTime() - new Date(b.detectedDate).getTime();
    });

    const resolvedIds = new Set<string>();
    for (let i = 0; i < Math.min(capacityToRemediate, sortedToRemediate.length); i++) {
      resolvedIds.add(sortedToRemediate[i].id);
    }

    // Map existing: some are resolved, some remain open
    const mappedExisting = rawVulns.map(v => {
      if (resolvedIds.has(v.id)) {
        return {
          ...v,
          status: "REMEDIATED" as const,
          remediatedDate: "Projected",
          isProjectedResolved: true,
          forecastLabel: "Projected resolved by active SecOps performance velocity"
        };
      }
      if (v.status !== "REMEDIATED" && v.status !== "FALSE_POSITIVE") {
        return {
          ...v,
          isProjectedResolved: false,
          forecastLabel: "Projected to remain open in team backlog due to capacity constraints"
        };
      }
      return v;
    });

    // Generate projected new vulnerabilities that will arrive in backlog
    const simulatedNew: Array<Vulnerability & { isProjectedNew: boolean; forecastLabel: string }> = [];
    
    // Preset array of realistic vulnerabilities to select from deterministically
    const presetProjectedTemplates = [
      {
        title: "Docker Base Image OS Library Out-of-bounds Read in Alpine libc",
        severity: "HIGH",
        sourceScanner: "NEXPOSE",
        targetProduct: "Palmyra Platform",
        owner: "Thomas Lemaire"
      },
      {
        title: "Broken Object Level Authorization in Colline Margin Call API Gateway",
        severity: "CRITICAL",
        sourceScanner: "PEN_TEST",
        targetProduct: "Colline Integration",
        owner: "Thomas Lemaire"
      },
      {
        title: "Spring Security Session Bypass via Header Spoofing on Microservice Node",
        severity: "CRITICAL",
        sourceScanner: "VERACODE",
        targetProduct: "Soliam Cloud Migration",
        owner: "Robert Martin"
      },
      {
        title: "Insecure Direct Object Reference in Solife Premium Quote PDF Generation Engine",
        severity: "HIGH",
        sourceScanner: "PEN_TEST",
        targetProduct: "Other Products & DIG Suite",
        owner: "Sarah Laroche"
      },
      {
        title: "Sensitive Environment Variable Exposure in Kubernetes Pod Config Template",
        severity: "HIGH",
        sourceScanner: "NEXPOSE",
        targetProduct: "Palmyra Platform",
        owner: "Sarah Laroche"
      },
      {
        title: "Denial of Service via Heavy Regular Expression in Content Gateway Parser",
        severity: "MEDIUM",
        sourceScanner: "VERACODE",
        targetProduct: "Palmyra Platform",
        owner: "Robert Martin"
      },
      {
        title: "Cryptographic Weakness: Predictable Random Seed in Session Tokens",
        severity: "HIGH",
        sourceScanner: "PEN_TEST",
        targetProduct: "Megara Security Token Registry",
        owner: "Thomas Lemaire"
      },
      {
        title: "Unvalidated Redirect in Client Onboarding Redirect Action Flow Dispatcher",
        severity: "LOW",
        sourceScanner: "VERACODE",
        targetProduct: "Other Products & DIG Suite",
        owner: "Clara Besson"
      }
    ];

    for (let i = 0; i < capacityToAdd; i++) {
      const template = presetProjectedTemplates[i % presetProjectedTemplates.length];
      const codeId = `PROJECTED-2026-${String(i + 1).padStart(3, "0")}`;
      simulatedNew.push({
        id: codeId,
        title: template.title,
        severity: template.severity as any,
        status: "OPEN" as const,
        sourceScanner: template.sourceScanner as any,
        detectedDate: "Projected Detected",
        slaDueDate: "Projected Due",
        isFalsePositive: false,
        targetProduct: template.targetProduct,
        owner: template.owner,
        isProjectedNew: true,
        forecastLabel: "Projected new arrival based on incoming security discovery velocity"
      });
    }

    return [...mappedExisting, ...simulatedNew];
  })();

  // Selection state
  const [selectedVulnId, setSelectedVulnId] = useState<string | null>(
    rawVulns.length > 0 ? rawVulns[0].id : null
  );

  // Exception form state
  const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);
  const [isRaModalOpen, setIsRaModalOpen] = useState(false);
  const [exceptionVulnId, setExceptionVulnId] = useState("");
  const [exceptionRationale, setExceptionRationale] = useState("");
  const [exceptionImpact, setExceptionImpact] = useState("");
  const [exceptionMitigation, setExceptionMitigation] = useState("");
  const [exceptionExpiry, setExceptionExpiry] = useState("2026-12-31");

  // False Positive dialog trigger
  const [fpTriggerVulnId, setFpTriggerVulnId] = useState<string | null>(null);
  const [fpRationaleInput, setFpRationaleInput] = useState("");

  // --- Security Scan Spreadsheet (Excel/CSV) States ---
  const [isDevOpsSecOpen, setIsDevOpsSecOpen] = useState(false); // keep same variable to prevent breaking external triggers
  const [excelRows, setExcelRows] = useState<SecurityScanRow[]>(() => {
    const cached = localStorage.getItem("cr_tower_excel_scans_v1");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_EXCEL_SCANS;
  });
  const [selectedExcelRowIds, setSelectedExcelRowIds] = useState<Set<string>>(new Set());
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Auxiliary Telemetry and Plaintext Stream States
  const [devOpsSecRawText, setDevOpsSecRawText] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [devOpsSecTab, setDevOpsSecTab] = useState<"DASHBOARD" | "PRODUCT_PICK" | "TELEMETRY" | "PASTE">("DASHBOARD");
  const [selectedDevOpsSecProduct, setSelectedDevOpsSecProduct] = useState<string | null>(null);
  const [selectedVulnerabilityIds, setSelectedVulnerabilityIds] = useState<Set<string>>(new Set());

  // Sync to localStorage
  const saveExcelRows = (rows: SecurityScanRow[]) => {
    setExcelRows(rows);
    localStorage.setItem("cr_tower_excel_scans_v1", JSON.stringify(rows));
  };

  // Add new empty scan row to spreadsheet
  const handleAddExcelRow = () => {
    const newRow: SecurityScanRow = {
      id: `sc-manual-${Date.now()}`,
      product: "New Product Release Branch / Patch",
      scanType: "Last scan",
      sonarCritical: 0,
      sonarHigh: 0,
      fortifyCritical: 0,
      fortifyHigh: 0,
      sonatypeCritical: 0,
      sonatypeHigh: 0,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      comment: "Manually declared scan"
    };
    saveExcelRows([...excelRows, newRow]);
    setImportSuccessMsg("New empty scan row appended to spreadsheet!");
  };

  // Delete scan row
  const handleDeleteExcelRow = (id: string) => {
    const updated = excelRows.filter(r => r.id !== id);
    saveExcelRows(updated);
    
    const nextSelected = new Set(selectedExcelRowIds);
    nextSelected.delete(id);
    setSelectedExcelRowIds(nextSelected);
  };

  // Edit a cell directly inside spreadsheet
  const handleEditCell = (id: string, field: keyof SecurityScanRow, value: any) => {
    const updated = excelRows.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    saveExcelRows(updated);
  };

  // Bulk ingest selected scans to central register
  const handleIngestExcelScans = () => {
    const selectedRows = excelRows.filter(r => selectedExcelRowIds.has(r.id));
    if (selectedRows.length === 0) return;

    let totalSaved = 0;
    const updatedRows = [...excelRows];

    selectedRows.forEach(scan => {
      const rowIdx = updatedRows.findIndex(r => r.id === scan.id);
      const findingsToCreate: { title: string; severity: "CRITICAL" | "HIGH"; sourceScanner: "VERACODE" | "NEXPOSE" | "PEN_TEST"; count: number }[] = [];
      
      if (scan.sonarCritical > 0) {
        findingsToCreate.push({
          title: `Sonar Critical policy violation: security bypass inside product ${scan.product}`,
          severity: "CRITICAL",
          sourceScanner: "PEN_TEST",
          count: scan.sonarCritical
        });
      }
      if (scan.sonarHigh > 0) {
        findingsToCreate.push({
          title: `Sonar High-severity maintainability hotspots inside product ${scan.product}`,
          severity: "HIGH",
          sourceScanner: "PEN_TEST",
          count: scan.sonarHigh
        });
      }
      
      if (scan.fortifyCritical > 0) {
        findingsToCreate.push({
          title: `Fortify Critical SAST: Injection vulnerability detected in product ${scan.product}`,
          severity: "CRITICAL",
          sourceScanner: "VERACODE",
          count: scan.fortifyCritical
        });
      }
      if (scan.fortifyHigh > 0) {
        findingsToCreate.push({
          title: `Fortify High SAST: Insecure cryptographic algorithms used in product ${scan.product}`,
          severity: "HIGH",
          sourceScanner: "VERACODE",
          count: scan.fortifyHigh
        });
      }
      
      if (scan.sonatypeCritical > 0) {
        findingsToCreate.push({
          title: `Nexus-IQ Critical: Dependency CVE vulnerability detected in product ${scan.product}`,
          severity: "CRITICAL",
          sourceScanner: "NEXPOSE",
          count: scan.sonatypeCritical
        });
      }
      if (scan.sonatypeHigh > 0) {
        findingsToCreate.push({
          title: `Nexus-IQ High: Outdated packages containing critical regressions inside product ${scan.product}`,
          severity: "HIGH",
          sourceScanner: "NEXPOSE",
          count: scan.sonatypeHigh
        });
      }

      findingsToCreate.forEach((f, idx) => {
        const cleanDate = scan.date || new Date().toISOString().split('T')[0];
        const daysToAdd = f.severity === "CRITICAL" ? 7 : 30;
        let dueDate = new Date();
        try {
          dueDate = new Date(cleanDate);
          if (isNaN(dueDate.getTime())) dueDate = new Date();
        } catch (e) {}
        dueDate.setDate(dueDate.getDate() + daysToAdd);
        const formattedDueDate = dueDate.toISOString().split('T')[0];

        store.saveVulnerability({
          id: `VULN-EXCEL-${Date.now()}-${totalSaved}-${idx}`,
          title: f.title,
          severity: f.severity,
          status: "OPEN",
          sourceScanner: f.sourceScanner,
          detectedDate: cleanDate,
          slaDueDate: formattedDueDate,
          targetProduct: scan.product,
          owner: store.getUsers().find(u => u.role === "SECURITY_MANAGER")?.name || "Thomas Lemaire",
          isFalsePositive: false
        });
        totalSaved++;
      });

      if (rowIdx !== -1) {
        updatedRows[rowIdx] = { ...updatedRows[rowIdx], ingested: true };
      }
    });

    saveExcelRows(updatedRows);
    setSelectedExcelRowIds(new Set());

    addAuditTrail(
      "SECURITY",
      "SECURITY",
      `Ingested security scan metrics from Excel. Mapped ${totalSaved} active findings inside central Risk Register.`
    );

    createNotification(
      "Excel Ingestion Complete",
      "ALERT",
      `Successfully processed Excel scans and mapped ${totalSaved} compliance records inside the Tower register.`,
      ["SECURITY_MANAGER", "ADMIN"]
    );

    setImportSuccessMsg(`Successfully ingested selected scans! Generated ${totalSaved} actionable vulnerability items in your central compliance register.`);
    setRefreshTrigger(prev => prev + 1);
  };

  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => {
    return localStorage.getItem("cr_tower_devopssec_last_sync") || "2026-06-10T17:00:00.000Z";
  });
  const [inlineSyncing, setInlineSyncing] = useState(false);

  const handleInlineSync = async () => {
    setInlineSyncing(true);
    try {
      const res = await store.syncWithPortal();
      if (res.success) {
        setLastSyncedTime(res.timestamp);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Inline sync failed:", err);
    } finally {
      setTimeout(() => {
        setInlineSyncing(false);
      }, 1000);
    }
  };

  const filteredVulns = rawVulns.filter((v) => {
    const matchesQuery =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.targetProduct.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = filterSeverity === "ALL" || v.severity === filterSeverity;
    const matchesScanner = filterScanner === "ALL" || v.sourceScanner === filterScanner;
    const matchesStatus = filterStatus === "ALL" || v.status === filterStatus;

    return matchesQuery && matchesSeverity && matchesScanner && matchesStatus;
  });

  const selectedVuln = projectedVulnsList.find((v) => v.id === selectedVulnId);

  // Permissions gate
  const canPerformSecurityOps = ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER"].includes(role);

  // helpers for DevOps-Sec display multi-perspectives
  const getRiskMetrics = (v: Vulnerability) => {
    // Determine Impact (1 to 5)
    let impact = 3;
    if (v.severity === "CRITICAL") impact = 5;
    else if (v.severity === "HIGH") impact = 4;
    else if (v.severity === "MEDIUM") impact = 3;
    else if (v.severity === "LOW") impact = 2;

    // Determine Probability (1 to 5)
    let probability = 3;
    const codeSum = v.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (v.sourceScanner === "PEN_TEST") {
      probability = 4 + (codeSum % 2); // 4 or 5
    } else if (v.sourceScanner === "VERACODE") {
      probability = 3 + (codeSum % 2); // 3 or 4
    } else {
      probability = 1 + (codeSum % 3); // 1, 2, or 3
    }

    return {
      probability: Math.max(1, Math.min(5, probability)),
      impact: Math.max(1, Math.min(5, impact))
    };
  };

  const isVulnMappedToProject = (v: Vulnerability, p: any) => {
    const normTitle = v.title.toLowerCase();
    const normProduct = v.targetProduct.toLowerCase();
    const normProjCode = p.code.toLowerCase();

    if (normProjCode.includes("palm") && (normProduct.includes("palmyra") || normTitle.includes("palmyra"))) return true;
    if (normProjCode.includes("coll") && (normProduct.includes("colline") || normTitle.includes("colline"))) return true;
    if (normProjCode.includes("soli") && (normProduct.includes("soliam") || normProduct.includes("solife") || normTitle.includes("soliam") || normTitle.includes("solife"))) return true;
    if (normProjCode.includes("mega") && (normProduct.includes("megara") || normTitle.includes("megara"))) return true;
    if (normProjCode.includes("dig") && (normProduct.includes("dig") || normProduct.includes("digital") || normTitle.includes("dig") || normTitle.includes("digital"))) return true;
    return false;
  };

  const isVulnMappedToRoadmap = (v: Vulnerability, rm: any) => {
    const normTitle = v.title.toLowerCase();
    const normProduct = v.targetProduct.toLowerCase();
    const rmId = rm.id;

    if (rmId === "RM-2026-001" && (normProduct.includes("palmyra") || normTitle.includes("palmyra"))) return true;
    if (rmId === "RM-2026-003" && (normProduct.includes("colline") || normTitle.includes("colline"))) return true;
    if (rmId === "RM-2026-004" && (normProduct.includes("soliam") || normProduct.includes("solife") || normTitle.includes("soliam") || normTitle.includes("solife"))) return true;
    if (rmId === "RM-2026-005" && (normProduct.includes("megara") || normTitle.includes("megara"))) return true;
    if (rmId === "RM-2026-002" && (normProduct.includes("dig") || normProduct.includes("digital") || normTitle.includes("dig"))) return true;
    return false;
  };

  const VERMEG_PRODUCTS = [
    { name: "Palmyra Platform", key: "Palmyra Platform", desc: "Vermeg core framework, runtime, & high-productivity components", lead: "Thomas Lemaire" },
    { name: "Colline Integration", key: "Colline Integration", desc: "Collateral management & regulatory reporting workflows", lead: "Thomas Lemaire" },
    { name: "Soliam Cloud Migration", key: "Soliam Cloud Migration", desc: "Wealth and investment management cloud application suite", lead: "Robert Martin" },
    { name: "Megara Security Token Registry", key: "Megara Security Token Registry", desc: "Securities repo custody & custom smart asset contracts registry", lead: "Thomas Lemaire" },
    { name: "Other Products & DIG Suite", key: "DIG Digital Banking Onboarding", desc: "DIG banking onboarding pipelines & user portal frontends", lead: "Clara Besson" }
  ];

  const handleToggleFalsePositive = (vulnId: string) => {
    if (!fpRationaleInput) return;
    store.toggleFalsePositive(vulnId, fpRationaleInput);
    setFpTriggerVulnId(null);
    setFpRationaleInput("");
    addAuditTrail(
      "SECURITY_VULN_FALSE_POSITIVE",
      "SECURITY",
      `Validated FP for ${vulnId}`
    );
  };

  const handleWaiverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionVulnId || !exceptionRationale) return;

    const newWaiver: Waiver = {
      id: `WAIVER-2026-00${rawWaivers.length + 1}`,
      vulnerabilityId: exceptionVulnId,
      title: `Security Exception Waiver for ${exceptionVulnId}`,
      rationale: exceptionRationale,
      status: "APPROVED", // Auto approved in sandbox, normally pending
      requestDate: new Date().toISOString().split("T")[0],
      expiryDate: exceptionExpiry,
      approvedBy: "Thomas Lemaire",
    };

    store.saveWaiver(newWaiver);
    setIsWaiverModalOpen(false);
    setExceptionRationale("");

    addAuditTrail(
      "SECURITY_WAIVER_CREATE",
      "SECURITY",
      `Waiver ${newWaiver.id} registered for vulnerability ${exceptionVulnId}`
    );
  };

  const handleRaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionVulnId || !exceptionImpact || !exceptionMitigation) return;

    const newRa: RiskAcceptance = {
      id: `RA-2026-00${rawAccepts.length + 1}`,
      vulnerabilityId: exceptionVulnId,
      title: `Risk Acceptance Agreement for ${exceptionVulnId}`,
      businessImpact: exceptionImpact,
      mitigationPlan: exceptionMitigation,
      status: "APPROVED",
      requestDate: new Date().toISOString().split("T")[0],
      expiryDate: exceptionExpiry,
      approvedBy: "Thomas Lemaire",
    };

    store.saveRiskAcceptance(newRa);
    setIsRaModalOpen(false);
    setExceptionImpact("");
    setExceptionMitigation("");

    addAuditTrail(
      "SECURITY_RA_CREATE",
      "SECURITY",
      `Risk Acceptance ${newRa.id} signed off for vulnerability ${exceptionVulnId}`
    );
  };

  const handleSimulateDevOpsSecSync = () => {
    setIsSyncing(true);
    setSyncLogs([]);
    setSyncSuccess(false);

    const steps = [
      "Establishing secure connection to https://devops-sec.vermeg.com...",
      "Status: Target platform is private. Activating secure pipeline sync proxy...",
      "Analyzing Palmyra core build files and docker compilation logs...",
      "Scanning Colline deployment branch dependencies (Veracode static engine)...",
      "Analyzing Soliam database nodes & cluster ingress posture (Nexpose)...",
      "Filtering active risks against existing waivers and signed Risk Acceptances...",
      "Compiling 5 key DevOps security vulnerabilities under appropriate topics..."
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setSyncLogs(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          const newVulns: Vulnerability[] = [
            {
              id: "VULN-DS-2026-001",
              title: "Missing Co-sign / Sigstore Signatures for Palmyra Docker Images",
              severity: "HIGH",
              status: "OPEN",
              sourceScanner: "PEN_TEST",
              detectedDate: "2026-06-08",
              slaDueDate: "2026-07-08",
              isFalsePositive: false,
              targetProduct: "Palmyra Platform",
              owner: "Thomas Lemaire"
            },
            {
              id: "VULN-DS-2026-002",
              title: "Plaintext Vault Token Exposure in Palmyra GitLab Runner Environment Variables",
              severity: "CRITICAL",
              status: "OPEN",
              sourceScanner: "VERACODE",
              detectedDate: "2026-06-09",
              slaDueDate: "2026-06-16",
              isFalsePositive: false,
              targetProduct: "Palmyra Platform",
              owner: "Thomas Lemaire"
            },
            {
              id: "VULN-DS-2026-003",
              title: "Remote Code Execution in Spring Boot framework dependency (Colline REST backend)",
              severity: "CRITICAL",
              status: "OPEN",
              sourceScanner: "VERACODE",
              detectedDate: "2026-06-05",
              slaDueDate: "2026-06-12",
              isFalsePositive: false,
              targetProduct: "Colline Integration",
              owner: "Thomas Lemaire"
            },
            {
              id: "VULN-DS-2026-004",
              title: "Unrestricted Port 5432 Ingress on Palmyra PostgreSQL Cluster",
              severity: "HIGH",
              status: "OPEN",
              sourceScanner: "NEXPOSE",
              detectedDate: "2026-06-07",
              slaDueDate: "2026-07-07",
              isFalsePositive: false,
              targetProduct: "Soliam Cloud Migration",
              owner: "Robert Martin"
            },
            {
              id: "VULN-DS-2026-005",
              title: "Cryptographic Weak Deserialization in Megara Token Broker API",
              severity: "HIGH",
              status: "OPEN",
              sourceScanner: "VERACODE",
              detectedDate: "2026-06-06",
              slaDueDate: "2026-07-06",
              isFalsePositive: false,
              targetProduct: "Megara Security Token Registry",
              owner: "Thomas Lemaire"
            }
          ];

          newVulns.forEach(v => {
            store.saveVulnerability(v);
          });

          addAuditTrail(
            "DEVOPS_SEC_DASHBOARD_SYNC",
            "SECURITY",
            "Successfully fetched and synchronized 5 primary DevOps vulnerabilities from devops-sec.vermeg.com portal gateway"
          );

          const nowStr = new Date().toISOString();
          localStorage.setItem("cr_tower_devopssec_last_sync", nowStr);
          setLastSyncedTime(nowStr);

          setIsSyncing(false);
          setSyncSuccess(true);
          setRefreshTrigger(prev => prev + 1);
        }
      }, (idx + 1) * 800);
    });
  };

  const handleImportDevOpsSecRaw = () => {
    try {
      const clean = devOpsSecRawText.trim();
      if (!clean) return;

      if (clean.startsWith("[") || clean.startsWith("{")) {
        const parsed = JSON.parse(clean);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        let importedCount = 0;
        list.forEach((v: any, index: number) => {
          if (v && (v.title || v.id)) {
            const vuln: Vulnerability = {
              id: v.id || `VULN-IMPORTED-${Date.now()}-${index}`,
              title: v.title || "Imported DevOps-Sec Finding",
              severity: (v.severity === "CRITICAL" || v.severity === "HIGH" || v.severity === "MEDIUM" || v.severity === "LOW") ? v.severity : "HIGH",
              status: "OPEN",
              sourceScanner: (v.sourceScanner === "VERACODE" || v.sourceScanner === "NEXPOSE" || v.sourceScanner === "PEN_TEST") ? v.sourceScanner : "PEN_TEST",
              detectedDate: v.detectedDate || new Date().toISOString().split("T")[0],
              slaDueDate: v.slaDueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0],
              isFalsePositive: false,
              targetProduct: v.targetProduct || "Palmyra Platform",
              owner: v.owner || "Thomas Lemaire"
            };
            store.saveVulnerability(vuln);
            importedCount++;
          }
        });

        addAuditTrail(
          "DEVOPS_SEC_MANUAL_IMPORT",
          "SECURITY",
          `Manually imported ${importedCount} vulnerabilities from raw file logs`
        );
        setDevOpsSecRawText("");
        setSyncSuccess(true);
        setRefreshTrigger(prev => prev + 1);
        setIsDevOpsSecOpen(false);
      } else {
        const lines = clean.split("\n");
        let importedCount = 0;
        lines.forEach((line, index) => {
          if (line.trim().length > 10) {
            let targetProduct = "Palmyra Platform";
            if (line.toLowerCase().includes("colline")) targetProduct = "Colline Integration";
            if (line.toLowerCase().includes("soliam")) targetProduct = "Soliam Cloud Migration";
            if (line.toLowerCase().includes("megara")) targetProduct = "Megara Security Token Registry";
            
            let severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "HIGH";
            if (line.toUpperCase().includes("CRITICAL")) severity = "CRITICAL";
            if (line.toUpperCase().includes("MEDIUM")) severity = "MEDIUM";
            if (line.toUpperCase().includes("LOW")) severity = "LOW";

            let scanner: "VERACODE" | "NEXPOSE" | "PEN_TEST" = "PEN_TEST";
            if (line.toUpperCase().includes("VERACODE") || line.toUpperCase().includes("SAST")) scanner = "VERACODE";
            if (line.toUpperCase().includes("NEXPOSE") || line.toUpperCase().includes("PORT")) scanner = "NEXPOSE";

            const vuln: Vulnerability = {
              id: `VULN-LOG-${Date.now()}-${index}`,
              title: line.substring(0, 100),
              severity: severity,
              status: "OPEN",
              sourceScanner: scanner,
              detectedDate: new Date().toISOString().split("T")[0],
              slaDueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0],
              isFalsePositive: false,
              targetProduct: targetProduct,
              owner: "Thomas Lemaire"
            };
            store.saveVulnerability(vuln);
            importedCount++;
          }
        });

        addAuditTrail(
          "DEVOPS_SEC_MANUAL_IMPORT",
          "SECURITY",
          `Manually parsed and filled ${importedCount} security log findings under appropriate topics`
        );
        setDevOpsSecRawText("");
        setSyncSuccess(true);
        setRefreshTrigger(prev => prev + 1);
        setIsDevOpsSecOpen(false);
      }
    } catch (e) {
      alert("Failed to parse logs. Check details and verify formatting.");
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase font-mono">
            Security & Vulnerability Governance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversee monthly Expert Vulnerability reviews, SLA breaches, false positive approvals, and exception mitigations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-2">
          {/* Last Synced Status Indicator & Manual Refresh Trigger */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 shadow-3xs">
            <span className={`h-2 w-2 rounded-full ${inlineSyncing ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`}></span>
            <span>Last Sync:</span>
            <span className="font-bold text-slate-800">
              {lastSyncedTime
                ? new Date(lastSyncedTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : "Never"
              }
            </span>
            <button
              onClick={handleInlineSync}
              disabled={inlineSyncing}
              title="Trigger Data Fetch from DevOps-Sec Portal"
              className={`p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50 cursor-pointer ${
                inlineSyncing ? "animate-spin text-amber-500" : ""
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {canPerformSecurityOps && (
            <>
              <button
                onClick={() => {
                  setExceptionVulnId(selectedVulnId || "");
                  setIsWaiverModalOpen(true);
                }}
                className="inline-flex items-center px-3.5 py-1.5 bg-slate-100 hover:bg-slate-250 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                CREATE WAIVER
              </button>
              <button
                onClick={() => {
                  setExceptionVulnId(selectedVulnId || "");
                  setIsRaModalOpen(true);
                }}
                className="inline-flex items-center px-3.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                SIGN RISK ACCEPTANCE
              </button>
              <button
                onClick={() => {
                  setIsDevOpsSecOpen(true);
                  setImportSuccessMsg(null);
                }}
                className="inline-flex items-center px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                INGEST SECURITY SCANS (EXCEL)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Segment Selectors */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl w-fit">
        <button
          onClick={() => setActiveSegment("VULNERABILITIES")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSegment === "VULNERABILITIES" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Vulnerability Risk Register ({rawVulns.length})
        </button>
        <button
          onClick={() => setActiveSegment("EXCEPTIONS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSegment === "EXCEPTIONS" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Waivers & Risk Acceptances ({rawWaivers.length + rawAccepts.length})
        </button>
        <button
          onClick={() => setActiveSegment("SLA_INCIDENTS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSegment === "SLA_INCIDENTS" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          SLA Breach Review ({rawSlaIncidents.length})
        </button>
        <button
          onClick={() => setActiveSegment("EXECUTIVE_COMMITTEE")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSegment === "EXECUTIVE_COMMITTEE" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🛡️ Palmyra Expert Committee Review
        </button>
      </div>

      {/* DevOps-Sec Multi-Perspective Display Mode Selector */}
      {activeSegment === "VULNERABILITIES" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-205 rounded-xl p-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
              PERSPECTIVE VIEW:
            </span>
            <div className="flex flex-wrap gap-1 p-0.5 bg-slate-200/60 rounded-lg">
              <button
                onClick={() => setVulnerabilitiesLayoutMode("LIST")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  vulnerabilitiesLayoutMode === "LIST"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-505 hover:text-slate-705"
                }`}
              >
                <LayoutGrid className="w-3 h-3 text-indigo-505" />
                <span>Vulnerability Register</span>
              </button>
              <button
                onClick={() => setVulnerabilitiesLayoutMode("PRODUCT")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  vulnerabilitiesLayoutMode === "PRODUCT"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-505 hover:text-slate-705"
                }`}
              >
                <Package className="w-3 h-3 text-amber-550" />
                <span>By Vermeg Product</span>
              </button>
              <button
                onClick={() => setVulnerabilitiesLayoutMode("PROJECT")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  vulnerabilitiesLayoutMode === "PROJECT"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-505 hover:text-slate-705"
                }`}
              >
                <Briefcase className="w-3 h-3 text-teal-605" />
                <span>By Live Project</span>
              </button>
              <button
                onClick={() => setVulnerabilitiesLayoutMode("VERSION")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  vulnerabilitiesLayoutMode === "VERSION"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-505 hover:text-slate-705"
                }`}
              >
                <GitBranch className="w-3 h-3 text-rose-500" />
                <span>By Release Version</span>
              </button>
              <button
                onClick={() => setVulnerabilitiesLayoutMode("HEATMAP")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  vulnerabilitiesLayoutMode === "HEATMAP"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-505 hover:text-slate-705"
                }`}
              >
                <Activity className="w-3 h-3 text-violet-500" />
                <span>Risk Heatmap</span>
              </button>
            </div>
          </div>
          <div className="text-[10px] text-slate-450 font-mono flex items-center space-x-1 bg-white border border-slate-150 px-2 py-1 rounded-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>devops-sec gateway active</span>
          </div>
        </div>
      )}

      {activeSegment === "VULNERABILITIES" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            {/* Standard Filter Header */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vulnerabilities, products or IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex space-x-2">
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
                <select
                  value={filterScanner}
                  onChange={(e) => setFilterScanner(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Scanners</option>
                  <option value="VERACODE">VERACODE SAST</option>
                  <option value="NEXPOSE">NEXPOSE INFRA</option>
                  <option value="PEN_TEST">EXTERNAL PEN-TEST</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All States</option>
                  <option value="OPEN">OPEN / TRUE POSITIVE</option>
                  <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
                  <option value="WAIVED">ACCEPTED / WAIVED</option>
                  <option value="REMEDIATED">REMEDIATED</option>
                </select>
              </div>
            </div>

            {/* View renders */}
            {vulnerabilitiesLayoutMode === "LIST" && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-start">
                <div className="p-3 bg-slate-50/55 border-b border-slate-150 text-[10px] font-mono font-bold text-slate-450 uppercase flex justify-between items-center">
                  <span>Standard Flat Risk Register ({filteredVulns.length} findings)</span>
                  <span className="text-[9px] bg-slate-200 px-1 py-0.5 rounded text-slate-550">Flat Table</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 animate-in fade-in duration-150">
                    <thead className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-slate-500 uppercase tracking-widest">
                      <tr>
                        <th className="p-3.5">ID / Deficient Exposure</th>
                        <th className="p-3.5 text-center">Severity</th>
                        <th className="p-3.5">Assigned Target</th>
                        <th className="p-3.5">Scanner Suite</th>
                        <th className="p-3.5 text-center">SLA Bound</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredVulns.map((v) => (
                        <tr
                          key={v.id}
                          onClick={() => setSelectedVulnId(v.id)}
                          className={`hover:bg-slate-50 cursor-pointer transition-all ${
                            selectedVulnId === v.id ? "bg-indigo-50/40 font-bold" : ""
                          }`}
                        >
                          <td className="p-3.5 max-w-[220px]">
                            <span className="text-[10px] font-bold font-mono text-slate-450 block">{v.id}</span>
                            <span className="text-slate-700 truncate block mt-0.5">{v.title}</span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full uppercase ${
                              v.severity === "CRITICAL"
                                ? "bg-rose-100 text-rose-800"
                                : v.severity === "HIGH"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-indigo-100 text-indigo-800"
                            }`}>
                              {v.severity}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-700">{v.targetProduct}</td>
                          <td className="p-3.5 text-slate-500 font-mono text-[10px]">{v.sourceScanner}</td>
                          <td className="p-3.5 text-center font-mono text-[10px] text-slate-600">{v.slaDueDate}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase ${
                              v.status === "REMEDIATED"
                                ? "bg-emerald-100 text-emerald-800"
                                : v.status === "FALSE_POSITIVE"
                                ? "bg-slate-100 text-slate-500"
                                : v.status === "WAIVED"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-rose-100 text-rose-800 animate-pulse"
                            }`}>
                              {v.status === "WAIVED" ? "ACCEPTED" : v.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredVulns.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold font-mono">
                            No vulnerabilities match active filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {vulnerabilitiesLayoutMode === "PRODUCT" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {VERMEG_PRODUCTS.map((prod) => {
                  const prodVulns = filteredVulns.filter((v) =>
                    v.targetProduct.toLowerCase().includes(prod.key.toLowerCase()) ||
                    (prod.key.includes("Palmyra") && v.targetProduct.toLowerCase().includes("palmyra"))
                  );
                  const openCount = prodVulns.filter((v) => v.status === "OPEN").length;
                  const critCount = prodVulns.filter((v) => v.status === "OPEN" && v.severity === "CRITICAL").length;
                  const highCount = prodVulns.filter((v) => v.status === "OPEN" && v.severity === "HIGH").length;

                  return (
                    <div key={prod.name} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2.5 border-b border-slate-100 gap-2">
                        <div className="flex items-start space-x-2.5">
                          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-0.5">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wide">
                              {prod.name}
                            </h4>
                            <p className="text-[11px] text-slate-500">{prod.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0 sm:self-start">
                          <span className="text-[10px] text-slate-400 font-mono">Lead: {prod.lead}</span>
                        </div>
                      </div>

                      {/* Info & Metrics Row */}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[9px] font-mono text-slate-450 uppercase block">Total Synced</span>
                          <span className="text-sm font-bold text-slate-755 font-mono">{prodVulns.length}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[9px] font-mono text-slate-450 uppercase block">Active Open</span>
                          <span className={`text-sm font-bold font-mono ${openCount > 0 ? "text-amber-650" : "text-emerald-605"}`}>
                            {openCount}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[9px] font-mono text-rose-455 uppercase block">Critical Risks</span>
                          <span className={`text-sm font-bold font-mono ${critCount > 0 ? "text-rose-600 animate-pulse" : "text-slate-400"}`}>
                            {critCount}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[9px] font-mono text-amber-500 uppercase block">High Severity</span>
                          <span className={`text-sm font-bold font-mono ${highCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                            {highCount}
                          </span>
                        </div>
                      </div>

                      {/* Vuln selection nested list */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider font-mono block">
                          Associated Portal Vulnerabilities
                        </span>
                        <div className="divide-y divide-slate-100 border border-slate-150 rounded-lg overflow-hidden bg-slate-50/50">
                          {prodVulns.map((v) => (
                            <div
                              key={v.id}
                              onClick={() => setSelectedVulnId(v.id)}
                              className={`p-2.5 flex items-center justify-between text-[11px] hover:bg-slate-100 cursor-pointer transition-all ${
                                selectedVulnId === v.id ? "bg-indigo-50 border-l-2 border-indigo-500" : ""
                              }`}
                            >
                              <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-mono text-[9px] font-bold text-slate-450">{v.id}</span>
                                  <span className="font-mono text-[9px] bg-slate-100 text-slate-550 px-1 rounded">
                                    {v.sourceScanner}
                                  </span>
                                </div>
                                <p className="text-slate-700 font-semibold truncate mt-0.5">{v.title}</p>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0">
                                <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded-full ${
                                  v.severity === "CRITICAL"
                                    ? "bg-rose-100 text-rose-800"
                                    : v.severity === "HIGH"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-indigo-100 text-indigo-805"
                                }`}>
                                  {v.severity}
                                </span>
                                <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded ${
                                  v.status === "REMEDIATED"
                                    ? "bg-emerald-100 text-emerald-805"
                                    : v.status === "FALSE_POSITIVE"
                                    ? "bg-slate-205 text-slate-500"
                                    : v.status === "WAIVED"
                                    ? "bg-indigo-105 text-indigo-805"
                                    : "bg-rose-100 text-rose-805"
                                }`}>
                                  {v.status === "WAIVED" ? "ACCEPTED" : v.status}
                                </span>
                              </div>
                            </div>
                          ))}
                          {prodVulns.length === 0 && (
                            <div className="py-6 text-center text-slate-450 text-[11px] font-mono">
                              No matching vulnerabilities found under this product.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {vulnerabilitiesLayoutMode === "PROJECT" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-start space-x-2.5 text-[11px] text-indigo-950 text-left">
                  <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">Continuous Delivery Security Gates</strong>
                    <p className="text-indigo-900 leading-relaxed">
                      Vermeg's security release policy mandates zero **CRITICAL** open security vulnerabilities prior to client production release. Active vulnerabilities below affect target project Go-Live decision workflows.
                    </p>
                  </div>
                </div>

                {rawProjects.map((proj) => {
                  const projVulns = filteredVulns.filter((v) => isVulnMappedToProject(v, proj));
                  const openCount = projVulns.filter((v) => v.status === "OPEN").length;
                  const openCritical = projVulns.filter((v) => v.status === "OPEN" && v.severity === "CRITICAL").length;
                  const openHigh = projVulns.filter((v) => v.status === "OPEN" && v.severity === "HIGH").length;

                  // Assess project gate
                  let gateColor = "text-emerald-700 bg-emerald-50 border-emerald-150";
                  let gateMsg = "PASSED";

                  if (proj.prodGoLiveReadinessState === "BLOCKED" || openCritical > 0) {
                    gateColor = "text-rose-800 bg-rose-50 border-rose-150 animate-pulse";
                    gateMsg = `CRITICAL BLOCKED`;
                  } else if (proj.prodGoLiveReadinessState === "RISKY" || openHigh > 0) {
                    gateColor = "text-amber-805 bg-amber-50 border-amber-205";
                    gateMsg = `HIGH RISK ASSURANCE`;
                  } else if (openCount > 0) {
                    gateColor = "text-indigo-805 bg-indigo-50 border-indigo-150";
                    gateMsg = `WARNING`;
                  }

                  return (
                    <div key={proj.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2.5 border-b border-slate-100 gap-2">
                        <div className="flex items-start space-x-2.5">
                          <div className="p-2 bg-teal-50 text-teal-605 rounded-lg shrink-0 mt-0.5">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wide">
                                {proj.name}
                              </h4>
                              <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                {proj.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-455 mt-0.5 leading-relaxed">
                              Manager: <strong>{proj.manager}</strong> • Automation: <strong>{proj.testAutomationRate}%</strong>
                            </p>
                          </div>
                        </div>

                        <div className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold text-center border shrink-0 sm:self-start ${gateColor}`}>
                          {gateMsg}
                        </div>
                      </div>

                      {/* Cost metrics and DevOps status bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-mono">CONSUMED BUDGET</span>
                            <span className="font-bold text-slate-700 font-mono">{proj.consumedBudget} kEUR / {proj.initialBudget} kEUR</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-mono">BUDGET RTD</span>
                            <span className={`font-bold font-mono ${proj.rtdDeviation > 10 ? "text-rose-500" : "text-emerald-600"}`}>
                              +{proj.rtdValue} kEUR (+{proj.rtdDeviation}%)
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 flex-1 max-w-[120px] bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${proj.status === "ON_TRACK" ? "bg-emerald-500" : proj.status === "DEVIATING" ? "bg-amber-500" : "bg-rose-500"}`}
                            style={{ width: `${Math.min(100, (proj.consumedBudget / proj.initialBudget) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Mapped vulnerability items */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider font-mono block">
                          Vulnerabilities Impacting Project Delivery ({projVulns.length})
                        </span>
                        <div className="divide-y divide-slate-100 border border-slate-150 rounded-lg overflow-hidden bg-slate-50/50">
                          {projVulns.map((v) => (
                            <div
                              key={v.id}
                              onClick={() => setSelectedVulnId(v.id)}
                              className={`p-2 flex items-center justify-between text-[11px] hover:bg-slate-100 cursor-pointer transition-all ${
                                selectedVulnId === v.id ? "bg-indigo-50 border-l-2 border-indigo-500" : ""
                              }`}
                            >
                              <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-mono text-[9px] font-bold text-slate-440">{v.id}</span>
                                  <span className="font-mono text-[9px] text-slate-450">Target Product: {v.targetProduct}</span>
                                </div>
                                <p className="text-slate-700 font-semibold truncate mt-0.5">{v.title}</p>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0">
                                <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded-full ${
                                  v.severity === "CRITICAL"
                                    ? "bg-rose-100 text-rose-800"
                                    : v.severity === "HIGH"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-indigo-100 text-indigo-805"
                                }`}>{v.severity}</span>
                                <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded ${
                                  v.status === "REMEDIATED"
                                    ? "bg-emerald-100 text-emerald-805"
                                    : v.status === "FALSE_POSITIVE"
                                    ? "bg-slate-205 text-slate-500"
                                    : v.status === "WAIVED"
                                    ? "bg-indigo-105 text-indigo-805"
                                    : "bg-rose-100 text-rose-805 animate-pulse"
                                }`}>{v.status === "WAIVED" ? "ACCEPTED" : v.status}</span>
                              </div>
                            </div>
                          ))}
                          {projVulns.length === 0 && (
                            <div className="py-4.5 text-center text-slate-455 text-[11px] font-mono">
                              🟢 All security gate checks succeeded. Project release approved for deployment.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {vulnerabilitiesLayoutMode === "VERSION" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3 flex items-start space-x-2.5 text-[11px] text-amber-955 text-left">
                  <GitBranch className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">Enterprise Version Core Security Releases Gating</strong>
                    <p className="text-amber-900 leading-relaxed">
                      Continuous DevOps audits and automatic pipeline checks map vulnerabilities to Vermeg strategic Roadmap product version upgrades. Release Gating statuses represent active security posture assessment.
                    </p>
                  </div>
                </div>

                {rawRoadmaps.map((rm) => {
                  const rmVulns = filteredVulns.filter((v) => isVulnMappedToRoadmap(v, rm));
                  const openCritical = rmVulns.filter((v) => v.status === "OPEN" && v.severity === "CRITICAL").length;
                  const openHigh = rmVulns.filter((v) => v.status === "OPEN" && v.severity === "HIGH").length;

                  // Assess version readiness
                  let gatingColor = "text-emerald-750 bg-emerald-50 border-emerald-150";
                  let gatingMsg = "🟢 ALL CLEAR — Security gates passed for v-release";

                  if (openCritical > 0) {
                    gatingColor = "text-rose-800 bg-rose-50 border-rose-150 animate-pulse";
                    gatingMsg = `🔴 GO-LIVE BLOCK — ${openCritical} Critical findings on release branch`;
                  } else if (openHigh > 0) {
                    gatingColor = "text-amber-800 bg-amber-50 border-amber-200";
                    gatingMsg = `🟡 CONDITIONAL — High findings require Waiver/RA approvals`;
                  }

                  return (
                    <div key={rm.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2.5 border-b border-slate-100 gap-2">
                        <div className="flex items-start space-x-2.5">
                          <div className="p-2 bg-pink-50 text-pink-600 rounded-lg shrink-0 mt-0.5">
                            <GitBranch className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wide">
                                {rm.name}
                              </h4>
                              <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded">
                                {rm.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-455 mt-0.5 leading-relaxed">
                              Upgrade Lead: <strong>{rm.leadOwner}</strong> • Class: <strong>{rm.type} Upgrade</strong> • Target Release: <strong>{rm.targetDate}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 sm:self-start">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                            rm.milestoneStatus === "ON_TIME" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800 animate-pulse"
                          }`}>
                            {rm.milestoneStatus}
                          </span>
                        </div>
                      </div>

                      {/* Milestone launch progress card */}
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between text-[11px] text-slate-550">
                          <span>Target milestones compilation progress:</span>
                          <span className="font-bold text-slate-700 font-mono">{rm.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600"
                            style={{ width: `${rm.progress}%` }}
                          />
                        </div>
                        <div className={`mt-2 border p-2 rounded text-[10px] font-semibold flex items-center space-x-2 ${gatingColor}`}>
                          <span>{gatingMsg}</span>
                        </div>
                      </div>

                      {/* Vuln selection nested roadmaps */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider font-mono block">
                          Release Posture findings ({rmVulns.length})
                        </span>
                        <div className="divide-y divide-slate-100 border border-slate-150 rounded-lg overflow-hidden bg-slate-50/50">
                          {rmVulns.map((v) => (
                            <div
                              key={v.id}
                              onClick={() => setSelectedVulnId(v.id)}
                              className={`p-2 flex items-center justify-between text-[11px] hover:bg-slate-100 cursor-pointer transition-all ${
                                selectedVulnId === v.id ? "bg-indigo-50 border-l-2 border-indigo-500" : ""
                              }`}
                            >
                              <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-mono text-[9px] font-bold text-slate-450">{v.id}</span>
                                  <span className="font-mono text-[9px] text-slate-450">Platform Target segment: {v.targetProduct}</span>
                                </div>
                                <p className="text-slate-700 font-semibold truncate mt-0.5">{v.title}</p>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0">
                                <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded-full ${
                                  v.severity === "CRITICAL"
                                    ? "bg-rose-100 text-rose-805"
                                    : v.severity === "HIGH"
                                    ? "bg-amber-100 text-amber-805"
                                    : "bg-indigo-100 text-indigo-805"
                                }`}>{v.severity}</span>
                                <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded ${
                                  v.status === "REMEDIATED"
                                    ? "bg-emerald-100 text-emerald-805"
                                    : v.status === "FALSE_POSITIVE"
                                    ? "bg-slate-205 text-slate-500"
                                    : v.status === "WAIVED"
                                    ? "bg-indigo-105 text-indigo-805"
                                    : "bg-rose-100 text-rose-805 animate-pulse"
                                }`}>{v.status === "WAIVED" ? "ACCEPTED" : v.status}</span>
                              </div>
                            </div>
                          ))}
                          {rmVulns.length === 0 && (
                            <div className="py-5 text-center text-slate-450 text-[11px] font-mono">
                              🟢 All security release gates cleared for this version.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {vulnerabilitiesLayoutMode === "HEATMAP" && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 text-left animate-in fade-in duration-150">
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 font-mono uppercase tracking-wide flex items-center space-x-2 animate-pulse">
                      <span className="p-1 px-1.5 bg-indigo-100 rounded text-indigo-700 text-xs font-bold font-mono">Interactive</span>
                      <span>DevSecOps Risk Profile Heatmap</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Continuous security posturing based on quantitative Likelihood (Probability) and Business Impact (Severity).
                    </p>
                  </div>
                  {/* Local Filters for Heatmap */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-slate-400 font-mono uppercase mb-0.5">Filter Product</label>
                      <select
                        value={heatmapProductFilter}
                        onChange={(e) => {
                          setHeatmapProductFilter(e.target.value);
                          setSelectedHeatmapCell(null);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-605 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">All Products</option>
                        {VERMEG_PRODUCTS.map((prod) => (
                          <option key={prod.name} value={prod.key}>
                            {prod.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-slate-400 font-mono uppercase mb-0.5">Filter Live Project</label>
                      <select
                        value={heatmapProjectFilter}
                        onChange={(e) => {
                          setHeatmapProjectFilter(e.target.value);
                          setSelectedHeatmapCell(null);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-605 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">All Projects</option>
                        {rawProjects.map((proj) => (
                          <option key={proj.id} value={proj.id}>
                            {proj.name} ({proj.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Simple Predictive Risk Projection Switch */}
                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-indigo-500 font-mono uppercase mb-0.5">Risk Projection</label>
                      <div className="flex items-center space-x-1.5 bg-indigo-50 border border-indigo-150 p-0.5 rounded-lg">
                        <button
                          onClick={() => {
                            setRiskProjectionEnabled(!riskProjectionEnabled);
                            setSelectedHeatmapCell(null);
                          }}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center space-x-1 cursor-pointer select-none ${
                            riskProjectionEnabled
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50"
                          }`}
                        >
                          <span>{riskProjectionEnabled ? "🔮 Active" : "🔮 Projected"}</span>
                        </button>
                        
                        {riskProjectionEnabled && (
                          <div className="flex items-center bg-white border border-indigo-100 rounded-md p-0.5 space-x-0.5">
                            {[30, 60, 90].map((days) => (
                              <button
                                key={days}
                                onClick={() => {
                                  setProjectionTimelineDays(days);
                                  setSelectedHeatmapCell(null);
                                }}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-black cursor-pointer transition-all ${
                                  projectionTimelineDays === days
                                    ? "bg-indigo-105 text-indigo-700"
                                    : "text-slate-405 hover:text-slate-705"
                                }`}
                              >
                                {days}d
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Historical velocity prediction stats block */}
                {riskProjectionEnabled && (
                  <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/70 border border-indigo-150 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-slate-705 animate-in slide-in-from-top-1.5 duration-200">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shrink-0 mt-0.5">
                        <Activity className="w-4 h-4 animate-pulse text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-800 font-mono uppercase tracking-wide text-[9px] bg-indigo-200 text-indigo-808 px-1.5 py-0.5 rounded">Predictive Simulation Engine</span>
                          <span className="text-[9px] bg-emerald-110 text-emerald-808 px-1.5 py-0.5 rounded font-bold font-mono">Remediation Velocity: {computedForecastStats.remediationVelocity.toFixed(2)}/day</span>
                          <span className="text-[9px] bg-rose-100 text-rose-808 px-1.5 py-0.5 rounded font-bold font-mono">Incoming Arrival: {computedForecastStats.arrivalVelocity.toFixed(2)}/day</span>
                        </div>
                        <p className="text-slate-605 mt-2 leading-relaxed text-[11px] max-w-2xl text-left">
                          Simulating backlog shifts over a <strong className="text-indigo-700">{projectionTimelineDays}-day</strong> window using historical register velocity. Backlog is predicted to <strong className={computedForecastStats.netRate > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>{computedForecastStats.netRate > 0 ? "expand" : "shrink"} by {Math.abs(Math.round(computedForecastStats.netRate * projectionTimelineDays))} exposures</strong> because discovery speed exceeds remediation rate.
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono bg-white border border-indigo-100 p-2.5 rounded-lg text-left md:text-right shrink-0 shadow-2xs self-stretch flex flex-col justify-center">
                      <div>Period: <span className="font-bold text-indigo-650">{projectionTimelineDays} Days Out</span></div>
                      <div>Projected New: <span className="font-bold text-rose-650">+{Math.round(projectionTimelineDays * computedForecastStats.arrivalVelocity)} items</span></div>
                      <div>Projected Solved: <span className="font-bold text-emerald-650">-{Math.round(projectionTimelineDays * computedForecastStats.remediationVelocity)} items</span></div>
                    </div>
                  </div>
                )}

                {/* Main Interactive Grid and Description */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
                  {/* Heatmap Visual Matrix (5x5) */}
                  <div className="md:col-span-12 lg:col-span-7 flex flex-col space-y-2 overflow-x-auto pb-4 lg:pb-0">
                    {/* Y-Axis (Impact) Labels with Grid */}
                    <div className="flex min-w-[500px]">
                      {/* Y-Axis Header Label Rotate */}
                      <div className="w-8 flex items-center justify-center relative">
                        <span className="transform -rotate-90 origin-center whitespace-nowrap absolute font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          BUSINESS IMPACT
                        </span>
                      </div>

                      {/* 5x5 Grid Area */}
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((impactScore) => {
                          const impactLabels: Record<number, string> = {
                            5: "5 - Critical",
                            4: "4 - Major",
                            3: "3 - Moderate",
                            2: "2 - Minor",
                            1: "1 - Negligible"
                          };

                          return (
                            <div key={impactScore} className="flex items-stretch space-x-1 h-12">
                              {/* Row Label (Y Axis values) */}
                              <div className="w-20 text-[9px] font-mono leading-none font-bold text-slate-450 flex items-center justify-end pr-2.5">
                                {impactLabels[impactScore]}
                              </div>

                              {/* Columns for this Row */}
                              {[1, 2, 3, 4, 5].map((probScore) => {
                                // Filter heatmap components based on mapping
                                const cellVulns = projectedVulnsList.filter((v) => {
                                  // Global active registers status/source etc filters
                                  const matchesQuery =
                                    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    v.targetProduct.toLowerCase().includes(searchQuery.toLowerCase());

                                  const matchesSeverity = filterSeverity === "ALL" || v.severity === filterSeverity;
                                  const matchesScanner = filterScanner === "ALL" || v.sourceScanner === filterScanner;
                                  const matchesStatus = filterStatus === "ALL" || v.status === filterStatus;

                                  if (!(matchesQuery && matchesSeverity && matchesScanner && matchesStatus)) {
                                    return false;
                                  }

                                  // local product list filters
                                  const matchesProduct = heatmapProductFilter === "ALL" || 
                                    v.targetProduct.toLowerCase().includes(heatmapProductFilter.toLowerCase()) ||
                                    (heatmapProductFilter.includes("Palmyra") && v.targetProduct.toLowerCase().includes("palmyra"));
                                  if (!matchesProduct) return false;

                                  // local project list filters
                                  if (heatmapProjectFilter !== "ALL") {
                                    const proj = rawProjects.find(p => p.id === heatmapProjectFilter);
                                    if (!proj || !isVulnMappedToProject(v, proj)) return false;
                                  }

                                  const metrics = getRiskMetrics(v);
                                  return metrics.probability === probScore && metrics.impact === impactScore;
                                });

                                const vCount = cellVulns.length;

                                // Determine Corporate Risk Grade colors
                                const riskProduct = probScore * impactScore;
                                let cellColor = "bg-emerald-55/70 border-emerald-150 text-emerald-700 hover:bg-emerald-100";
                                let levelText = "LOW";
                                if (riskProduct >= 15) {
                                  cellColor = "bg-rose-100 border-rose-250 text-rose-800 hover:bg-rose-150";
                                  levelText = "CRITICAL";
                                } else if (riskProduct >= 8) {
                                  cellColor = "bg-amber-100 border-amber-200 text-amber-808 hover:bg-amber-150";
                                  levelText = "HIGH";
                                } else if (riskProduct >= 4) {
                                  cellColor = "bg-yellow-55 border-yellow-200/80 text-yellow-750 hover:bg-yellow-100";
                                  levelText = "MEDIUM";
                                }

                                const isSelected = selectedHeatmapCell?.probability === probScore && selectedHeatmapCell?.impact === impactScore;

                                return (
                                  <button
                                    key={probScore}
                                    onClick={() => setSelectedHeatmapCell({ probability: probScore, impact: impactScore })}
                                    className={`flex-1 flex flex-col justify-between p-1.5 border rounded-lg text-left transition-all relative group cursor-pointer ${cellColor} ${
                                      isSelected 
                                        ? "ring-2 ring-indigo-500 shadow-sm border-indigo-500 z-10 scale-[1.02]" 
                                        : ""
                                    }`}
                                    title={`Impact: ${impactScore}, Probability: ${probScore} | ${vCount} findings`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <span className="text-[7.5px] font-mono font-bold tracking-tight opacity-55 uppercase">
                                        R{riskProduct} · {levelText}
                                      </span>
                                      {vCount > 0 && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-900/40 animate-pulse"></span>
                                      )}
                                    </div>
                                    <div className="flex items-baseline justify-between mt-auto">
                                      <span className="text-xs font-black font-mono tracking-tight leading-none font-bold">
                                        {vCount > 0 ? `${vCount}` : "—"}
                                      </span>
                                      <span className="text-[7.5px] opacity-0 group-hover:opacity-100 font-mono leading-none">
                                        View
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* X-Axis (Likelihood / Probability) Labels */}
                    <div className="flex pl-28 min-w-[500px]">
                      {[1, 2, 3, 4, 5].map((probVal) => {
                        const probLabels: Record<number, string> = {
                          1: "1 - Rare",
                          2: "2 - Unlikely",
                          3: "3 - Possible",
                          4: "4 - Likely",
                          5: "5 - Certain"
                        };
                        return (
                          <div key={probVal} className="flex-1 text-center pt-1.5 font-mono text-[8.5px] font-bold text-slate-450">
                            {probLabels[probVal]}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="text-center pt-2 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-28 min-w-[500px]">
                      PROBABILITY (LIKELIHOOD)
                    </div>
                  </div>

                  {/* Sidebar Detail Legend & Cell Explorer */}
                  <div className="md:col-span-12 lg:col-span-5 space-y-4">
                    {/* Risk Rating Key */}
                    <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-xs space-y-2.5">
                      <span className="text-[9px] font-bold font-mono text-slate-455 uppercase tracking-wider block">
                        Risk Level Matrix Guide
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="flex items-center space-x-2 bg-rose-50 border border-rose-150 p-1 rounded-md">
                          <span className="h-2.5 w-2.5 rounded bg-rose-100 border border-rose-300 shrink-0"></span>
                          <div>
                            <span className="font-bold text-rose-800 block">Critical Risk</span>
                            <span className="text-rose-500 font-mono text-[8px]">Score 15 - 25</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-150 p-1 rounded-md">
                          <span className="h-2.5 w-2.5 rounded bg-amber-100 border border-amber-250 shrink-0"></span>
                          <div>
                            <span className="font-bold text-amber-805 block">High Risk</span>
                            <span className="text-amber-500 font-mono text-[8px]">Score 8 - 12</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-150 p-1 rounded-md">
                          <span className="h-2.5 w-2.5 rounded bg-yellow-55 border border-yellow-250 shrink-0"></span>
                          <div>
                            <span className="font-bold text-yellow-800 block">Medium Risk</span>
                            <span className="text-yellow-500 font-mono text-[8px]">Score 4 - 6</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-155 p-1 rounded-md">
                          <span className="h-2.5 w-2.5 rounded bg-emerald-50/70 border border-emerald-150 shrink-0"></span>
                          <div>
                            <span className="font-bold text-emerald-800 block">Low Risk</span>
                            <span className="text-emerald-500 font-mono text-[8px]">Score 1 - 3</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Risk score is computed as <span className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">Impact × Probability</span>. High and Critical findings require proactive waivers, mitigating control signs, or committee arbitration reviews.
                      </p>
                    </div>

                    {/* Cell Vulnerability Detail Listing */}
                    <div className="bg-white border border-indigo-100 rounded-xl p-3.5 space-y-3 shadow-xs">
                      {selectedHeatmapCell ? (
                        <>
                          {(() => {
                            const { probability, impact } = selectedHeatmapCell;
                            
                            // Query exact list of cell vulns
                            const cellVulns = projectedVulnsList.filter((v) => {
                              // Global active statuses/source etc filters
                              const matchesQuery =
                                v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                v.targetProduct.toLowerCase().includes(searchQuery.toLowerCase());

                              const matchesSeverity = filterSeverity === "ALL" || v.severity === filterSeverity;
                              const matchesScanner = filterScanner === "ALL" || v.sourceScanner === filterScanner;
                              const matchesStatus = filterStatus === "ALL" || v.status === filterStatus;

                              if (!(matchesQuery && matchesSeverity && matchesScanner && matchesStatus)) {
                                return false;
                              }

                              // local product filters
                              const matchesProduct = heatmapProductFilter === "ALL" || 
                                v.targetProduct.toLowerCase().includes(heatmapProductFilter.toLowerCase()) ||
                                (heatmapProductFilter.includes("Palmyra") && v.targetProduct.toLowerCase().includes("palmyra"));
                              if (!matchesProduct) return false;

                              // local project filters
                              if (heatmapProjectFilter !== "ALL") {
                                const proj = rawProjects.find(p => p.id === heatmapProjectFilter);
                                if (!proj || !isVulnMappedToProject(v, proj)) return false;
                              }

                              const metrics = getRiskMetrics(v);
                              return metrics.probability === probability && metrics.impact === impact;
                            });

                            const impactNames: Record<number, string> = {
                              5: "Critical",
                              4: "Major",
                              3: "Moderate",
                              2: "Minor",
                              1: "Negligible"
                            };

                            const probNames: Record<number, string> = {
                              5: "Certain",
                              4: "Likely",
                              3: "Possible",
                              2: "Unlikely",
                              1: "Rare"
                            };

                            return (
                              <div className="space-y-2.5">
                                <div className="pb-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 p-1.5 rounded-lg border border-slate-100">
                                  <div>
                                    <span className="text-[9px] font-mono font-bold text-indigo-505 uppercase">
                                      CELL SPECIFIC FINDINGS
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-800">
                                      Imp: {impactNames[impact]} · Prob: {probNames[probability]}
                                    </h4>
                                  </div>
                                  <span className="px-2 py-0.5 bg-indigo-50 rounded-full font-mono text-[10px] font-bold text-indigo-600">
                                    Score: {probability * impact}
                                  </span>
                                </div>

                                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                                  {cellVulns.map((v) => (
                                    <div
                                      key={v.id}
                                      onClick={() => setSelectedVulnId(v.id)}
                                      className={`p-2.5 rounded-lg border text-left transition-all hover:bg-indigo-50/30 cursor-pointer ${
                                        selectedVulnId === v.id
                                          ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300 font-semibold"
                                          : "bg-slate-50 border-slate-150"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[9px] text-slate-450 font-mono">
                                        <div className="flex items-center space-x-1.5">
                                          <span>{v.id}</span>
                                          {v.isProjectedNew && (
                                            <span className="px-1 py-0.2 bg-violet-100 text-violet-750 font-sans font-bold text-[7.5px] uppercase tracking-tight rounded">
                                              NEW ARRIVAL
                                            </span>
                                          )}
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                          v.status === "REMEDIATED"
                                            ? "bg-emerald-100 text-emerald-805"
                                            : "bg-rose-100 text-rose-805 animate-pulse"
                                        }`}>
                                          {v.status === "WAIVED" ? "ACCEPTED" : v.status}
                                        </span>
                                      </div>
                                      <p className="text-[10px] font-bold text-slate-705 mt-1 line-clamp-2 leading-tight">
                                        {v.title}
                                      </p>
                                      {v.forecastLabel && (
                                        <div className="mt-1.5 p-1.5 bg-indigo-50/60 border border-indigo-100/80 rounded-md text-[8.5px] text-slate-650 leading-snug font-sans flex items-start space-x-1 text-left">
                                          <span className="text-indigo-505 leading-none shrink-0">🔮</span>
                                          <span className="italic">{v.forecastLabel}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between mt-2 text-[8px] text-slate-505 font-medium">
                                        <span className="truncate max-w-[110px]">Product: {v.targetProduct}</span>
                                        <span className="font-mono bg-white px-1 rounded border border-slate-204">
                                          {v.sourceScanner}
                                        </span>
                                      </div>
                                    </div>
                                  ))}

                                  {cellVulns.length === 0 && (
                                    <div className="py-10 text-center text-slate-400 text-xs font-semibold font-mono bg-slate-50/30 border border-dashed rounded-lg">
                                      No items mapped to this Risk Cell. Try adjusting filters or select another cell.
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="py-10 text-center text-slate-450 text-xs leading-relaxed space-y-2">
                          <Activity className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
                          <div>
                            <strong className="block font-semibold text-slate-700">Select a Cell to Explore</strong>
                            <p className="text-[9px] text-slate-450 max-w-[190px] mx-auto mt-0.5">
                              Click any reactive grid square in the 5x5 heatmap to view list of vulnerabilities mapped to that node.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Detail and Action card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-4 flex flex-col justify-between">
            {selectedVuln ? (
              <div className="space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{selectedVuln.id} • Detected {selectedVuln.detectedDate}</span>
                  <h3 className="text-sm font-bold text-slate-800 mt-1 leading-snug">{selectedVuln.title}</h3>
                  <p className="text-xs text-slate-450 mt-1">SLA Handler: {selectedVuln.owner}</p>
                </div>

                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">CORE TARGET PRODUCT</span>
                    <p className="font-semibold text-slate-705 mt-0.5">{selectedVuln.targetProduct}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">SCAN SOURCE DETECTOR</span>
                    <p className="font-semibold text-slate-705 mt-0.5">{selectedVuln.sourceScanner}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">SLA TRIGGER DUE DATE</span>
                    <p className="font-mono font-bold text-rose-650 mt-0.5 flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-rose-400" />
                      {selectedVuln.slaDueDate}
                    </p>
                  </div>
                </div>

                {selectedVuln.status === "FALSE_POSITIVE" && (
                  <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                    <span className="font-bold block text-slate-700">💡 False Positive Justification Log:</span>
                    <p className="mt-1 leading-snug italic">"{selectedVuln.explanationFalsePositive}"</p>
                  </div>
                )}

                {/* Operations */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                  {canPerformSecurityOps && selectedVuln.status === "OPEN" && (
                    <>
                      <button
                        onClick={() => setFpTriggerVulnId(selectedVuln.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded cursor-pointer transition-colors"
                      >
                        VALIDATE FALSE POSITIVE
                      </button>

                      <button
                        onClick={() => {
                          const updated = { ...selectedVuln, status: "REMEDIATED", remediatedDate: "2026-06-10" };
                          store.saveVulnerability(updated as any);
                          setSelectedVulnId(updated.id);
                          addAuditTrail(
                            "VULNERABILITY_REMEDIATED",
                            "SECURITY",
                            `Marked ${updated.id} as remediated.`
                          );
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded cursor-pointer transition-colors"
                      >
                        RESOLVE / DEPLOY PATCH
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 font-mono text-xs">
                Select a vulnerability from the register grid to view metrics.
              </div>
            )}
          </div>
        </div>
      )}

      {activeSegment === "EXCEPTIONS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Waivers list */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center pb-2 border-b border-slate-100">
              <Lock className="w-4 h-4 mr-2 text-indigo-505" />
              Active Information Security Waivers
            </h3>
            <div className="space-y-3.5">
              {rawWaivers.map((w) => (
                <div key={w.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs hover:border-indigo-400 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-indigo-600">{w.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                      w.status === "APPROVED" ? "bg-emerald-100 text-emerald-850" : "bg-amber-100 text-amber-850"
                    }`}>
                      {w.status}
                    </span>
                  </div>
                  <p className="font-bold text-slate-700 leading-snug">{w.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-mono">Assigned Vuln ID: {w.vulnerabilityId}</p>
                  <p className="text-slate-600 mt-2 italic leading-relaxed bg-white p-2 rounded border border-slate-100">
                    "{w.rationale}"
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-3.5 pt-2 border-t border-slate-100">
                    <span>Requested: {w.requestDate}</span>
                    <span className="font-bold text-rose-500">EXPIRES: {w.expiryDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Acceptances list */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center pb-2 border-b border-slate-100">
              <ShieldAlert className="w-4 h-4 mr-2 text-amber-505" />
              Active Signed Risk Acceptances
            </h3>
            <div className="space-y-3.5">
              {rawAccepts.map((ra) => (
                <div key={ra.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs hover:border-indigo-400 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-amber-600">{ra.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                      ra.status === "APPROVED" ? "bg-emerald-105 text-emerald-850" : ra.status === "REJECTED" ? "bg-rose-100 text-rose-850" : "bg-amber-105 text-amber-850"
                    }`}>
                      {ra.status}
                    </span>
                  </div>
                  <p className="font-bold text-slate-700 leading-snug">{ra.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-mono">Assigned Vuln ID: {ra.vulnerabilityId}</p>
                  <div className="mt-3.5 space-y-2 bg-white p-2.5 rounded border border-slate-150">
                    <p className="text-slate-600 leading-relaxed"><strong className="text-slate-700">Business Impact:</strong> {ra.businessImpact}</p>
                    <p className="text-slate-600 leading-relaxed"><strong className="text-slate-700">Mitigation:</strong> {ra.mitigationPlan}</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-3.5 pt-2 border-t border-slate-100">
                    <span>Requested: {ra.requestDate}</span>
                    <span className="font-bold text-slate-600">Review Expiry: {ra.expiryDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSegment === "SLA_INCIDENTS" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center">
              <AlertTriangle className="w-4.5 h-4.5 mr-2 text-rose-500 animate-pulse" />
              SLA Delivery Breach Review Records
            </h3>
            <p className="text-xs text-slate-450 mt-0.5">Chronological list of client platform service availability and latency contract metrics.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="p-3.5">ID / SLA Incident</th>
                  <th className="p-3.5">Client Project</th>
                  <th className="p-3.5">Assigned Target SLA Bound</th>
                  <th className="p-3.5">Actual Interruption</th>
                  <th className="p-3.5">Penalty Cost (EUR)</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rawSlaIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <span className="text-[10px] font-bold font-mono text-slate-400 block">{inc.id}</span>
                      <strong className="text-slate-700 block mt-0.5">{inc.title}</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Occurred: {inc.breachTime}</span>
                    </td>
                    <td className="p-3.5 text-slate-700">{inc.projectName}</td>
                    <td className="p-3.5 font-mono text-slate-500">{inc.maxAllowedResolutionHours} Hours Allowed</td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {inc.actualDurationHours ? `${inc.actualDurationHours} Hours` : "OPEN"}
                    </td>
                    <td className="p-3.5 text-slate-705 font-mono">
                      {inc.penaltyCost ? `${inc.penaltyCost.toLocaleString()} EUR` : "—"}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        inc.status === "BREACHED" ? "bg-rose-100 text-rose-800 animate-pulse" : inc.status === "RESOLVED" ? "bg-emerald-100 text-emerald-850" : "bg-amber-100 text-amber-850"
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSegment === "EXECUTIVE_COMMITTEE" && (
        <div className="space-y-6 text-left animate-in fade-in duration-200">
          {/* Header Dashboard Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <ShieldAlert className="w-48 h-48" />
            </div>
            <div className="relative z-10 max-w-3xl space-y-2">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-indigo-500/25 border border-indigo-400/20 rounded-full text-[11px] font-bold font-mono tracking-wider text-indigo-300">
                <span>🛡️ CONFIDENTIAL — PALMYRA PRODUCT GOVERNANCE</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight font-sans text-white">
                Palmyra Expert Vulnerability Committee Presentation Review
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Review of monthly vulnerability results, identified false positives, and remediation schedules presented by the Palmyra platform manager on <strong className="text-indigo-200 font-mono">June 8, 2026</strong>. Use this tab to audit validated exclusions, track out-of-SLA vendor libraries, and analyze version security gates.
              </p>
              <div className="pt-3 flex flex-wrap gap-4 text-[10px] font-mono text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Held: June 8, 2026</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Status: Audited & Approved by Committee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Panel KPI Dashboard Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-start space-x-3 text-left">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Out of SLA findings</span>
                <strong className="text-2xl font-bold font-mono text-slate-800 block mt-0.5">5</strong>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Vendor library findings in Camel and ActiveMQ requiring patch/mitigation.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-start space-x-3 text-left">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Validated False Positives</span>
                <strong className="text-2xl font-bold font-mono text-slate-800 block mt-0.5">5</strong>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Spring Boot & Jasper findings verified strictly non-exploitable on Palmyra.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-start space-x-3 text-left">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Active Version Releases</span>
                <strong className="text-2xl font-bold font-mono text-slate-800 block mt-0.5">4</strong>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Roadmap release branches gating (v24.1, v23.4, legacy v12, legacy v10.8).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
            {/* Left Column: Out of SLA Library Vulnerabilities Remediation Plan (Slide 1 & Slide 5) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-left space-y-4">
                <div className="border-b border-slate-150 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-850 font-mono uppercase tracking-wide flex items-center">
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-500 mr-2" />
                    Library Vulnerabilities Out of SLA (Overdue target dates)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Third-party dependencies detected via Veracode Software Composition Analysis (SCA).
                  </p>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-150 rounded-lg overflow-hidden bg-slate-50/50">
                  {rawVulns.filter(v => ["CVE-2026-40453", "CVE-2026-40860", "CVE-2026-47323", "CVE-2026-45505", "CVE-2026-42588"].includes(v.id)).map(v => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVulnId(v.id)}
                      className={`p-3 hover:bg-slate-100 transition-all cursor-pointer flex justify-between items-start gap-4 ${
                        selectedVulnId === v.id ? "bg-indigo-50/50 font-bold border-l-3 border-indigo-600" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold text-slate-600">{v.id}</span>
                          <span className={`px-1.5 py-0.2 text-[8px] font-bold font-mono rounded ${
                            v.severity === "CRITICAL" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {v.severity}
                          </span>
                        </div>
                        <p className="text-slate-800 text-[11px] font-semibold tracking-tight">{v.title}</p>
                        <div className="flex items-center space-x-1.5 text-[9px] font-mono text-slate-450 mt-1">
                          <span>Target: {v.targetProduct}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-rose-600 font-bold">Target Date: {v.slaDueDate} (Status: Overdue)</span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 font-mono text-[9px] font-bold bg-slate-200 text-slate-650 rounded">
                        {v.sourceScanner}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Remediation Action Plan Card */}
                <div className="bg-indigo-50/55 border border-indigo-150 rounded-xl p-4 space-y-3">
                  <h5 className="text-[11px] font-bold text-indigo-900 font-mono uppercase tracking-wider flex items-center">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mr-1.5" />
                    Committee-Approved Remediation and Upgrade Action Plan
                  </h5>
                  <div className="space-y-3.5 text-xs text-indigo-950 leading-relaxed">
                    <div className="relative pl-4.5 border-l border-indigo-200 space-y-1">
                      <div className="absolute left-[-4.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                      <strong className="block text-indigo-900 text-[11px] font-mono uppercase tracking-tight">
                        Action 1: Upgrade Apache Camel JMS (Target: June 15, 2026)
                      </strong>
                      <p className="text-[11px] text-indigo-900/90 font-sans">
                        Migrate Palmyra 24.1 dependencies to `camel-jms` 4.4.4. This handles unsafe deserialization on active JMS queues. High structural complexity; verified to only impact v24.1 branch code paths.
                      </p>
                    </div>

                    <div className="relative pl-4.5 border-l border-indigo-200 space-y-1">
                      <div className="absolute left-[-4.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                      <strong className="block text-indigo-900 text-[11px] font-mono uppercase tracking-tight">
                        Action 2: Remediate ActiveMQ broker endpoints (Target: June 17, 2026)
                      </strong>
                      <p className="text-[11px] text-indigo-900/90 font-sans">
                        Patch active brokers and restrict port ingress to trusted VPC subnets to insulate the OpenWire protocol parsing library. Upgrade planned to ActiveMQ 5.18.3.
                      </p>
                    </div>

                    <div className="relative pl-4.5 border-l border-transparent space-y-1">
                      <div className="absolute left-[-4.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
                      <strong className="block text-emerald-800 text-[11px] font-mono uppercase tracking-tight">
                        Security Mitigation Assurance Team
                      </strong>
                      <p className="text-[11px] text-indigo-950/85 font-sans">
                        Thomas Lemaire assigned as security gatekeeper. Build gates configured on Gitlab CI to block compilation if older vulnerabilities persist post-remediation window.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Validated False Positives & Explanations (Slide 3 & 4) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-left space-y-4">
                <div className="border-b border-slate-150 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-850 font-mono uppercase tracking-wide flex items-center">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-600 mr-2" />
                    Validated False Positives & Excluded Vulnerabilities
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    High severity findings verified inapplicable to Palmyra environment and formally approved by committee.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {rawVulns.filter(v => ["CVE-2026-40973", "CVE-2026-22747", "CVE-2026-22740", "CVE-2026-40975", "CVE-2026-6009"].includes(v.id)).map(v => (
                    <div key={v.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/40 hover:border-slate-300 transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold text-indigo-650">{v.id}</span>
                          <span className="px-1.5 py-0.2 font-mono text-[8px] bg-emerald-100 text-emerald-800 rounded font-semibold uppercase">
                            FALSE FP Approved
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-450 font-semibold uppercase">SCA Veracode</span>
                      </div>
                      <h5 className="text-[11px] font-bold text-slate-800 tracking-tight leading-tight">
                        {v.title}
                      </h5>
                      <div className="bg-white border border-slate-150 rounded-lg p-2.5 text-xs text-slate-600 leading-normal font-medium">
                        <strong className="block text-[10px] uppercase font-mono font-bold text-emerald-600 mb-1">
                          Validated Justification:
                        </strong>
                        <p className="text-[11px] leading-relaxed text-slate-605">{v.explanationFalsePositive}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Section: Release Version Security Posture Breakdown (Slide 6 & 7) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-left space-y-4">
            <div className="border-b border-slate-150 pb-2.5">
              <h4 className="text-xs font-bold text-slate-850 font-mono uppercase tracking-wide flex items-center">
                <GitBranch className="w-4.5 h-4.5 text-indigo-500 mr-2" />
                Historical Security Posture Breakdown by Palmyra Release Version
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Audit metrics compiled per product upgrade branch representing SCA library vulnerabilities, SAST custom-code findings, and SonarQube quality gates.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-2">
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 text-left">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                  <span className="font-mono text-xs font-bold text-slate-800">Palmyra v24.1</span>
                  <span className="bg-amber-100 text-amber-800 font-mono text-[8px] font-bold px-1.5 py-0.2 rounded">SLA BOUND</span>
                </div>
                <div className="space-y-1 text-[11px] font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Active SCA:</span>
                    <span className="font-bold font-mono text-rose-600">3 Crit, 2 High</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SAST Findings:</span>
                    <span className="font-bold font-mono text-emerald-600">0 Open</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SonarQube Gate:</span>
                    <span className="font-bold text-emerald-600">PASSED (93%)</span>
                  </div>
                </div>
                <div className="text-[9px] bg-amber-50 text-amber-800 font-semibold border border-amber-150 p-1.5 rounded leading-tight">
                  ⚠️ Conditional release. Remediations planned.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 text-left">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                  <span className="font-mono text-xs font-bold text-slate-800">Palmyra v23.4</span>
                  <span className="bg-emerald-100 text-emerald-800 font-mono text-[8px] font-bold px-1.5 py-0.2 rounded font-semibold">PASSED</span>
                </div>
                <div className="space-y-1 text-[11px] font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Active SCA:</span>
                    <span className="font-bold font-mono text-emerald-600">0 Open</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SAST Findings:</span>
                    <span className="font-bold font-mono text-emerald-600">0 Open</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SonarQube Gate:</span>
                    <span className="font-bold text-emerald-600">PASSED (89%)</span>
                  </div>
                </div>
                <div className="text-[9px] bg-emerald-50 text-emerald-805 font-semibold border border-emerald-150 p-1.5 rounded leading-tight">
                  🟢 Approved version branch. Safe for deployment.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 text-left">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                  <span className="font-mono text-xs font-bold text-slate-800">Palmyra v12.0 Legacy</span>
                  <span className="bg-emerald-100 text-emerald-800 font-mono text-[8px] font-bold px-1.5 py-0.2 rounded font-semibold font-sans">PASSED</span>
                </div>
                <div className="space-y-1 text-[11px] font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Active SCA:</span>
                    <span className="font-mono text-emerald-600 font-bold">0 Open</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SAST Findings:</span>
                    <span className="font-mono text-emerald-600 font-bold">0 Open</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SonarQube Gate:</span>
                    <span className="font-bold text-emerald-600">PASSED</span>
                  </div>
                </div>
                <div className="text-[9px] bg-slate-100 text-slate-500 p-1.5 border border-slate-200 rounded leading-tight">
                  🟢 Under legacy support. No vulnerabilities.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 text-left">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                  <span className="font-mono text-xs font-bold text-slate-800">Palmyra v10.8 Legacy</span>
                  <span className="bg-emerald-100 text-emerald-850 font-mono text-[8px] font-bold px-1.5 py-0.2 rounded font-semibold">PASSED</span>
                </div>
                <div className="space-y-1 text-[11px] font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Active SCA:</span>
                    <span className="font-mono text-emerald-600 font-bold">0 Open</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SAST Findings:</span>
                    <span className="font-mono text-emerald-600 font-bold">0 Open</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SonarQube Gate:</span>
                    <span className="font-bold text-emerald-600">PASSED</span>
                  </div>
                </div>
                <div className="text-[9px] bg-slate-100 text-slate-500 p-1.5 border border-slate-200 rounded leading-tight">
                  🟢 Under legacy support. No vulnerabilities.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RATIONALE VALIDATE FALSE POSITIVE POPUP */}
      {fpTriggerVulnId && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-100">
          <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-slate-800">
            <h4 className="text-sm font-bold text-slate-800 font-mono uppercase tracking-wider pb-1.5 border-b border-slate-100">
              FALSE POSITIVE RATIONALE
            </h4>
            <div className="space-y-3">
              <p className="text-xs text-slate-505 leading-relaxed">
                Provide secure justification for clearing vulnerability <strong>{fpTriggerVulnId}</strong> from active metrics. This creates a signed log entry inside the central audit.
              </p>
              <textarea
                rows={3}
                placeholder="Ex. Tested manually in staging environment. Endpoint is guarded on ingress layer via WAF regular-expression filters block..."
                value={fpRationaleInput}
                onChange={(e) => setFpRationaleInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-indigo-505 font-semibold text-slate-700"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setFpTriggerVulnId(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-semibold cursor-pointer"
              >
                CLOSE
              </button>
              <button
                onClick={() => handleToggleFalsePositive(fpTriggerVulnId)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer"
              >
                SAVE LOG CLEARANCE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WAIVER MODAL */}
      {isWaiverModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <h3 className="text-sm font-bold text-slate-800 font-mono uppercase tracking-widest pb-2 border-b border-slate-100">
              REQUEST SECURITY WAIVER EXEMPTION
            </h3>
            <form onSubmit={handleWaiverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Target Vulnerability ID</label>
                <select
                  value={exceptionVulnId}
                  onChange={(e) => setExceptionVulnId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">Select Vulnerability</option>
                  {rawVulns.filter((v) => v.status === "OPEN").map((v) => (
                    <option key={v.id} value={v.id}>{v.id} - {v.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Exemption Rationale</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Verify mainframe legacy constraints, firewall parameters, or software upgrade release targets..."
                  value={exceptionRationale}
                  onChange={(e) => setExceptionRationale(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Temporary Expiry Date</label>
                <input
                  type="date"
                  required
                  value={exceptionExpiry}
                  onChange={(e) => setExceptionExpiry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWaiverModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-semibold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer shadow-sm"
                >
                  APPROVE WAIVER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RISK ACCEPTANCE MODAL */}
      {isRaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <h3 className="text-sm font-bold text-slate-800 font-mono uppercase tracking-widest pb-2 border-b border-slate-100">
              SIGN FORMAL RISK ACCEPTANCE (RA)
            </h3>
            <form onSubmit={handleRaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Target Vulnerability ID</label>
                <select
                  value={exceptionVulnId}
                  onChange={(e) => setExceptionVulnId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">Select Vulnerability</option>
                  {rawVulns.filter((v) => v.status === "OPEN").map((v) => (
                    <option key={v.id} value={v.id}>{v.id} - {v.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Declared Business Impact If Attacked</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Total database exfiltration, credentials compromise, client platform blackout impact..."
                  value={exceptionImpact}
                  onChange={(e) => setExceptionImpact(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-705 font-semibold focus:outline-none focus:border-indigo-550"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Compensating Controls / Mitigation Plan</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Web application firewall blocks, continuous manual configuration checks, container segregation specs..."
                  value={exceptionMitigation}
                  onChange={(e) => setExceptionMitigation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-705 font-semibold focus:outline-none focus:border-indigo-550"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Annual Review Re-evaluation Date</label>
                <input
                  type="date"
                  required
                  value={exceptionExpiry}
                  onChange={(e) => setExceptionExpiry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-705 font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRaModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-semibold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer shadow-sm"
                >
                  SIGN RA AGREEMENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLIANCE SCAN SPREADSHEET PORTAL */}
      {isDevOpsSecOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-7xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            
            {/* MODAL HEADER BLOCK */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <Upload className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-100 tracking-tight flex items-center space-x-2">
                    <span>Vulnerability Scan Ingestion Portal</span>
                    <span className="text-[10px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded font-mono">
                      Excel / CSV Engine Active
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans leading-none">
                    Map scanning deliverables from Sonar, Fortify, and Nexus-IQ (Sonatype) into the Compliance Tower register.
                  </p>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsDevOpsSecOpen(false);
                  setImportSuccessMsg(null);
                }}
                className="text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Portal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* SPREADSHEET TOOLBAR & UPLOADER SCREEN */}
            <div className="bg-slate-900/65 border-b border-slate-800 px-6 py-4 shrink-0 space-y-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                
                {/* 1. Drag & Drop File Input */}
                <div className="flex-1">
                  <label className="relative group flex items-center justify-center border border-dashed border-slate-750 hover:border-emerald-500/60 bg-slate-950/40 rounded-xl p-3.5 text-center cursor-pointer transition-all duration-200">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          try {
                            const data = evt.target?.result;
                            if (!data) return;
                            const workbook = XLSX.read(data, { type: "binary" });
                            const firstSheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[firstSheetName];
                            const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                            if (rawRows.length < 2) {
                              alert("Upload Error: Sheet must contain headers and at least one data row.");
                              return;
                            }

                            const parsedRows: SecurityScanRow[] = [];
                            let dataStartIdx = 1;
                            
                            // Check first 2 rows for sub-headers
                            if (rawRows[1] && rawRows[1].some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('critical') || cell.toLowerCase().includes('high')))) {
                              dataStartIdx = 2; // dual-level headers
                            }

                            for (let i = dataStartIdx; i < rawRows.length; i++) {
                              const row = rawRows[i];
                              if (!row || row.length === 0 || !row[0]) continue;

                              parsedRows.push({
                                id: `sc-uploaded-${Date.now()}-${i}`,
                                product: String(row[0] || "").trim(),
                                scanType: String(row[1] || "").trim(),
                                sonarCritical: Number(row[2]) || 0,
                                sonarHigh: Number(row[3]) || 0,
                                fortifyCritical: Number(row[4]) || 0,
                                fortifyHigh: Number(row[5]) || 0,
                                sonatypeCritical: Number(row[6]) || 0,
                                sonatypeHigh: Number(row[7]) || 0,
                                date: String(row[8] || "").trim() || new Date().toISOString().split("T")[0],
                                comment: String(row[9] || "").trim(),
                                ingested: false
                              });
                            }

                            if (parsedRows.length > 0) {
                              saveExcelRows(parsedRows);
                              setImportSuccessMsg(`Successfully imported ${parsedRows.length} scan records from uploaded file: '${file.name}'`);
                            } else {
                              alert("No records parsed. Please match the template column structure.");
                            }
                          } catch (err: any) {
                            alert("Parsing failed: verify sheet layout is valid.");
                          }
                        };
                        reader.readAsBinaryString(file);
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-3 text-slate-300">
                      <Layers className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-200 block">Drag & drop your Excel template here or click to browse</span>
                        <span className="text-[10px] text-slate-500 font-mono">Supports Excel workbook (.xlsx, .xls) and localized CSV sheets</span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* 2. Control actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleAddExcelRow}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Insert New Row</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      saveExcelRows(INITIAL_EXCEL_SCANS);
                      setSelectedExcelRowIds(new Set());
                      setImportSuccessMsg("Spreadsheet successfully restored to the original screenshot demo data!");
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                    title="Reload Screenshot Scans"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Reload Screenshot Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Clear all rows in current spreadsheet?")) {
                        saveExcelRows([]);
                        setSelectedExcelRowIds(new Set());
                        setImportSuccessMsg("Spreadsheet cleared completely.");
                      }
                    }}
                    className="px-3 py-2 bg-slate-900/50 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold transition-all border border-slate-800 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Clear Sheet</span>
                  </button>
                </div>

              </div>
            </div>

            {/* ERROR / SUCCESS ALERTS */}
            {importSuccessMsg && (
              <div className="bg-emerald-950/30 border-y border-emerald-900/60 px-6 py-3.5 flex items-start space-x-3 text-emerald-250 animate-in fade-in duration-300 shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs font-bold text-emerald-300 block">Spreadsheet Ingestion Status Summary</span>
                  <span className="text-[11px] text-emerald-400/90 leading-relaxed block mt-0.5">
                    {importSuccessMsg}
                  </span>
                </div>
                <button
                  onClick={() => setImportSuccessMsg(null)}
                  className="text-emerald-500 hover:text-emerald-300 text-xs font-bold uppercase select-none cursor-pointer"
                >
                  X Dismiss
                </button>
              </div>
            )}

            {/* SPREADSHEET TABLECONTAINER */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950 select-none">
              {excelRows.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-800 rounded-2xl m-4 bg-slate-900/10">
                  <Layers className="w-10 h-10 text-slate-650 mb-3" />
                  <h3 className="text-sm font-bold text-slate-350">Spreadsheet is currently empty</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mt-1">
                    Upload an Excel file matching the template, or click <strong className="text-indigo-400">'Reload Screenshot Data'</strong> to automatically pre-populate rows from the verified security scan printscreen.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse table-fixed select-none" style={{ minWidth: "1200px" }}>
                    
                    {/* THE SPREADSHEET CATEGORIZED HEADER ROWS */}
                    <thead>
                      {/* LEVEL 1 HEADERS */}
                      <tr className="bg-slate-900/95 text-slate-200 border-b border-slate-750 text-xs font-bold select-none font-mono tracking-tight text-center">
                        <th className="p-2 w-[48px] border-r border-slate-750">
                          <input
                            type="checkbox"
                            checked={excelRows.length > 0 && selectedExcelRowIds.size === excelRows.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExcelRowIds(new Set(excelRows.map(r => r.id)));
                              } else {
                                setSelectedExcelRowIds(new Set());
                              }
                            }}
                            className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </th>
                        <th className="p-3 text-left w-[290px] border-r border-slate-750">Product</th>
                        <th className="p-3 text-center w-[150px] border-r border-slate-750">Last / Previous Scan</th>
                        <th colSpan={2} className="p-2 bg-slate-850/60 border-r border-slate-750 text-slate-300 font-bold uppercase tracking-wider text-[11px]">Sonar</th>
                        <th colSpan={2} className="p-2 bg-slate-850/40 border-r border-slate-750 text-slate-300 font-bold uppercase tracking-wider text-[11px]">Fortify / Veracode</th>
                        <th colSpan={2} className="p-2 bg-slate-800/25 border-r border-slate-750 text-slate-300 font-bold uppercase tracking-wider text-[11px]">Nexus-IQ (Sonatype)</th>
                        <th className="p-3 text-center w-[115px] border-r border-slate-750">Date</th>
                        <th className="p-3 text-left w-[180px] border-r border-slate-750 text-[11px]">Comment</th>
                        <th className="p-3 text-center w-[120px]">Actions</th>
                      </tr>

                      {/* LEVEL 2 HEADERS (SUB COLUMNS CRITICAL / HIGH) */}
                      <tr className="bg-slate-850/30 text-slate-400 border-b border-slate-800 text-[10px] font-bold select-none font-mono uppercase tracking-wider text-center">
                        <th className="p-1 border-r border-slate-805 bg-slate-900/40"></th>
                        <th className="p-1 text-left border-r border-slate-805 font-sans lowercase italic text-slate-500 font-normal px-3">product names mapped inside cell parameters</th>
                        <th className="p-1 border-r border-slate-805"></th>
                        
                        {/* Sonar */}
                        <th className="p-1 w-[75px] border-r border-slate-805 bg-slate-900/60 text-slate-350">Critical</th>
                        <th className="p-1 w-[75px] border-r border-slate-750 bg-slate-900/60 text-slate-350">High</th>
                        
                        {/* Fortify */}
                        <th className="p-1 w-[75px] border-r border-slate-805 bg-slate-900/40 text-slate-350">Critical</th>
                        <th className="p-1 w-[75px] border-r border-slate-750 bg-slate-900/40 text-slate-350">High</th>
                        
                        {/* Sonatype */}
                        <th className="p-1 w-[75px] border-r border-slate-805 bg-slate-900/20 text-slate-350">Critical</th>
                        <th className="p-1 w-[75px] border-r border-slate-750 bg-slate-900/20 text-slate-350">High</th>
                        
                        <th className="p-1 border-r border-slate-805"></th>
                        <th className="p-1 text-left border-r border-slate-805 px-3"></th>
                        <th className="p-1 bg-slate-900/10">Publish States</th>
                      </tr>
                    </thead>
                    
                    {/* SPREADSHEET DATA BODY */}
                    <tbody className="divide-y divide-slate-850 select-none">
                      {excelRows.map((row) => {
                        const isChecked = selectedExcelRowIds.has(row.id);
                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors duration-150 group/row select-none hover:bg-slate-900/30 font-sans text-xs ${
                              isChecked ? "bg-emerald-950/15" : "even:bg-slate-900/10 odd:bg-slate-950"
                            }`}
                          >
                            {/* Checkbox selector */}
                            <td className="p-2 border-r border-slate-850 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const nextSet = new Set(selectedExcelRowIds);
                                  if (nextSet.has(row.id)) nextSet.delete(row.id);
                                  else nextSet.add(row.id);
                                  setSelectedExcelRowIds(nextSet);
                                }}
                                className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                              />
                            </td>

                            {/* Product Title Cell */}
                            <td className="p-2 border-r border-slate-850">
                              <input
                                type="text"
                                value={row.product}
                                onChange={(e) => handleEditCell(row.id, "product", e.target.value)}
                                className="w-full bg-transparent hover:bg-slate-800/45 focus:bg-slate-900 border-0 focus:ring-1 focus:ring-emerald-500 rounded px-2 py-1 text-slate-100 font-sans tracking-tight text-[11px] truncate"
                              />
                            </td>

                            {/* Scan Type / Label Cell */}
                            <td className="p-2 border-r border-slate-850 text-center">
                              <input
                                type="text"
                                value={row.scanType}
                                onChange={(e) => handleEditCell(row.id, "scanType", e.target.value)}
                                className="w-full bg-transparent hover:bg-slate-800/45 focus:bg-slate-900 border-0 focus:ring-0 rounded px-1.5 py-1 text-center text-[11px] text-slate-350 font-mono"
                              />
                            </td>

                            {/* SONAR CRITICAL COUNT */}
                            <td className="p-2 border-r border-slate-805 bg-slate-900/10 text-center font-mono">
                              <input
                                type="number"
                                min={0}
                                value={row.sonarCritical}
                                onChange={(e) => handleEditCell(row.id, "sonarCritical", Math.max(0, parseInt(e.target.value) || 0))}
                                className={`w-14 bg-transparent text-center border-0 focus:ring-0 rounded p-1 text-[11px] ${
                                  row.sonarCritical > 0 ? "text-rose-400 font-bold" : "text-slate-500"
                                }`}
                              />
                            </td>

                            {/* SONAR HIGH COUNT */}
                            <td className="p-2 border-r border-slate-850 bg-slate-900/10 text-center font-mono">
                              <input
                                type="number"
                                min={0}
                                value={row.sonarHigh}
                                onChange={(e) => handleEditCell(row.id, "sonarHigh", Math.max(0, parseInt(e.target.value) || 0))}
                                className={`w-14 bg-transparent text-center border-0 focus:ring-0 rounded p-1 text-[11px] ${
                                  row.sonarHigh > 0 ? "text-amber-400 font-bold" : "text-slate-500"
                                }`}
                              />
                            </td>

                            {/* FORTIFY CRITICAL COUNT */}
                            <td className="p-2 border-r border-slate-805 bg-slate-900/5 text-center font-mono">
                              <input
                                type="number"
                                min={0}
                                value={row.fortifyCritical}
                                onChange={(e) => handleEditCell(row.id, "fortifyCritical", Math.max(0, parseInt(e.target.value) || 0))}
                                className={`w-14 bg-transparent text-center border-0 focus:ring-0 rounded p-1 text-[11px] ${
                                  row.fortifyCritical > 0 ? "text-rose-450 font-bold" : "text-slate-500"
                                }`}
                              />
                            </td>

                            {/* FORTIFY HIGH COUNT */}
                            <td className="p-2 border-r border-slate-850 bg-slate-900/5 text-center font-mono">
                              <input
                                type="number"
                                min={0}
                                value={row.fortifyHigh}
                                onChange={(e) => handleEditCell(row.id, "fortifyHigh", Math.max(0, parseInt(e.target.value) || 0))}
                                className={`w-14 bg-transparent text-center border-0 focus:ring-0 rounded p-1 text-[11px] ${
                                  row.fortifyHigh > 0 ? "text-amber-400 font-bold" : "text-slate-500"
                                }`}
                              />
                            </td>

                            {/* SONATYPE (NEXUS-IQ) CRITICAL COUNT -- ENFORCES SCREENSHOT COLORS */}
                            <td className="p-2 border-r border-slate-805 text-center font-mono">
                              <input
                                type="number"
                                min={0}
                                value={row.sonatypeCritical}
                                onChange={(e) => handleEditCell(row.id, "sonatypeCritical", Math.max(0, parseInt(e.target.value) || 0))}
                                className={`w-14 bg-transparent text-center border-0 focus:ring-0 rounded p-1 text-[11px] ${
                                  row.sonatypeCritical > 0 ? "text-[rgb(34,197,94)] font-bold bg-[#10b981]/10 rounded px-1" : "text-slate-550"
                                }`}
                              />
                            </td>

                            {/* SONATYPE (NEXUS-IQ) HIGH COUNT -- ENFORCES SCREENSHOT COLORS */}
                            <td className="p-2 border-r border-slate-850 text-center font-mono">
                              <input
                                type="number"
                                min={0}
                                value={row.sonatypeHigh}
                                onChange={(e) => handleEditCell(row.id, "sonatypeHigh", Math.max(0, parseInt(e.target.value) || 0))}
                                className={`w-14 bg-transparent text-center border-0 focus:ring-0 rounded p-1 text-[11px] ${
                                  row.sonatypeHigh > 0 ? "text-[rgb(239,68,68)] font-bold bg-[#ef4444]/10 rounded px-1" : "text-slate-550"
                                }`}
                              />
                            </td>

                            {/* Scan Date Cell */}
                            <td className="p-2 border-r border-slate-850 text-center">
                              <input
                                type="text"
                                value={row.date}
                                onChange={(e) => handleEditCell(row.id, "date", e.target.value)}
                                className="w-full bg-transparent hover:bg-slate-800/45 focus:bg-slate-900 border-0 focus:ring-0 rounded px-1.5 py-1 text-center font-mono text-[11px] text-slate-300"
                              />
                            </td>

                            {/* Comments Cell */}
                            <td className="p-2 border-r border-slate-850">
                              <input
                                type="text"
                                placeholder="..."
                                value={row.comment}
                                onChange={(e) => handleEditCell(row.id, "comment", e.target.value)}
                                className="w-full bg-transparent hover:bg-slate-800/45 focus:bg-slate-900 border-0 focus:ring-0 rounded px-2 py-1 text-slate-350 text-[11px] italic font-sans"
                              />
                            </td>

                            {/* Row specific Actions / Ingestion Status indicator */}
                            <td className="p-2 text-center flex items-center justify-center space-x-2">
                              {row.ingested ? (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-900/50 text-[9px] text-emerald-400 font-bold font-mono">
                                  <Check className="w-2.5 h-2.5 shrink-0" />
                                  <span>INGESTED</span>
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-450 font-bold font-mono uppercase tracking-wide">
                                  PENDING
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteExcelRow(row.id)}
                                className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                                title="Delete row"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SPREADSHEET FOOTER METRIC CONTROLS */}
            <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shrink-0 select-none">
              
              {/* Row counts status */}
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span className="font-mono">
                  Rows total: <strong className="text-slate-200">{excelRows.length}</strong>
                </span>
                <span className="text-slate-700">•</span>
                <span className="font-mono text-emerald-400">
                  Selected counts: <strong className="text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{selectedExcelRowIds.size} Selected</strong>
                </span>
                <span className="text-slate-700">•</span>
                <span className="text-[10px] text-slate-500 italic block">
                  Double-click any cell to directly edit product, counts, or comments
                </span>
              </div>

              {/* Major Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsDevOpsSecOpen(false);
                    setImportSuccessMsg(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-705 text-slate-350 hover:text-slate-100 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-slate-750"
                >
                  Close Hub
                </button>

                <button
                  type="button"
                  disabled={selectedExcelRowIds.size === 0}
                  onClick={handleIngestExcelScans}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-lg ${
                    selectedExcelRowIds.size === 0
                      ? "bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed"
                      : "bg-emerald-650 hover:bg-emerald-700 text-white shadow-emerald-950/20 hover:scale-[1.02] active:scale-98"
                  }`}
                >
                  <Database className="w-4 h-4 shrink-0" />
                  <span>PUBLISH {selectedExcelRowIds.size} SELECTED SCANS TO REGISTER</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
