/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Calendar,
  Layers,
  CheckCircle,
  Plus,
  Clock,
  Search,
  FileText,
  Bookmark,
  UserCheck,
  Check,
} from "lucide-react";
import {
  store,
  getCurrentRole,
  addAuditTrail,
} from "../store/complianceStore";
import { Committee } from "../types";

export default function CommitteesWorkspace() {
  const role = getCurrentRole();
  const rawCommittees = store.getCommittees();

  // Selected committee
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string | null>(
    rawCommittees.length > 0 ? rawCommittees[0].id : null
  );

  const [activeTab, setActiveTab] = useState<"SCHEDULED" | "ARCHIVED_MINUTES">("SCHEDULED");

  // State to append new agenda item
  const [newAgendaTopic, setNewAgendaTopic] = useState("");

  // Complete committee form
  const [isMinutesFormOpen, setIsMinutesFormOpen] = useState(false);
  const [minutesText, setMinutesText] = useState("");
  const [minutesDecision, setMinutesDecision] = useState("ALL_RESOLVED_COMPLIANT");

  const selectedComm = rawCommittees.find((c) => c.id === selectedCommitteeId);

  const handleAddAgendaTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComm || !newAgendaTopic) return;

    const updated: Committee = {
      ...selectedComm,
      agenda: [...selectedComm.agenda, newAgendaTopic],
    };

    store.saveCommittee(updated);
    setNewAgendaTopic("");

    addAuditTrail(
      "COMMITTEE_AGENDA_APPEND",
      "COMMITTEES",
      `Appended topic: "${newAgendaTopic}" to ${selectedComm.name}`
    );
  };

  const handleCompleteCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComm || !minutesText) return;

    const updated: Committee = {
      ...selectedComm,
      status: "HELD",
      minutes: minutesText,
    };

    store.saveCommittee(updated);
    setIsMinutesFormOpen(false);
    setMinutesText("");

    addAuditTrail(
      "COMMITTEE_CONDUCTED",
      "COMMITTEES",
      `Committee "${selectedComm.name}" concluded. Minutes filed with decision "${minutesDecision}"`
    );
  };

  const canManageCommittees = ["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER"].includes(role);

  const scheduledSessions = rawCommittees.filter((c) => c.status === "PLANNED");
  const conductedSessions = rawCommittees.filter((c) => c.status === "HELD");

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase font-mono">
            Committees, Steering & Strategic Assemblies
          </h2>
          <p className="text-xs text-slate-505 mt-0.5">
            Organize Monthly Expert Vulnerability reviews, SaaS committees, BID/No-BID steering panels, and file executive minutes coordinates.
          </p>
        </div>
      </div>

      {/* Segment selectors */}
      <div className="flex space-x-2 p-1 bg-slate-100 border border-slate-205 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("SCHEDULED")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "SCHEDULED" ? "bg-white text-slate-800 shadow-xs" : "text-slate-505 hover:text-slate-800"
          }`}
        >
          Scheduled Timelines ({scheduledSessions.length})
        </button>
        <button
          onClick={() => setActiveTab("ARCHIVED_MINUTES")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "ARCHIVED_MINUTES" ? "bg-white text-slate-800 shadow-xs" : "text-slate-505 hover:text-slate-800"
          }`}
        >
          Filed Minutes Archive ({conductedSessions.length})
        </button>
      </div>

      {activeTab === "SCHEDULED" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Timeline scheduler checklist list */}
          <div className="bg-white border border-slate-205 rounded-xl shadow-sm lg:col-span-7 flex flex-col justify-start p-5">
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-4">
              Upcoming Assembly Calendar
            </h3>
            <div className="space-y-3.5">
              {scheduledSessions.map((c) => {
                const isSelected = selectedCommitteeId === c.id;
                const moderator = c.participants[0] || "Compliance Lead";
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCommitteeId(c.id)}
                    className={`p-4 border rounded-xl text-xs cursor-pointer text-left transition-all ${
                      isSelected
                        ? "bg-indigo-50/50 border-indigo-400 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-indigo-650 uppercase px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded">
                        {c.type.replace(/_/g, " ")}
                      </span>
                      <span className="flex items-center font-mono font-bold text-slate-500 text-[10px]">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {c.date} • {c.time}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-805 mt-2.5 leading-snug text-sm">{c.name}</h4>
                    <p className="text-slate-450 text-[11px] mt-1.5 font-semibold">Scheduled Moderator: {moderator}</p>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {c.agenda.map((topic, index) => (
                        <span key={index} className="px-2 py-0.5 bg-white text-slate-505 border border-slate-200 rounded text-[9.5px] font-semibold">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {scheduledSessions.length === 0 && (
                <p className="text-xs text-slate-400 font-mono py-12 text-center">
                  All scheduled committees concluded for this timeline cycle.
                </p>
              )}
            </div>
          </div>

          {/* Agenda items and completing details */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-5 flex flex-col justify-between">
            {selectedComm && selectedComm.status === "PLANNED" ? (
              <div className="space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{selectedComm.id} • Timeline planned</span>
                  <h3 className="text-sm font-bold text-slate-808 mt-1">{selectedComm.name}</h3>
                  <p className="text-xs text-slate-450 mt-1">Moderator Lead: {selectedComm.participants[0] || "Compliance Lead"}</p>
                </div>

                {/* Agenda topics management list */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Locked Agenda Topics
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedComm.agenda.map((topic, i) => (
                      <div key={i} className="flex items-center text-xs p-2 rounded bg-slate-50 border border-slate-200 font-semibold text-slate-700 space-x-2">
                        <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>

                  {canManageCommittees && (
                    <form onSubmit={handleAddAgendaTopic} className="flex gap-2.5 pt-1">
                      <input
                        type="text"
                        required
                        placeholder="Append new session item topic..."
                        value={newAgendaTopic}
                        onChange={(e) => setNewAgendaTopic(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold cursor-pointer"
                      >
                        ADD
                      </button>
                    </form>
                  )}
                </div>

                {/* Complete Assembly Minute form controls */}
                <div className="pt-4 border-t border-slate-100">
                  {canManageCommittees ? (
                    <button
                      onClick={() => setIsMinutesFormOpen(true)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all shadow-sm text-center cursor-pointer"
                    >
                      CONDUCT ASSEMBLY & FILE MINUTES
                    </button>
                  ) : (
                    <p className="text-[10.5px] text-slate-400 font-mono italic leading-snug bg-slate-50 p-2 text-center rounded">
                      Only appointed committee moderator Lead ({selectedComm.participants[0] || "Compliance Lead"}) can write decision minutes.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 font-mono text-xs">
                Highlight an active scheduled assembly to manage agenda points.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "ARCHIVED_MINUTES" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
              Filed Steering Assembly Minutes Cabinet
            </h3>
            <p className="text-xs text-slate-450 mt-0.5">Formal archive logs containing decisions, rationales, and signed minutes directives.</p>
          </div>

          <div className="space-y-4 max-w-4xl">
            {conductedSessions.map((c) => (
              <div key={c.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5 hover:border-indigo-400 transition-all text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-indigo-600">{c.id} • Concluded</span>
                  <span className="flex items-center font-mono text-[10.5px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Session Date: {c.date}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>

                <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                  <p className="font-bold text-slate-505 font-mono tracking-widest text-[9.5px]">EXECUTIVE DECISION MINUTES LOG</p>
                  <p className="text-slate-655 leading-relaxed font-sans italic">
                    "{c.minutes || "Decisions compiled. Steering committee signed of and exited successfully with zero open dependencies block."}"
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-150 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Attendees Checked-in: {c.participants.join(", ")}</span>
                  <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    SIGNED & EXITED
                  </span>
                </div>
              </div>
            ))}
            {conductedSessions.length === 0 && (
              <p className="text-xs text-slate-400 font-mono py-12 text-center">
                No archived minutes found in this folder. Wrap planned sessions on scheduled timelines segment to file minutes.
              </p>
            )}
          </div>
        </div>
      )}

      {/* RATIONALE MINUTE COMPLETE DIALOG */}
      {isMinutesFormOpen && selectedComm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white border border-slate-205 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <h3 className="text-sm font-bold text-slate-800 font-mono uppercase tracking-widest pb-1.5 border-b border-slate-100">
              FILE COMMITTEE ASSEMBLY MINUTES
            </h3>
            <form onSubmit={handleCompleteCommittee} className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-mono font-bold block">ASSEMBLY TITLE</p>
                <p className="font-bold text-slate-700 text-xs mt-0.5">{selectedComm.name}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Steering Decision Status</label>
                <select
                  value={minutesDecision}
                  onChange={(e) => setMinutesDecision(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-705 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL_RESOLVED_COMPLIANT">RESOLVED - ALL STAGES FULLY COMPLIANT</option>
                  <option value="RESOLVED_WITH_RESERVATIONS">APPROVED - WITH DISCIPLINE RESERVATIONS</option>
                  <option value="POSTPONED">POSTPONED - RE-AUDIT INCOMING DOSSIER</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-1">Executive Summary Minutes</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record summary of notes, technical clearance signatures, specific exceptions approved, and post-committee action milestones assigned..."
                  value={minutesText}
                  onChange={(e) => setMinutesText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-705 font-semibold focus:outline-none focus:border-indigo-505"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 font-semibold">
                <button
                  type="button"
                  onClick={() => setIsMinutesFormOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-705 text-white rounded text-xs cursor-pointer shadow-sm"
                >
                  SUBMIT DIRECT ARCHIVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
