/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Briefcase,
  Sliders,
  Database,
  Users,
  Lock,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Check,
  CheckSquare,
  UploadCloud,
} from "lucide-react";
import {
  store,
  getCurrentRole,
  addAuditTrail,
} from "../store/complianceStore";
import { REAL_VEG_REQUESTS } from "../realVegRequests";
import { VEGRequest, VEGRequestType } from "../types";

export default function VegGovernanceWorkspace() {
  const role = getCurrentRole();
  const rawRequests = store.getVEGRequests();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Selection state for detail panel
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    rawRequests.length > 0 ? rawRequests[0].id : null
  );

  // New request modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<VEGRequestType>("RFP");
  const [formClient, setFormClient] = useState("");
  const [formMargin, setFormMargin] = useState(35);
  const [formWorkload, setFormWorkload] = useState(500);
  const [formOwner, setFormOwner] = useState("Sarah Laroche");

  const [activeTab, setActiveTab] = useState<"LIST" | "PIPELINE">("LIST");

  // Excel Sync Portal States
  const [isExcelSyncOpen, setIsExcelSyncOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"IDLE" | "COMPARING" | "SYNCING" | "SUCCESS">("IDLE");
  const [syncFilter, setSyncFilter] = useState<"ALL" | "NEW" | "MODIFIED" | "IN_SYNC">("ALL");
  const [selectedExcelIds, setSelectedExcelIds] = useState<string[]>([]);
  const [manualCSVText, setManualCSVText] = useState("");
  const [syncMode, setSyncMode] = useState<"CRM_SPREADSHEET" | "MANUAL_PASTE">("CRM_SPREADSHEET");
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [manualParsedDeals, setManualParsedDeals] = useState<any[]>([]);

  // Open Excel sync, compare items and auto-select new/modified ones
  const handleOpenExcelSync = () => {
    setIsExcelSyncOpen(true);
    setSyncStatus("COMPARING");
    setSyncLog(["Scanning `/tmp/crunch.py` worksheet content...", "Comparing with active local database states..."]);
    
    // By default, select all records that are either missing or have different status/values
    const idsToSelect: string[] = [];
    REAL_VEG_REQUESTS.forEach((realVal) => {
      const match = rawRequests.find((r) => r.id === realVal.id);
      if (!match) {
        idsToSelect.push(realVal.id);
      } else {
        const hasDiff = 
          match.status !== realVal.status ||
          match.client !== realVal.client ||
          match.marginEstimate !== realVal.marginEstimate ||
          match.workloadMD !== realVal.workloadMD;
        if (hasDiff) {
          idsToSelect.push(realVal.id);
        }
      }
    });

    setSelectedExcelIds(idsToSelect);
    setTimeout(() => {
      setSyncStatus("IDLE");
    }, 400);
  };

  // Bulk synchronization trigger
  const handleTriggerExcelSync = () => {
    if (selectedExcelIds.length === 0) return;
    
    setSyncStatus("SYNCING");
    setSyncProgress(10);
    setSyncLog(["Starting batch ingestion of requested deals from CRM...", "Matching unique deal identities..."]);

    const itemsToSave = REAL_VEG_REQUESTS.filter((item) => selectedExcelIds.includes(item.id));

    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += 18;
      if (currentProgress >= 100) {
        clearInterval(interval);
        
        // Execute bulk save to database
        if ((store as any).saveVEGRequestsBatch) {
          (store as any).saveVEGRequestsBatch(itemsToSave);
        } else {
          // Fallback if batch save not bound
          itemsToSave.forEach((item) => store.saveVEGRequest(item));
        }

        setSelectedRequestId(itemsToSave[0].id);
        setSyncProgress(100);
        setSyncStatus("SUCCESS");
        setSyncLog((prev) => [
          ...prev, 
          "Step 4: Writing batch modifications to local database...", 
          `Step 5: Successfully synchronized ${itemsToSave.length} records!`,
          "Successfully updated active session logs and triggered audit trails."
        ]);

        addAuditTrail(
          "VEG_SYNC",
          "VEG",
          `Manually synced ${itemsToSave.length} deals from Excel CRM export sheet`
        );
      } else {
        setSyncProgress(currentProgress);
        if (currentProgress > 30 && currentProgress < 55) {
          setSyncLog((prev) => [...prev, "Step 2: Parsing columns, extracting clients & business lines..."]);
        } else if (currentProgress >= 55 && currentProgress < 85) {
          setSyncLog((prev) => [...prev, "Step 3: Calculating expected margins, IP/maint, & SaaS workloads..."]);
        }
      }
    }, 200);
  };

  // Basic CSV/clipboard parser
  const handleParsePastedCSV = (text: string) => {
    setManualCSVText(text);
    if (!text.trim()) {
      setManualParsedDeals([]);
      return;
    }

    try {
      const lines = text.split(/\r?\n/);
      const parsedRows: string[][] = [];
      
      lines.forEach((l) => {
        if (!l.trim()) return;
        const delim = l.includes("\t") ? "\t" : ",";
        const row: string[] = [];
        let cur = "";
        let inQuotes = false;
        
        for (let i = 0; i < l.length; i++) {
          const char = l[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delim && !inQuotes) {
            row.push(cur.trim());
            cur = "";
          } else {
            cur += char;
          }
        }
        row.push(cur.trim());
        parsedRows.push(row);
      });

      if (parsedRows.length === 0) return;

      const parsedResults = parsedRows.map((row, idx) => {
        if (row.length < 2) return null;
        
        const id = row[0]?.replace(/["]/g, "") || `PASTED-${Date.now()}-${idx}`;
        const client = row[1]?.replace(/["]/g, "") || "Pasted Client";
        const title = row[2]?.replace(/["]/g, "") || `${client} Ingested Deal`;
        const workloadMD = parseInt(row[3]?.replace(/[^0-9]/g, "") || "350");
        const marginEstimate = parseInt(row[4]?.replace(/[^0-9]/g, "") || "75");
        const region = row[5] || "EU";
        const statusStr = row[6] || "SUBMITTED";

        return {
          id,
          title,
          type: "RFP" as VEGRequestType,
          status: (["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CONTRACT_SIGNATURE"].includes(statusStr.toUpperCase()) 
            ? statusStr.toUpperCase() 
            : "SUBMITTED") as any,
          client,
          marginEstimate: isNaN(marginEstimate) ? 75 : marginEstimate,
          workloadMD: isNaN(workloadMD) ? 350 : workloadMD,
          financeState: "APPROVED" as any,
          salesState: "APPROVED" as any,
          productState: "APPROVED" as any,
          legalState: "APPROVED" as any,
          owner: "Pasted Ingest",
          date: new Date().toISOString().split("T")[0],
          region,
        };
      }).filter((x) => x !== null);

      setManualParsedDeals(parsedResults);
    } catch (e) {
      console.error("Could not parse manual clipboard data", e);
    }
  };

  const handleImportPastedDeals = () => {
    if (manualParsedDeals.length === 0) return;
    
    if ((store as any).saveVEGRequestsBatch) {
      (store as any).saveVEGRequestsBatch(manualParsedDeals);
    } else {
      manualParsedDeals.forEach((item) => store.saveVEGRequest(item));
    }
    
    addAuditTrail(
      "VEG_MANUAL_PASTE_SYNC",
      "VEG",
      `Pasted & imported ${manualParsedDeals.length} opportunity rows via clipboard portal`
    );
    
    setIsExcelSyncOpen(false);
    setManualCSVText("");
    setManualParsedDeals([]);
  };

  // Filtering
  const filteredRequests = rawRequests.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.codeACC && r.codeACC.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === "ALL" || r.type === filterType;
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const selectedRequest = rawRequests.find((r) => r.id === selectedRequestId);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formClient) return;

    const newReq: VEGRequest = {
      id: `VEG-2026-0${rawRequests.length + 1}`,
      title: formTitle,
      type: formType,
      status: "DRAFT",
      client: formClient,
      marginEstimate: parseFloat(formMargin as any),
      workloadMD: parseInt(formWorkload as any),
      financeState: "PENDING",
      salesState: "PENDING",
      productState: "PENDING",
      legalState: "PENDING",
      owner: formOwner,
      date: new Date().toISOString().split("T")[0],
    };

    store.saveVEGRequest(newReq);
    setSelectedRequestId(newReq.id);
    setIsFormOpen(false);

    // Reset Form
    setFormTitle("");
    setFormClient("");
    setFormMargin(35);
    setFormWorkload(500);

    // Trigger update
    addAuditTrail(
      "VEG_CREATE_REQUEST",
      "VEG",
      `Initiated new dossier: ${newReq.id} - ${newReq.title}`
    );
  };

  // Coordination toggle permissions based on active roles
  const canApproveCoordination = ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER"].includes(role);
  const canVoteBidDecision = ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER"].includes(role);

  const handleUpdateDecision = (
    reqId: string,
    field: "financeState" | "salesState" | "productState" | "legalState" | "bidDecision" | "goNoGoDecision" | "status" | "codeACC",
    val: any
  ) => {
    const req = rawRequests.find((r) => r.id === reqId);
    if (!req) return;

    const oldVal = (req as any)[field];
    const updated: any = { ...req, [field]: val };

    // Auto update state when validations are met
    if (field === "financeState" || field === "salesState" || field === "productState" || field === "legalState") {
      const stats = [
        field === "financeState" ? val : req.financeState,
        field === "salesState" ? val : req.salesState,
        field === "productState" ? val : req.productState,
        field === "legalState" ? val : req.legalState,
      ];

      // If all four coordinate states are approved, set Go/No-Go Decision Ready and progress status
      if (stats.every((s) => s === "APPROVED")) {
        updated.goNoGoDecision = "GO";
        updated.status = "APPROVED";
      } else if (stats.some((s) => s === "REJECTED")) {
        updated.goNoGoDecision = "NO_GO";
        updated.status = "REJECTED";
      }
    }

    if (field === "status" && val === "CONTRACT_SIGNATURE") {
      // Auto assign ACC code if missing
      if (!updated.codeACC) {
        updated.codeACC = `ACC-${req.client.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    }

    store.saveVEGRequest(updated);
    addAuditTrail(
      "VEG_COORDINATION_UPDATE",
      "VEG",
      `Dossier ${reqId} field ${field} updated from ${oldVal} to ${val}`
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase font-mono">
            VEG & Opportunity Deal Governance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate won approvals, BID/No-BID oversight, multi-disciplinary checkoffs and code ACC assignments.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={handleOpenExcelSync}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer shadow-slate-200/50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            SYNC FROM EXCEL
          </button>
          {["ADMIN", "PRODUCT_OWNER", "COMPLIANCE_OFFICER"].includes(role) && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              CREATE DEAL DOSSIER
            </button>
          )}
        </div>
      </div>

      {/* Funnel Pipeline Visualisation */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest">
            Pipeline Opportunity Flow
          </span>
          <div className="flex space-x-1 p-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab("LIST")}
              className={`px-3 py-1 rounded-md transition-all ${activeTab === "LIST" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`}
            >
              Dossier Grid
            </button>
            <button
              onClick={() => setActiveTab("PIPELINE")}
              className={`px-3 py-1 rounded-md transition-all ${activeTab === "PIPELINE" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`}
            >
              Pipeline Funnel
            </button>
          </div>
        </div>

        {activeTab === "PIPELINE" ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CONTRACT_SIGNATURE"].map((stage) => {
              const stageReqs = rawRequests.filter((r) => r.status === stage);
              return (
                <div key={stage} className="bg-white border border-slate-200 rounded-lg p-3 shadow-none">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-600 uppercase font-mono">{stage.replace(/_/g, " ")}</span>
                    <span className="text-xs font-mono font-bold px-1.5 bg-slate-100 text-slate-600 rounded">{stageReqs.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[140px] max-h-[250px] overflow-y-auto">
                    {stageReqs.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRequestId(r.id)}
                        className={`p-2.5 rounded-md border text-xs cursor-pointer transition-all ${
                          selectedRequestId === r.id
                            ? "bg-indigo-50/50 border-indigo-400 shadow-sm"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <p className="font-bold text-slate-700 truncate">{r.title}</p>
                        <div className="flex items-center justify-between mt-10 text-[10px] text-slate-400 font-mono">
                          <span>{r.client}</span>
                          <span className="font-bold text-slate-600">{r.marginEstimate}%</span>
                        </div>
                      </div>
                    ))}
                    {stageReqs.length === 0 && (
                      <div className="h-full flex items-center justify-center py-8 text-center text-slate-300 text-[11px] font-semibold">
                        Empty Stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 font-mono text-left">TOTAL DOSSIERS</p>
                <p className="text-xl font-bold font-mono text-slate-800 text-left">{rawRequests.length}</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center space-x-3">
              <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 font-mono text-left">UNDER EVALUATION</p>
                <p className="text-xl font-bold font-mono text-slate-800 text-left">
                  {rawRequests.filter((r) => r.status === "SUBMITTED").length}
                </p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 font-mono text-left">CONTRACT SIGNED (WON)</p>
                <p className="text-xl font-bold font-mono text-slate-800 text-left">
                  {rawRequests.filter((r) => r.status === "CONTRACT_SIGNATURE").length}
                </p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 font-mono text-left">ESTIMATED MEAN MARGIN</p>
                <p className="text-xl font-bold font-mono text-slate-800 text-left">
                  {Math.round(rawRequests.reduce((acc, r) => acc + r.marginEstimate, 0) / rawRequests.length)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deal Registry Left List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm lg:col-span-7 flex flex-col justify-start">
          {/* Header controls list */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search deals, clients or code ACC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="RFI">RFI responses</option>
                <option value="RFP">RFP proposals</option>
                <option value="NEW_CLIENT_REQUEST">New Client approvals</option>
                <option value="BD_REQUEST">BD Requests</option>
                <option value="ACC_CODE_CREATION">ACC codes allocation</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">DRAFTS</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CONTRACT_SIGNATURE">SIGNED (WON)</option>
              </select>
            </div>
          </div>

          {/* Table of records */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="p-3.5">ID / Deal</th>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">MD / Margin</th>
                  <th className="p-3.5">Risk Gov.</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRequests.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRequestId(r.id)}
                    className={`hover:bg-slate-50 cursor-pointer transition-all ${
                      selectedRequestId === r.id ? "bg-indigo-50/40 font-bold" : ""
                    }`}
                  >
                    <td className="p-3.5 max-w-[200px]">
                      <span className="text-[10px] font-bold font-mono text-slate-400 block">{r.id}</span>
                      <span className="text-slate-700 truncate block mt-0.5">{r.title}</span>
                    </td>
                    <td className="p-3.5 text-slate-700">{r.client}</td>
                    <td className="p-3.5">
                      <span className="text-slate-500 block font-mono">{r.workloadMD} MD</span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Est. {r.marginEstimate}%</span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex space-x-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                          r.bidDecision === "BID" ? "bg-emerald-100 text-emerald-800" : r.bidDecision === "NO_BID" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          BID: {r.bidDecision || "PENDING"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                          r.goNoGoDecision === "GO" ? "bg-emerald-100 text-emerald-800" : r.goNoGoDecision === "NO_GO" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          GO: {r.goNoGoDecision || "PENDING"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                        r.status === "CONTRACT_SIGNATURE"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : r.status === "APPROVED"
                          ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          : r.status === "REJECTED"
                          ? "bg-rose-100 text-rose-850 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                        {r.status === "CONTRACT_SIGNATURE" ? "SIGNED (WON)" : r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold font-mono">
                      No matching records found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coordination & Approval Dashboard Right panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-5 flex flex-col justify-between">
          {selectedRequest ? (
            <div className="space-y-5">
              {/* Header Title */}
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{selectedRequest.id} • {selectedRequest.type}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                    selectedRequest.status === "CONTRACT_SIGNATURE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mt-1.5 pr-4 leading-snug">{selectedRequest.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Responsible Partner: {selectedRequest.owner}</p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-mono font-bold">CLIENT SEGMENT</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedRequest.client}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono font-bold">ALLOCATED ACC CODE</p>
                  <p className="font-mono font-bold text-slate-700 mt-0.5">{selectedRequest.codeACC || "PENDING APPROVED"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono font-bold">TENDER WORKLOAD (EST.)</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedRequest.workloadMD} Man-days</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono font-bold">PROPOSAL MARGIN</p>
                  <p className="font-semibold text-indigo-600 mt-0.5">{selectedRequest.marginEstimate}% Expected</p>
                </div>
                {/* Real Data Extended Fields */}
                {(selectedRequest as any).region && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-mono font-bold">REGION</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{(selectedRequest as any).region}</p>
                  </div>
                )}
                {(selectedRequest as any).businessLine && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-mono font-bold">BUSINESS LINE</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{(selectedRequest as any).businessLine}</p>
                  </div>
                )}
                {(selectedRequest as any).products && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-mono font-bold">PRODUCTS</p>
                    <p className="font-semibold text-slate-700 mt-0.5 truncate" title={(selectedRequest as any).products}>{(selectedRequest as any).products}</p>
                  </div>
                )}
                {(selectedRequest as any).salesStatusStr && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-mono font-bold">CRM SALES STATUS</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{(selectedRequest as any).salesStatusStr}</p>
                  </div>
                )}
                {(selectedRequest as any).tcvK !== undefined && (selectedRequest as any).tcvK > 0 && (
                  <div className="col-span-2 grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-2.5 mt-1">
                    <div>
                      <p className="text-[9px] text-slate-400 font-mono font-bold">TCV (K)</p>
                      <p className="font-bold text-slate-700 font-mono">{(selectedRequest as any).tcvK?.toLocaleString()} K</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-mono font-bold">IP/MAINT (K)</p>
                      <p className="font-bold text-slate-700 font-mono">{(selectedRequest as any).ipMaintenanceK?.toLocaleString()} K</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-mono font-bold">SaaS (K)</p>
                      <p className="font-bold text-slate-700 font-mono">{(selectedRequest as any).saasK?.toLocaleString()} K</p>
                    </div>
                  </div>
                )}
                {(selectedRequest as any).comment && (
                  <div className="col-span-2 border-t border-slate-200/60 pt-2.5 mt-1">
                    <p className="text-[10px] text-slate-400 font-mono font-bold">SPECIAL CONDITIONS & COMMENTS</p>
                    <p className="text-xs text-slate-600 mt-1 italic whitespace-pre-wrap leading-relaxed">{(selectedRequest as any).comment}</p>
                  </div>
                )}
              </div>

              {/* Multi-disciplinary Coordination States */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-3">
                  Department Checkouts & Approvals
                </p>
                <div className="space-y-2.5">
                  {/* Finance Coordination */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                        <Database className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-700 leading-none">Finance checkoff</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Budget parameters & payment terms</p>
                      </div>
                    </div>
                    {canApproveCoordination ? (
                      <select
                        value={selectedRequest.financeState}
                        onChange={(e) => handleUpdateDecision(selectedRequest.id, "financeState", e.target.value)}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold text-slate-700 focus:outline-none border border-slate-200 cursor-pointer ${
                          selectedRequest.financeState === "APPROVED" ? "bg-emerald-100 hover:bg-emerald-200 border-emerald-300" : selectedRequest.financeState === "REJECTED" ? "bg-rose-100 hover:bg-rose-200 border-rose-300" : "bg-white hover:bg-slate-100"
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVE</option>
                        <option value="REJECTED">REJECT</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        selectedRequest.financeState === "APPROVED" ? "bg-emerald-100 text-emerald-800" : selectedRequest.financeState === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {selectedRequest.financeState}
                      </span>
                    )}
                  </div>

                  {/* Sales Coordination */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-700 leading-none">Sales checkoff</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Commercial targets & client relationship</p>
                      </div>
                    </div>
                    {canApproveCoordination ? (
                      <select
                        value={selectedRequest.salesState}
                        onChange={(e) => handleUpdateDecision(selectedRequest.id, "salesState", e.target.value)}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold text-slate-700 focus:outline-none border border-slate-200 cursor-pointer ${
                          selectedRequest.salesState === "APPROVED" ? "bg-emerald-100 hover:bg-emerald-200 border-emerald-300" : selectedRequest.salesState === "REJECTED" ? "bg-rose-100 hover:bg-rose-200 border-rose-300" : "bg-white hover:bg-slate-100"
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVE</option>
                        <option value="REJECTED">REJECT</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        selectedRequest.salesState === "APPROVED" ? "bg-emerald-100 text-emerald-800" : selectedRequest.salesState === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {selectedRequest.salesState}
                      </span>
                    )}
                  </div>

                  {/* Product Coordination */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                        <Sliders className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-700 leading-none">Product / R&D checkoff</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Sizing estimates & functional roadmap fit</p>
                      </div>
                    </div>
                    {canApproveCoordination ? (
                      <select
                        value={selectedRequest.productState}
                        onChange={(e) => handleUpdateDecision(selectedRequest.id, "productState", e.target.value)}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold text-slate-700 focus:outline-none border border-slate-200 cursor-pointer ${
                          selectedRequest.productState === "APPROVED" ? "bg-emerald-100 hover:bg-emerald-200 border-emerald-300" : selectedRequest.productState === "REJECTED" ? "bg-rose-100 hover:bg-rose-200 border-rose-300" : "bg-white hover:bg-slate-100"
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVE</option>
                        <option value="REJECTED">REJECT</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        selectedRequest.productState === "APPROVED" ? "bg-emerald-100 text-emerald-800" : selectedRequest.productState === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {selectedRequest.productState}
                      </span>
                    )}
                  </div>

                  {/* Legal Coordination */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-700 leading-none">Legal / Regulatory checkoff</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Contractual liability obligations & GDPR scope</p>
                      </div>
                    </div>
                    {canApproveCoordination ? (
                      <select
                        value={selectedRequest.legalState}
                        onChange={(e) => handleUpdateDecision(selectedRequest.id, "legalState", e.target.value)}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold text-slate-700 focus:outline-none border border-slate-200 cursor-pointer ${
                          selectedRequest.legalState === "APPROVED" ? "bg-emerald-100 hover:bg-emerald-200 border-emerald-300" : selectedRequest.legalState === "REJECTED" ? "bg-rose-100 hover:bg-rose-200 border-rose-300" : "bg-white hover:bg-slate-100"
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVE</option>
                        <option value="REJECTED">REJECT</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        selectedRequest.legalState === "APPROVED" ? "bg-emerald-100 text-emerald-800" : selectedRequest.legalState === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {selectedRequest.legalState}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bid Committee Decision updates */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-bold text-slate-700">Committee Overrides & Execution</p>
                  <p className="text-[10px] text-slate-450">Set ultimate gate approvals before signing master contracts</p>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  {canVoteBidDecision ? (
                    <>
                      <button
                        onClick={() => handleUpdateDecision(selectedRequest.id, "bidDecision", selectedRequest.bidDecision === "BID" ? "NO_BID" : "BID")}
                        className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-colors cursor-pointer ${
                          selectedRequest.bidDecision === "BID" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        BID VOTE: {selectedRequest.bidDecision || "NO VOTE"}
                      </button>

                      {selectedRequest.status === "APPROVED" && (
                        <button
                          onClick={() => handleUpdateDecision(selectedRequest.id, "status", "CONTRACT_SIGNATURE")}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer inline-flex items-center space-x-1"
                        >
                          <span>SIGN CONTRACT (WON)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-100 p-2 rounded">
                      Contact Administrator or VP for committee overrides
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 font-mono text-xs">
              No deal dossier selected. Highlight a record on the left grid.
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-100">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-100 text-slate-800">
            <h3 className="text-sm font-bold text-slate-800 font-mono uppercase tracking-widest pb-2 border-b border-slate-100">
              CREATE OPPORTUNITY DOSSIER
            </h3>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Dossier / Tender Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BNP Paribas Clearing Platform"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Contract Category</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="RFP">RFP Proposal</option>
                    <option value="RFI">RFI response</option>
                    <option value="NEW_CLIENT_REQUEST">New Client approval</option>
                    <option value="BD_REQUEST">BD Request</option>
                    <option value="ACC_CODE_CREATION">ACC code tracking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Estimated Client Partner</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BNP Paribas"
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Expected Margins (%)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={100}
                    value={formMargin}
                    onChange={(e) => setFormMargin(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Sizing (Man-Days)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formWorkload}
                    onChange={(e) => setFormWorkload(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-semibold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer shadow-sm"
                >
                  SUBMIT DOSSIER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENTERPRISE EXCEL SHEET SYNCHRONIZATION PORTAL */}
      {isExcelSyncOpen && (
        <div id="excel-sync-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-150 p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono tracking-wider text-slate-200 uppercase">
                    VEG Opportunities CRM-Excel Sync Hub
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Synchronize bulk dossiers with the enterprise excel database export at <code className="text-emerald-400 text-[11px] font-mono font-bold bg-emerald-950/40 px-1 py-0.5 rounded">/tmp/crunch.py</code>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExcelSyncOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Ingestion Mode Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 py-2 gap-4 text-xs">
              <button
                onClick={() => setSyncMode("CRM_SPREADSHEET")}
                className={`py-2 px-3 border-b-2 font-bold tracking-wide transition-all cursor-pointer ${
                  syncMode === "CRM_SPREADSHEET"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                1. CRM SPREADSHEET PORTAL (78 DEALS)
              </button>
              <button
                onClick={() => {
                  setSyncMode("MANUAL_PASTE");
                  setSyncStatus("IDLE");
                }}
                className={`py-2 px-3 border-b-2 font-bold tracking-wide transition-all cursor-pointer ${
                  syncMode === "MANUAL_PASTE"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                2. CLIPBOARD MANUAL PASTE INGESTION
              </button>
            </div>

            {/* Modal Body / Split panels */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0 min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-300">
              
              {/* Main Content Area */}
              <div className="lg:col-span-8 flex flex-col min-h-0 min-w-0">
                {syncMode === "CRM_SPREADSHEET" ? (
                  <div className="space-y-4 flex flex-col h-full min-h-0 min-w-0">
                    
                    {/* Grid Statistics Header */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-905 border border-slate-800 p-3 rounded-lg text-left bg-slate-900/50">
                        <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Spreadsheet Total</span>
                        <span className="text-lg font-bold font-mono text-slate-100">{REAL_VEG_REQUESTS.length} deals</span>
                      </div>
                      <div className="bg-slate-905 border border-slate-800 p-3 rounded-lg text-left bg-slate-900/50">
                        <span className="text-[10px] text-emerald-400 font-mono font-bold block uppercase tracking-wider">Unregistered/Diff</span>
                        <span className="text-lg font-bold font-mono text-emerald-400">
                          {REAL_VEG_REQUESTS.filter(realVal => {
                            const match = rawRequests.find(r => r.id === realVal.id);
                            return !match || match.status !== realVal.status || match.marginEstimate !== realVal.marginEstimate;
                          }).length} deals
                        </span>
                      </div>
                      <div className="bg-slate-905 border border-slate-800 p-3 rounded-lg text-left bg-slate-900/50">
                        <span className="text-[10px] text-indigo-400 font-mono font-bold block uppercase tracking-wider">In Sync / Vaulted</span>
                        <span className="text-lg font-bold font-mono text-indigo-400">
                          {REAL_VEG_REQUESTS.filter(realVal => {
                            const match = rawRequests.find(r => r.id === realVal.id);
                            return match && match.status === realVal.status && match.marginEstimate === realVal.marginEstimate;
                          }).length} deals
                        </span>
                      </div>
                    </div>

                    {/* Filter and selector row */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex space-x-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
                        {(["ALL", "NEW", "MODIFIED", "IN_SYNC"] as const).map(f => {
                          let count = 0;
                          if (f === "ALL") count = REAL_VEG_REQUESTS.length;
                          else if (f === "NEW") count = REAL_VEG_REQUESTS.filter(real => !rawRequests.some(r => r.id === real.id)).length;
                          else if (f === "MODIFIED") count = REAL_VEG_REQUESTS.filter(real => {
                            const match = rawRequests.find(r => r.id === real.id);
                            return match && (match.status !== real.status || match.marginEstimate !== real.marginEstimate || match.workloadMD !== real.workloadMD);
                          }).length;
                          else if (f === "IN_SYNC") count = REAL_VEG_REQUESTS.filter(real => {
                            const match = rawRequests.find(r => r.id === real.id);
                            return match && match.status === real.status && match.marginEstimate === real.marginEstimate && match.workloadMD === real.workloadMD;
                          }).length;

                          return (
                            <button
                              key={f}
                              onClick={() => setSyncFilter(f)}
                              className={`py-1 px-2.5 rounded font-mono text-[10px] font-bold cursor-pointer transition-colors ${
                                syncFilter === f ? "bg-emerald-800 text-white" : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {f}: {count}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                        <button
                          onClick={() => {
                            const toSelect = REAL_VEG_REQUESTS.filter(real => {
                              if (syncFilter === "ALL") return true;
                              const match = rawRequests.find(r => r.id === real.id);
                              if (syncFilter === "NEW") return !match;
                              if (syncFilter === "MODIFIED") return match && (match.status !== real.status || match.marginEstimate !== real.marginEstimate || match.workloadMD !== real.workloadMD);
                              return match && match.status === real.status && match.marginEstimate === real.marginEstimate && match.workloadMD === real.workloadMD;
                            }).map(r => r.id);
                            setSelectedExcelIds(toSelect);
                          }}
                          className="hover:text-emerald-400 transition cursor-pointer font-bold"
                        >
                          SELECT RELEVANT
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => setSelectedExcelIds([])}
                          className="hover:text-amber-400 transition cursor-pointer font-bold"
                        >
                          CLEAR ALL
                        </button>
                      </div>
                    </div>

                    {/* Table list of rows */}
                    <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-900/10 max-h-[350px]">
                      <table className="w-full text-left text-xs font-semibold text-slate-400">
                        <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 font-mono text-[10px] uppercase font-bold sticky top-0 z-10">
                          <tr>
                            <th className="p-3 text-center w-10">
                              <input
                                type="checkbox"
                                checked={selectedExcelIds.length === REAL_VEG_REQUESTS.length && REAL_VEG_REQUESTS.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedExcelIds(REAL_VEG_REQUESTS.map(r => r.id));
                                  } else {
                                    setSelectedExcelIds([]);
                                  }
                                }}
                                className="accent-emerald-500 rounded"
                              />
                            </th>
                            <th className="p-3">Deal Sourcing ID</th>
                            <th className="p-3">Client Partner</th>
                            <th className="p-3">Products & Business Line</th>
                            <th className="p-3">Workload / Margin</th>
                            <th className="p-3 text-center">Status Diff</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-slate-300">
                          {REAL_VEG_REQUESTS.filter(real => {
                            const match = rawRequests.find(r => r.id === real.id);
                            if (syncFilter === "ALL") return true;
                            if (syncFilter === "NEW") return !match;
                            if (syncFilter === "MODIFIED") return match && (match.status !== real.status || match.marginEstimate !== real.marginEstimate || match.workloadMD !== real.workloadMD);
                            return match && match.status === real.status && match.marginEstimate === real.marginEstimate && match.workloadMD === real.workloadMD;
                          }).map(real => {
                            const match = rawRequests.find(r => r.id === real.id);
                            const isSelected = selectedExcelIds.includes(real.id);
                            const hasStatusDiff = match ? match.status !== real.status : false;
                            const hasMarginDiff = match ? match.marginEstimate !== real.marginEstimate : false;

                            return (
                              <tr
                                key={real.id}
                                className={`hover:bg-slate-900/40 transition-colors ${
                                  isSelected ? "bg-emerald-950/20 font-bold text-slate-100 font-sans" : ""
                                }`}
                              >
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedExcelIds(prev => [...prev, real.id]);
                                      } else {
                                        setSelectedExcelIds(prev => prev.filter(id => id !== real.id));
                                      }
                                    }}
                                    className="accent-emerald-500 rounded cursor-pointer"
                                  />
                                </td>
                                <td className="p-3">
                                  <span className="text-[10px] font-mono text-slate-450 block">{real.id}</span>
                                  <span className="text-slate-100 block truncate max-w-[170px] mt-0.5 font-bold">{real.title}</span>
                                </td>
                                <td className="p-3 text-slate-200">{real.client}</td>
                                <td className="p-3">
                                  <span className="text-[10px] text-slate-450 font-mono block">{real.businessLine}</span>
                                  <span className="text-xs truncate block max-w-[160px] text-slate-300 mt-0.5">{real.products}</span>
                                </td>
                                <td className="p-3">
                                  <span className="text-slate-300 block font-mono">{real.workloadMD} MD</span>
                                  <span className={`text-[10px] font-mono block mt-0.5 ${hasMarginDiff ? "text-amber-400 font-bold" : "text-slate-500"}`}>
                                    {real.marginEstimate}% Margin {hasMarginDiff && `(Vault: ${match?.marginEstimate}%)`}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  {!match ? (
                                    <span className="px-1.5 py-0.5 bg-emerald-955 bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 rounded text-[9px] font-mono font-bold uppercase">
                                      NEW DEAL
                                    </span>
                                  ) : hasStatusDiff ? (
                                    <div className="flex flex-col items-center">
                                      <span className="text-[9px] line-through text-slate-500 font-mono font-bold">{match.status}</span>
                                      <span className="px-1.5 py-0.5 bg-amber-955 bg-amber-950/60 text-amber-400 border border-amber-900/40 rounded text-[9px] font-mono font-bold uppercase mt-0.5">
                                        👉 {real.status}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-indigo-955 bg-indigo-950/40 text-indigo-455 text-indigo-400 border border-indigo-900/20 rounded text-[9px] font-mono font-bold uppercase">
                                      IN ACCORD
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  // Manual clipboard paste portal
                  <div className="space-y-4 flex flex-col h-full min-h-0 min-w-0 text-left">
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Copy tabular formatted text or CSV records directly from your local Excel file or Google Sheet, paste it in the block below, and watch the compliance parser map cells instantly.
                    </p>
                    <textarea
                      value={manualCSVText}
                      onChange={(e) => handleParsePastedCSV(e.target.value)}
                      placeholder={`Format template: ID, Client, Deal Title, Workload_MD, Margin_%, Region, Status
e.g.
VEG-2026-X1, Bank of Tokyo, Global Derivatives Platform, 450, 81, EU, APPROVED
VEG-2026-X2, HSBC UK, Solix Risk Oversight, 600, 78, UK, CONTRACT_SIGNATURE `}
                      rows={6}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-550 focus:border-emerald-500 placeholder-slate-600 block"
                    />

                    {/* Parsed results count */}
                    <div className="flex items-center justify-between text-xs font-bold pt-1">
                      <span className="text-[10px] text-slate-405 font-mono tracking-widest uppercase text-slate-400">
                        Dynamic Clipboard Parser Output
                      </span>
                      <span className="text-emerald-400 font-mono font-bold">{manualParsedDeals.length} opportunity rows parsed</span>
                    </div>

                    {/* Preview Table of manual parsed data */}
                    <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl max-h-[170px] bg-slate-900/20">
                      <table className="w-full text-left text-xs font-semibold text-slate-450">
                        <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 font-mono text-[9px] uppercase font-bold sticky top-0 z-10 font-sans">
                          <tr>
                            <th className="p-2.5">Auto-generated ID</th>
                            <th className="p-2.5">Client</th>
                            <th className="p-2.5">Ingest Deal Title</th>
                            <th className="p-2.5">MD Sizing</th>
                            <th className="p-2.5">Est Margin</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-slate-350">
                          {manualParsedDeals.map((deal, idx) => (
                            <tr key={deal.id || idx} className="hover:bg-slate-900/30">
                              <td className="p-2.5 font-mono text-emerald-400 text-xs font-bold">{deal.id}</td>
                              <td className="p-2.5 text-slate-100">{deal.client}</td>
                              <td className="p-2.5 text-slate-300 truncate max-w-[150px]">{deal.title}</td>
                              <td className="p-2.5 font-mono font-bold">{deal.workloadMD} MD</td>
                              <td className="p-2.5 font-mono font-bold text-emerald-400">{deal.marginEstimate}%</td>
                              <td className="p-2.5">
                                <span className="px-1.5 py-0.5 bg-emerald-950/60 text-emerald-400 rounded text-[9px] font-mono font-bold">
                                  {deal.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {manualParsedDeals.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                                Waiting for spreadsheet copy-paste input...
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Logger / Status Tracking */}
              <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between text-left">
                <div>
                  <h4 className="text-[10px] font-bold font-mono tracking-widest text-slate-400 uppercase mb-3.5">
                    Sync Console Logger
                  </h4>

                  <div className="space-y-4 font-sans">
                    {/* Status badge and progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className="text-slate-350 text-slate-400">Process Status</span>
                        <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                          syncStatus === "SYNCING" ? "bg-amber-950 text-amber-400 animate-pulse border border-amber-900" : syncStatus === "SUCCESS" ? "bg-emerald-950 text-emerald-450 text-emerald-400 border border-emerald-900" : "bg-slate-800 text-slate-450 text-slate-400"
                        }`}>
                          {syncStatus}
                        </span>
                      </div>

                      {syncStatus === "SYNCING" && (
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${syncProgress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Ingestion Steps scrolling */}
                    <div className="bg-slate-950/90 rounded-lg p-3 border border-slate-850 font-mono text-[10px] text-slate-400 space-y-2 h-[180px] overflow-y-auto">
                      {syncLog.map((log, idx) => (
                        <div key={idx} className="flex items-start space-x-1.5 leading-snug">
                          <span className="text-slate-650 shrink-0 select-none text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                          <span className={idx === syncLog.length - 1 ? "text-slate-100 font-bold" : "text-slate-450 text-slate-400"}>
                            {log}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Confirm actions */}
                <div className="pt-4 mt-4 border-t border-slate-800">
                  {syncMode === "CRM_SPREADSHEET" ? (
                    <div className="space-y-2">
                      <button
                        onClick={handleTriggerExcelSync}
                        disabled={selectedExcelIds.length === 0 || syncStatus === "SYNCING"}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all shadow-md inline-flex items-center justify-center space-x-2 cursor-pointer ${
                          selectedExcelIds.length === 0 || syncStatus === "SYNCING"
                            ? "bg-slate-850 text-slate-600 cursor-not-allowed border border-slate-800/20"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/20"
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === "SYNCING" ? "animate-spin" : ""}`} />
                        <span>SYNCHRONIZE SELECTED ({selectedExcelIds.length})</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedExcelIds(REAL_VEG_REQUESTS.map(r => r.id));
                          setTimeout(() => {
                            setSelectedExcelIds(REAL_VEG_REQUESTS.map(r => r.id));
                            handleTriggerExcelSync();
                          }, 50);
                        }}
                        disabled={syncStatus === "SYNCING"}
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-100 rounded-lg text-xs font-semibold transition border border-slate-800 cursor-pointer"
                      >
                        FORCE CLOUD AUTO-SYNC (78 RECORDS)
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleImportPastedDeals}
                      disabled={manualParsedDeals.length === 0}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition duration-150 inline-flex items-center justify-center space-x-2 cursor-pointer ${
                        manualParsedDeals.length === 0
                          ? "bg-slate-850 text-slate-600 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>INGEST PASTED CELLS ({manualParsedDeals.length})</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsExcelSyncOpen(false);
                      if (syncStatus === "SUCCESS") {
                        window.location.reload();
                      }
                    }}
                    className="w-full mt-2 py-1.5 bg-transparent hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded border border-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    DISMISS / CLOSE PORTAL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
