/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Settings,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Eye,
  Info,
  Calendar,
  Lock,
  User,
  Layers,
  ArrowRight,
  Sparkles,
  Server,
  Activity,
  History,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  Grid
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { ExecutiveKpis, ProductKpis, NexusWaiver, NexusVulnerability, NexusSyncLog } from "../nexusTypes";

export default function NexusWorkspace() {
  const [activeTab, setActiveTab] = useState<"EXECUTIVE" | "PRODUCTS" | "VULNERABILITIES" | "WAIVERS" | "DEBT" | "SETTINGS">("EXECUTIVE");
  const [execKpis, setExecKpis] = useState<ExecutiveKpis | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("megara");
  const [productKpis, setProductKpis] = useState<ProductKpis | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<NexusVulnerability[]>([]);
  const [waivers, setWaivers] = useState<NexusWaiver[]>([]);
  const [syncLogs, setSyncLogs] = useState<NexusSyncLog[]>([]);
  
  // Filtering states for vulnerabilites
  const [vulnSearch, setVulnSearch] = useState("");
  const [vulnSeverity, setVulnSeverity] = useState("");
  const [vulnStatus, setVulnStatus] = useState("");
  const [selectedVuln, setSelectedVuln] = useState<NexusVulnerability | null>(null);

  // Sync execution status parameters
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncFeedback, setSyncFeedback] = useState<string>("");

  // Connection settings states
  const [configUrl, setConfigUrl] = useState("https://soft-security:8070/");
  const [configUser, setConfigUser] = useState("ftekitek");
  const [configToken, setConfigToken] = useState("");
  const [configTimeout, setConfigTimeout] = useState(5000);
  const [configRetries, setConfigRetries] = useState(3);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Connection probe checker
  const [probeResult, setProbeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingProbe, setTestingProbe] = useState(false);

  // Interactive Waiver Request Builder modal
  const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);
  const [waiverTargetVuln, setWaiverTargetVuln] = useState<NexusVulnerability | null>(null);
  const [waiverReason, setWaiverReason] = useState("");
  const [waiverApprover, setWaiverApprover] = useState("Fayez Tekitek (DevSecOps Manager)");
  const [waiverRequester, setWaiverRequester] = useState("Hassen Ben Ali (Tech Lead)");
  const [waiverExpiration, setWaiverExpiration] = useState("");
  const [waiverComment, setWaiverComment] = useState("");
  const [waiverSubmitSuccess, setWaiverSubmitSuccess] = useState(false);

  // Data fetching initializer
  const fetchAllData = async () => {
    try {
      // Get Executive KPIs
      const resKpis = await fetch("/api/nexus/kpis/executive");
      if (resKpis.ok) {
        const data = await resKpis.json();
        setExecKpis(data);
      }

      // Get vulnerabilities
      const resVulns = await fetch("/api/nexus/vulnerabilities");
      if (resVulns.ok) {
        const data = await resVulns.json();
        setVulnerabilities(data);
      }

      // Get waivers
      const resWaivers = await fetch("/api/nexus/waivers");
      if (resWaivers.ok) {
        const data = await resWaivers.json();
        setWaivers(data);
      }

      // Get recent sync logs
      const resLogs = await fetch("/api/nexus/sync/logs");
      if (resLogs.ok) {
        const data = await resLogs.json();
        setSyncLogs(data);
      }

      // Get active configuration parameters
      const resConf = await fetch("/api/nexus/config");
      if (resConf.ok) {
        const data = await resConf.json();
        setConfigUrl(data.url);
        setConfigUser(data.username);
        setConfigTimeout(data.timeoutMs);
        setConfigRetries(data.maxRetries);
      }
    } catch (err) {
      console.error("Error communicating with fullstack server:", err);
    }
  };

  const fetchProductKpis = async (pid: string) => {
    try {
      const res = await fetch(`/api/nexus/kpis/product/${pid}`);
      if (res.ok) {
        const data = await res.json();
        setProductKpis(data);
      }
    } catch (err) {
      console.error(`Error loading KPIs for product ${pid}:`, err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchProductKpis(selectedProductId);
    }
  }, [selectedProductId]);

  // Save Settings Connection Config handler
  const saveConnectionSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);
    try {
      const res = await fetch("/api/nexus/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: configUrl,
          username: configUser,
          token: configToken,
          timeoutMs: configTimeout,
          maxRetries: configRetries
        })
      });
      if (res.ok) {
        setSaveStatus("Success: Workspace connection profile parameters updated.");
        setTimeout(() => setSaveStatus(null), 3000);
        fetchAllData();
      } else {
        setSaveStatus("Error: Unable to register credential profile configurations.");
      }
    } catch (err) {
      setSaveStatus("Error: Connection timeout reaching endpoint.");
    }
  };

  // Connection probe checker
  const handleProbeConnection = async () => {
    setTestingProbe(true);
    setProbeResult(null);
    try {
      // Simulate connection testing run via config API
      const res = await fetch("/api/nexus/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setProbeResult({ success: true, message: `Active link established to gateway: ${data.summary}` });
      } else {
        setProbeResult({ success: false, message: `Access failure: ${data.error}` });
      }
    } catch (err: any) {
      setProbeResult({ success: false, message: "Host unreachable. Verify endpoint routing or proxy headers." });
    } finally {
      setTestingProbe(false);
      fetchAllData();
    }
  };

  // Automated synchronizer launcher
  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(15);
    setSyncFeedback("Authenticating user session on soft-security gateway...");

    // Smooth interface simulator syncing steps
    const steps = [
      { p: 35, text: "Contacting organizations repository at /api/v2/organizations..." },
      { p: 55, text: "Scanning application logs for 20 active modules..." },
      { p: 75, text: "Extracting recent scan evaluation reports history..." },
      { p: 90, text: "Aggregating risk score coefficients and auditing waivers..." },
      { p: 100, text: "Data ingestion success! Updating KPIs dashboards..." }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setSyncProgress(steps[currentStep].p);
        setSyncFeedback(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    try {
      const res = await fetch("/api/nexus/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Wait briefly to let simulated step reach completion smoothly
        await new Promise(r => setTimeout(r, 600));
        setIsSyncing(false);
        setSyncProgress(0);
        setSyncFeedback("");
        fetchAllData();
      } else {
        clearInterval(interval);
        setIsSyncing(false);
        setSyncProgress(0);
        alert(`Ingestion failed: ${data.error || "Unknown server timeout"}`);
      }
    } catch (err) {
      clearInterval(interval);
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  // Manual waiver creation request Submitter
  const handleCreateWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiverTargetVuln) return;

    try {
      const res = await fetch("/api/nexus/waivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          violationId: `violation-iq-${Math.floor(Math.random() * 50000 + 40000)}`,
          reason: waiverReason,
          approver: waiverApprover,
          requester: waiverRequester,
          expirationDate: waiverExpiration || null,
          productId: selectedProductId,
          applicationId: waiverTargetVuln.applicationId,
          componentName: waiverTargetVuln.componentName,
          riskAcceptanceComment: waiverComment || "Standard waiver."
        })
      });

      if (res.ok) {
        setWaiverSubmitSuccess(true);
        setTimeout(() => {
          setIsWaiverModalOpen(false);
          setWaiverTargetVuln(null);
          setWaiverReason("");
          setWaiverComment("");
          setWaiverSubmitSuccess(false);
          fetchAllData();
        }, 1500);
      }
    } catch (err) {
      alert("Host error submitting corporate waiver details.");
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Top Banner and Connector Health */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold tracking-tight">Sonatype Nexus IQ Connector</h2>
              <span className="hidden md:inline-block px-2.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 font-bold uppercase rounded-full border border-emerald-500/20">
                ACTIVE PIPELINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live corporate monitoring of security violations, package waivers, and MTTR aging metrics for Vermeg products.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action trigger excel */}
          <a
            href="/api/nexus/export/excel"
            download
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export XLS</span>
          </a>

          {/* Action trigger pdf */}
          <a
            href="/api/nexus/export/pdf"
            download
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Export Audit PDF</span>
          </a>

          {/* Sync Trigger */}
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer ${
              isSyncing
                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed spin"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? `Syncing (${syncProgress}%)` : "Sync Nexus IQ"}</span>
          </button>
        </div>
      </div>

      {isSyncing && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 animate-pulse text-xs font-mono flex items-center space-x-3">
          <Activity className="w-4 h-4 text-indigo-400 animate-spin" />
          <span>[SYNC ENGINE] {syncFeedback}</span>
        </div>
      )}

      {/* Primary Workspace Tab Selector */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none gap-1 bg-slate-100/50 p-1.5 rounded-xl">
        {[
          { id: "EXECUTIVE", label: "Executive Dashboard", icon: TrendingUp },
          { id: "PRODUCTS", label: "Product Scorecards", icon: Layers },
          { id: "VULNERABILITIES", label: "Vulnerability Repository", icon: ShieldAlert },
          { id: "WAIVERS", label: "Waiver Governance", icon: CheckCircle },
          { id: "DEBT", label: "Technical Debt", icon: Clock },
          { id: "SETTINGS", label: "Pipeline Config", icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================================== */}
      {/* 1. TAB: EXECUTIVE DASHBOARD */}
      {/* ======================================================================== */}
      {activeTab === "EXECUTIVE" && execKpis && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">GLOBAL RISK INDEX</p>
                <p className={`text-3xl font-extrabold tracking-tight ${
                  execKpis.snapshot.globalSecurityRiskScore > 75 
                    ? "text-rose-600" 
                    : execKpis.snapshot.globalSecurityRiskScore > 50 
                    ? "text-amber-500" 
                    : "text-emerald-500"
                }`}>
                  {execKpis.snapshot.globalSecurityRiskScore} <span className="text-xs text-slate-400">/ 100</span>
                </p>
                <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-rose-500">
                  <AlertTriangle className="w-3 h-3" />
                  <span>SLA Alert Threshold</span>
                </div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-rose-500">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">CRITICAL VULNERABILITIES</p>
                <p className="text-3xl font-extrabold tracking-tight text-rose-600">
                  {execKpis.snapshot.criticalVulnerabilities}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">Active unresolved CVE vectors</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">ACTIVE WAIVERS</p>
                <p className="text-3xl font-extrabold tracking-tight text-amber-500">
                  {execKpis.snapshot.acceptedRiskCount}
                </p>
                <p className="text-[10px] text-amber-600 font-semibold">
                  {execKpis.snapshot.expiredWaiversCount} expired waivers pending
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">PRODUCT PORTAL GRADES</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-xs font-bold font-mono">
                    {execKpis.snapshot.productsRedCount} RED
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded text-xs font-bold font-mono">
                    {execKpis.snapshot.productsOrangeCount} ORG
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-xs font-bold font-mono">
                    {execKpis.snapshot.productsGreenCount} GRN
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Target benchmark: 100% Green</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Grid className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Product Heatmap Scorecard Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Vermeg Products Heatmap Card</h3>
                <p className="text-xs text-slate-400">Security rating and vulnerability volume mapped across all 8 products</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">COMPLIANCE CRITERIA</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {execKpis.productHeatmap.map((p) => (
                <button
                  key={p.productId}
                  onClick={() => {
                    setSelectedProductId(p.productId);
                    setActiveTab("PRODUCTS");
                  }}
                  className={`p-4 rounded-xl border text-left transition hover:shadow-md cursor-pointer ${
                    p.grade === "RED" 
                      ? "bg-rose-50/50 border-rose-200 hover:bg-rose-50 text-rose-900" 
                      : p.grade === "ORANGE" 
                      ? "bg-amber-50/50 border-amber-200 hover:bg-amber-50 text-amber-900" 
                      : "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50 text-emerald-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm tracking-tight">{p.productName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      p.grade === "RED" ? "bg-rose-600 text-white" : p.grade === "ORANGE" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                    }`}>
                      Score {p.score}
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-1 text-center font-mono">
                    <div className="p-1 bgColor border-slate-200/50 rounded">
                      <p className="text-[8px] text-slate-500 font-bold">CRIT</p>
                      <p className="text-xs font-bold text-rose-600">{p.criticalCount}</p>
                    </div>
                    <div className="p-1 bgColor border-slate-200/50 rounded">
                      <p className="text-[8px] text-slate-500 font-bold">HIGH</p>
                      <p className="text-xs font-bold text-slate-700">{p.highCount}</p>
                    </div>
                    <div className="p-1 bgColor border-slate-200/50 rounded">
                      <p className="text-[8px] text-slate-500 font-bold">WAIVER</p>
                      <p className="text-xs font-bold text-amber-600">{p.waiversCount}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end text-[9px] font-semibold text-slate-500 space-x-1">
                    <span>Inspect Scorecard</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Historical Trend and Alerts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recharts Area Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">Vulns & Risk Score Historical Horizon</h3>
                  <p className="text-xs text-slate-400">Security ratings progression over the last 6 months</p>
                </div>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={execKpis.trendHistory}>
                    <defs>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="avgScore" name="Avg Risk Score" stroke="#6366f1" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={2} />
                    <Area type="monotone" dataKey="critical" name="Critical Counts" stroke="#f43f5e" fillOpacity={0} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Real-time Alerts Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase">Automated Pipeline Alerts</h3>
                <p className="text-xs text-slate-400">Triggered live by Sonatype validation filters</p>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[250px] pr-1">
                {execKpis.recentAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-mono font-bold uppercase">
                        {alert.alertType.replace(/_/g, " ")}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COMEX Executive Recommendation Card */}
          <div className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-inner flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Strategic Recommendation Card</span>
              </div>
              <h4 className="text-lg font-bold tracking-tight">Address Centralized Framework Log4J Upgrade immediately</h4>
              <p className="text-xs text-slate-300 max-w-xl">
                The centralized <span className="text-indigo-400 font-bold">Framework</span> package governs 8 primary systems. Moving Log4J dependencies from 2.16 to 2.17.1 immediately reduces Megara, Solife, and Soliam cross-stage build risk weight coefficients by 40%.
              </p>
            </div>
            <button 
              onClick={() => {
                setSelectedProductId("framework");
                setActiveTab("PRODUCTS");
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center space-x-2"
            >
              <span>Inspect Framework</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ======================================================================== */}
      {/* 2. TAB: PRODUCT SCORECARDS */}
      {/* ======================================================================== */}
      {activeTab === "PRODUCTS" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Product Picker */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "megara", name: "Megara" },
              { id: "soliam", name: "Soliam" },
              { id: "digital_insurance", name: "Digital Insurance" },
              { id: "framework", name: "Framework" },
              { id: "solife", name: "Solife" },
              { id: "digital_banking", name: "Digital Banking" },
              { id: "solife_plat", name: "Solife Digital Platform" },
              { id: "colline", name: "Colline" }
            ].map((p) => {
              const works = selectedProductId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                    works
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10Scale"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          {productKpis && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Product Assessment Side panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{productKpis.productName}</h3>
                  <p className="text-xs text-slate-400">Continuous Evaluation Metadata</p>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-semibold uppercase font-mono">RISK GRADE</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black font-mono tracking-wider ${
                      productKpis.grade === "RED" 
                        ? "bg-rose-100 text-rose-700" 
                        : productKpis.grade === "ORANGE" 
                        ? "bg-amber-100 text-amber-700" 
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {productKpis.grade}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-semibold uppercase font-mono">CVSS EVAL SCORE</span>
                    <span className="text-lg font-extrabold text-slate-800 font-mono">
                      {productKpis.riskScore} <span className="text-xs text-slate-400">/ 100</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-semibold uppercase font-mono">COMPLIANCE STATE</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {productKpis.compliancePercentage}% Compliant
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-semibold uppercase font-mono">REMEDIATION VELOCITY</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">
                      {productKpis.fixVelocityPercentage}% / month
                    </span>
                  </div>
                </div>

                {/* Aging metrics */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-850 uppercase tracking-tight font-mono">Vulnerability SLA Aging Days</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>&lt; 30 Days</span>
                      <span className="font-bold text-slate-850">{productKpis.agingStats.under30} items</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 roundedOverflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded" style={{ width: `${Math.min(100, (productKpis.agingStats.under30 / (vulnerabilities.length || 1)) * 400)}%` }}></div>
                    </div>

                    <div className="flex justify-between text-slate-500 mt-2">
                      <span>30 to 60 Days</span>
                      <span className="font-bold text-slate-850">{productKpis.agingStats["30to60"]} items</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 roundedOverflow-hidden">
                      <div className="bg-amber-400 h-1.5 rounded" style={{ width: `${Math.min(100, (productKpis.agingStats["30to60"] / (vulnerabilities.length || 1)) * 400)}%` }}></div>
                    </div>

                    <div className="flex justify-between text-slate-500 mt-2">
                      <span>90+ Days (SLA Breach Risk)</span>
                      <span className="font-bold text-rose-600">{productKpis.agingStats.over180 + productKpis.agingStats["90to180"]} items</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 roundedOverflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded" style={{ width: `${Math.min(100, ((productKpis.agingStats.over180 + productKpis.agingStats["90to180"]) / (vulnerabilities.length || 1)) * 400)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Scanning Modules and Top Critical Components */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-6">
                
                {/* Active scan systems table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase">Active Scanned Codebases</h3>
                    <span className="text-xs text-indigo-600 font-mono font-bold">SDLC LIVE CONNECTED</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase font-mono">
                        <tr>
                          <th className="p-3">Application Module</th>
                          <th className="p-3 text-center">Open Vulnerabilities</th>
                          <th className="p-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {productKpis.backlogDetails.map((b) => (
                          <tr key={b.applicationId}>
                            <td className="p-3 font-semibold text-slate-800">{b.applicationName}</td>
                            <td className="p-3 text-center font-bold text-slate-700">{b.vulnerabilitiesCount}</td>
                            <td className="p-3 text-right">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-mono text-[9px] font-bold rounded">
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Critical Vulnerable components */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase">Identified Vulnerable Library Packages</h3>
                  
                  <div className="space-y-2">
                    {productKpis.topVulnerableComponents.map((comp) => (
                      <div key={comp.componentName} className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-150">
                        <div className="space-y-1.5 max-w-md">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800">{comp.componentName}</span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-mono">
                              v{comp.version}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Remediation: Upgrade dependency manifest file configuration directly to version <bold className="text-slate-700 font-bold">v{comp.remediationTargetVersion}</bold>
                          </p>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-[9px] text-slate-400 font-bold font-mono">CVSS THREAT</p>
                            <p className="font-extrabold text-rose-500 font-mono text-sm">{comp.cvssScore}</p>
                          </div>
                          <button
                            onClick={() => {
                              // Auto highlight and open vulns tab to locate the vulnerability
                              setVulnSearch(comp.componentName);
                              setActiveTab("VULNERABILITIES");
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2 rounded-lg text-[10px] font-bold tracking-wide transition cursor-pointer"
                          >
                            Remediate Action
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              
            </div>
          )}

        </div>
      )}

      {/* ======================================================================== */}
      {/* 3. TAB: VULNERABILITY REPOSITORY */}
      {/* ======================================================================== */}
      {activeTab === "VULNERABILITIES" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Active Filtering Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 flex-col md:flex-row gap-2 w-full">
              <input
                type="text"
                placeholder="Search CVE, package, jar..."
                value={vulnSearch}
                onChange={(e) => setVulnSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 flex-1 font-medium text-slate-700"
              />

              <select
                value={vulnSeverity}
                onChange={(e) => setVulnSeverity(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="LOW">Low Severity</option>
              </select>

              <select
                value={vulnStatus}
                onChange={(e) => setVulnStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Waived">Waived</option>
                <option value="Accepted">Accepted</option>
                <option value="Fixed">Fixed</option>
              </select>
            </div>

            {vulnSearch || vulnSeverity || vulnStatus ? (
              <button
                onClick={() => {
                  setVulnSearch("");
                  setVulnSeverity("");
                  setVulnStatus("");
                }}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition cursor-pointer"
              >
                Clear Filters
              </button>
            ) : null}
          </div>

          {/* Table display */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase font-mono border-b border-slate-100">
                  <tr>
                    <th className="p-4">Vulnerability ID</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Component name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Reachable</th>
                    <th className="p-4 text-center">CVSS</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {vulnerabilities
                    .filter((v) => {
                      if (vulnSeverity && v.severity !== vulnSeverity) return false;
                      if (vulnStatus && v.status.toLowerCase() !== vulnStatus.toLowerCase()) return false;
                      if (vulnSearch) {
                        const s = vulnSearch.toLowerCase();
                        return (
                          v.vulnerabilityId.toLowerCase().includes(s) ||
                          v.componentName.toLowerCase().includes(s)
                        );
                      }
                      return true;
                    })
                    .slice(0, 30) // cap rendering size for viewport agility
                    .map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900 font-mono">{v.vulnerabilityId}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            v.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-700"
                              : v.severity === "HIGH"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}>
                            {v.severity}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs truncate font-mono text-[11px] text-slate-600">
                          {v.componentName}
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-400 capitalize">{v.dependencyType}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                            v.reachable === "REACHABLE" 
                              ? "bg-red-50 text-red-600 border border-red-200/50" 
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {v.reachable}
                          </span>
                        </td>
                        <td className="p-4 text-center font-extrabold font-mono text-slate-800">{v.cvssScore}</td>
                        <td className="p-4">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border ${
                            v.status === "Open"
                              ? "bg-rose-50 text-rose-600 border-rose-200/50"
                              : v.status === "Waived"
                              ? "bg-amber-50 text-amber-600 border-amber-200/50"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200/50"
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedVuln(v)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition overflow-hidden cursor-pointer"
                              title="Inspect CVE Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {v.status === "Open" && (
                              <button
                                onClick={() => {
                                  setWaiverTargetVuln(v);
                                  setIsWaiverModalOpen(true);
                                }}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded text-[10px] font-bold tracking-wide transition overflow-hidden cursor-pointer"
                              >
                                Waiver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vulnerability details drawer modal */}
          {selectedVuln && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
                
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-mono tracking-tight">{selectedVuln.vulnerabilityId}</h3>
                    <p className="text-xs text-slate-400">Sonatype Reference: {selectedVuln.refId}</p>
                  </div>
                  <button
                    onClick={() => setSelectedVuln(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[9px] text-slate-400 font-bold uppercase font-mono">CVSS SCORE</p>
                      <p className="text-lg font-black text-slate-800 mt-1">{selectedVuln.cvssScore}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[9px] text-slate-400 font-bold uppercase font-mono">SEVERITY RATING</p>
                      <p className="text-lg font-black text-rose-600 mt-1">{selectedVuln.severity}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">Vulnerability Vector</p>
                    <p className="text-xs font-mono bg-slate-100 p-2.5 rounded-lg break-all text-slate-600 leading-normal">
                      {selectedVuln.cvssVector}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">Package Resource Locator</p>
                    <p className="text-xs text-slate-800 font-mono">{selectedVuln.packageUrl}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">Reachability Probe Status</p>
                    <p className="text-xs text-slate-800 leading-normal">
                      This vulnerability has been profiled as <span className="font-bold">{selectedVuln.reachable}</span> in execution pipelines. Exploitability potential evaluates as <span className="font-bold text-rose-500">{selectedVuln.exploitability}</span>.
                    </p>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl space-y-1.5 text-xs text-indigo-900">
                    <p className="font-bold underline">Automated Remediation Target:</p>
                    <p className="leading-relaxed">
                      Upgrade the dependency scope within maven pom.xml or package.json directory matching package <span className="font-mono bg-indigo-100 px-1 py-0.5 rounded text-indigo-700">{selectedVuln.componentName}</span> to version <span className="font-bold font-mono text-slate-900">v{selectedVuln.recommendedVersion}</span>. This removes CVE liability constraints.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setSelectedVuln(null)}
                    className="bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition hover:bg-indigo-500 cursor-pointer"
                  >
                    Acknowledge
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================================== */}
      {/* 4. TAB: WAIVER GOVERNANCE */}
      {/* ======================================================================== */}
      {activeTab === "WAIVERS" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">ACTIVE WAIVERS</p>
              <p className="text-3xl font-extrabold text-indigo-600 mt-2">
                {waivers.filter(w => w.status === "active").length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">EXPIRED WAIVERS</p>
              <p className="text-3xl font-extrabold text-rose-600 mt-2">
                {waivers.filter(w => w.status === "expired").length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">STALE EXAMINATIONS</p>
              <p className="text-3xl font-extrabold text-amber-500 mt-2">
                {waivers.filter(w => w.status === "stale").length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">LACKING DOCUMENTATION</p>
              <p className="text-3xl font-extrabold text-rose-500 mt-2">
                {waivers.filter(w => w.reason.length < 15).length}
              </p>
            </div>

          </div>

          {/* Active Waivers list */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase">Waiver Governance Audit Trail</h3>
                <p className="text-xs text-slate-400">Exceptions approved on Sonatype policy criteria</p>
              </div>
            </div>

            <div className="space-y-4">
              {waivers.map((w) => (
                <div key={w.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-extrabold text-slate-800 font-mono">{w.waiverId}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        w.status === "active" 
                          ? "bg-indigo-100 text-indigo-700" 
                          : "bg-rose-100 text-rose-700"
                      }`}>
                        {w.status}
                      </span>
                    </div>
                    <div className="flex items-center text-slate-400 font-semibold space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Expires: {w.expirationDate || "Infinitely Granted"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase font-mono">Waiver Policy Justification</p>
                    <p className="text-xs text-slate-700 leading-normal bg-white p-2.5 rounded-lg border border-slate-100 font-medium">
                      {w.reason}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 pt-1 font-medium">
                    <div className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Requester: <span className="text-slate-700 font-semibold">{w.requester}</span></span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Approver: <span className="text-slate-700 font-semibold">{w.approver}</span></span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Component: <span className="text-slate-700 font-mono truncate max-w-xs">{w.componentName}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================================== */}
      {/* 5. TAB: TECHNICAL DEBT */}
      {/* ======================================================================== */}
      {activeTab === "DEBT" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Dependency Debt Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">SECURITY DEBT SCORE</p>
                <p className="text-3xl font-extrabold text-rose-600 mt-1">785 <span className="text-xs text-slate-400">hours</span></p>
                <p className="text-xs text-slate-400 mt-1">SLA estimation to clear existing critical alerts backlog</p>
              </div>

              <div className="space-y-2 text-xs font-medium">
                <div className="flex justify-between text-slate-500">
                  <span>Framework Core Library update</span>
                  <span className="text-slate-800 font-bold">120 hrs</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Megara SSO branch merge</span>
                  <span className="text-slate-800 font-bold">180 hrs</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold text-rose-500">
                  <span>SLA Penalties Overdue backlog</span>
                  <span className="font-extrabold">240 hrs</span>
                </div>
              </div>
            </div>

            {/* Dependency obsolescence forecasting chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase">Dependency Debt Upgrade Projection</h3>
                <p className="text-xs text-slate-400">Forcasted Remediation Velocity targets over 3, 6, 12 months</p>
              </div>

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Current Status", critical: 45, high: 88, debt: 785 },
                    { name: "3 Months (Q3)", critical: 22, high: 45, debt: 410 },
                    { name: "6 Months (Q4)", critical: 8, high: 20, debt: 180 },
                    { name: "12 Months (2027)", critical: 0, high: 4, debt: 35 }
                  ]}>
                    <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                    <YAxis fontSize={11} stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="critical" name="Critical Backlog" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="high" name="High Backlog" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Obsolete Libraries audit logger */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Dependency Upgrade Path Ledger</h3>
              <p className="text-xs text-slate-400">Active obsolete packages listed across libraries on central directories</p>
            </div>

            <div className="space-y-2.5">
              {[
                { name: "org.bouncycastle:bcprov-jdk15on", version: "1.65", target: "1.70", age: "24 months obsolete", application: "Digital Banking Core" },
                { name: "com.fasterxml.jackson.core:jackson-databind", version: "2.12.3", target: "2.14.0", age: "18 months obsolete", application: "Soliam Investor relations Portal" },
                { name: "org.apache.commons:commons-compress", version: "1.20", target: "1.21", age: "14 months obsolete", application: "Megara Settlement backend" }
              ].map((item) => (
                <div key={item.name} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 font-mono">{item.name}</p>
                    <p className="text-[11px] text-slate-400">Active codebase module: <span className="text-indigo-600 font-semibold">{item.application}</span></p>
                  </div>

                  <div className="flex items-center space-x-6 text-xs text-slate-500 font-medium">
                    <span>v{item.version} → <span className="text-emerald-600 font-bold">v{item.target}</span></span>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-bold font-mono">
                      {item.age}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================================== */}
      {/* 6. TAB: PIPELINE CONFIG */}
      {/* ======================================================================== */}
      {activeTab === "SETTINGS" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Connection Credentials Form */}
            <form onSubmit={saveConnectionSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Sonatype Connection Parameter Profile</h3>
                <p className="text-xs text-slate-400">Configure corporate server endpoints, basic token headers, and transport timeout bounds.</p>
              </div>

              {saveStatus && (
                <div className={`p-3.5 rounded-xl text-xs font-bold ${
                  saveStatus.startsWith("Success") ? "bg-emerald-50 text-emerald-750 border border-emerald-200" : "bg-rose-50 text-rose-750 border border-rose-200"
                }`}>
                  {saveStatus}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-xs font-bold text-slate-500">
                    <label>Sonatype IQ Server URL</label>
                    <input
                      type="url"
                      value={configUrl}
                      onChange={(e) => setConfigUrl(e.target.value)}
                      required
                      placeholder="https://soft-security:8070/"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-700 text-xs focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>

                  <div className="space-y-1 text-xs font-bold text-slate-500">
                    <label>Workspace Username</label>
                    <input
                      type="text"
                      value={configUser}
                      onChange={(e) => setConfigUser(e.target.value)}
                      required
                      placeholder="ftekitek"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-700 text-xs focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs font-bold text-slate-500">
                  <label>REST Authentication Token</label>
                  <input
                    type="password"
                    value={configToken}
                    onChange={(e) => setConfigToken(e.target.value)}
                    placeholder="•••••••••••••••• (Leave blank to preserve current ftekitek secret)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-700 text-xs focus:outline-none focus:border-indigo-500 mt-1 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-xs font-bold text-slate-500">
                    <label>Response Timeout Threshold (ms)</label>
                    <input
                      type="number"
                      value={configTimeout}
                      onChange={(e) => setConfigTimeout(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-700 text-xs focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>

                  <div className="space-y-1 text-xs font-bold text-slate-500">
                    <label>Maximum Recovery Retries</label>
                    <input
                      type="number"
                      value={configRetries}
                      onChange={(e) => setConfigRetries(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-700 text-xs focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={handleProbeConnection}
                  disabled={testingProbe}
                  className="bg-slate-150 hover:bg-slate-200 text-slate-750 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  {testingProbe ? "Probing Active Host..." : "Test Connection Profile"}
                </button>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  Save Credential Profiles
                </button>
              </div>

              {probeResult && (
                <div className={`p-4 rounded-xl border text-xs font-medium block mt-4 ${
                  probeResult.success ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
                }`}>
                  <p className="font-bold uppercase tracking-wider text-[9px] mb-1">PROBE STATUS CODE REPORT</p>
                  <p>{probeResult.message}</p>
                </div>
              )}
            </form>

            {/* Quick Action Side Board */}
            <div className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400 font-mono">DevSecOps Active Integration</h4>
                <p className="text-xs text-slate-300 mt-1">Sonatype IQ Server is set to monitor the corporate core architecture repositories nightly on port <span className="font-bold text-indigo-400">8070</span>.</p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs font-medium">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Ingested metrics:</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>8 Primary Vermeg Systems mapped</li>
                  <li>20 Module codebases checked</li>
                  <li>50 Historical scan evaluations</li>
                  <li>Waiver governance tracking</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs leading-relaxed space-y-1 text-slate-300">
                <div className="flex items-center space-x-1 text-rose-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="font-bold uppercase text-[9px]">Secret Masking filter</span>
                </div>
                <p className="text-[11px]">Developer credentials are automatically filtered. Any API keys or header certificates found inside response streams are securely replaced with anonymized identifiers before writing transaction logs.</p>
              </div>
            </div>

          </div>

          {/* Raw System Log audits */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Synchronizer Transaction Logs</h3>
              <p className="text-xs text-slate-400">Execution log streams containing masked credential profiles</p>
            </div>

            <div className="space-y-3">
              {syncLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-3 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      log.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans font-medium">Batch Run ID: {log.batchId}</span>
                  </div>

                  <p className="text-xs font-sans text-slate-200 leading-normal font-bold">Summary: {log.summary}</p>
                  
                  <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 max-h-[160px] overflow-y-auto whitespace-pre-wrap leading-normal font-mono text-[11px] text-slate-400">
                    {log.logs}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Interactive Waiver Creation Request Modal */}
      {isWaiverModalOpen && waiverTargetVuln && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <form onSubmit={handleCreateWaiver} className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs font-medium text-slate-700">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase">Interactive Waiver Authorizer</h3>
                <p className="text-[11px] text-slate-400">Approve exception scope on CVE vulnerabilities</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsWaiverModalOpen(false);
                  setWaiverTargetVuln(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {waiverSubmitSuccess ? (
              <div className="p-8 text-center space-y-3 animate-in zoom-in-95">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-slate-900">Waiver Exception Approved!</h4>
                <p className="text-xs text-slate-400">Synchronizing credentials and logging batch status logs...</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                  <p className="text-[9px] text-slate-400 font-bold uppercase font-mono">Target vulnerability</p>
                  <p className="font-bold text-slate-900 font-mono text-xs">{waiverTargetVuln.vulnerabilityId}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Component: {waiverTargetVuln.componentName}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">Business Exception Justification</label>
                  <textarea
                    required
                    rows={3}
                    value={waiverReason}
                    onChange={(e) => setWaiverReason(e.target.value)}
                    placeholder="Describe legacy code coupling, safe sandbox environments, sanitization vectors shielding..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 mt-1 text-slate-755 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase text-[9px]">Requesting Lead</label>
                    <input
                      type="text"
                      required
                      value={waiverRequester}
                      onChange={(e) => setWaiverRequester(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase text-[9px]">Approving Security Officer</label>
                    <input
                      type="text"
                      required
                      value={waiverApprover}
                      onChange={(e) => setWaiverApprover(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase text-[9px]">Waiver Expire Date</label>
                    <input
                      type="date"
                      value={waiverExpiration}
                      onChange={(e) => setWaiverExpiration(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase text-[9px]">Governance Comment</label>
                    <input
                      type="text"
                      value={waiverComment}
                      onChange={(e) => setWaiverComment(e.target.value)}
                      placeholder="e.g. Session approval code VMG-CO-99"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWaiverModalOpen(false);
                      setWaiverTargetVuln(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer"
                  >
                    Approve Waiver Exception
                  </button>
                </div>

              </div>
            )}

          </form>
        </div>
      )}

    </div>
  );
}
