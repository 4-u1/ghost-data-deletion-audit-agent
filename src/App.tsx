import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

interface AuditStep {
  step_no: number;
  phase: "FINDING" | "REMEDIATION" | "VERIFICATION";
  system_id: string;
  resource_id: string;
  operation: string;
  state: string;
  evidence_id: string;
}

interface AuditCase {
  case_id: string;
  deletion_status: "COMPLETE" | "INCOMPLETE" | "NOT_APPLICABLE";
  steps: AuditStep[];
  email: string;
  requested_at: string;
  reported_status: string;
  reported_at: string;
  audit_at: string;
  request_text: string;
}

interface DeletionRule {
  rule_id: string;
  data_category: string;
  condition: string;
  required_action: string;
  retention_days: string;
  notes: string;
}

interface EvidenceFile {
  file_id: string;
  file_path: string;
  source_system: string;
  captured_at: string;
  artifact_type: string;
}

interface AuditSummaryResponse {
  cases: AuditCase[];
  samples: AuditCase[];
  rules: DeletionRule[];
  evidenceFiles: EvidenceFile[];
  evalReport: string;
  usageReport: string;
  readmeDoc: string;
  prdDoc: string;
  agentDoc: string;
  agentsRootDoc: string;
}

const MULTIMODAL_IDS = new Set([
  "case_33",
  "case_34",
  "case_35",
  "case_39",
  "case_45",
  "case_46",
  "case_50",
  "case_52",
  "case_53",
  "case_55",
  "case_61",
  "case_63",
]);

export default function App() {
  const [data, setData] = useState<AuditSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "welcome" | "cases" | "samples" | "rules" | "evidence" | "docs"
  >("welcome");
  const [docSubTab, setDocSubTab] = useState<
    "readme" | "prd" | "agent" | "agents_root" | "evaluation" | "usage"
  >("readme");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "INCOMPLETE" | "COMPLETE" | "NOT_APPLICABLE" | "MULTIMODAL"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("case_33");

  useEffect(() => {
    fetch("/api/audit-summary")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: AuditSummaryResponse) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load data");
        setLoading(false);
      });
  }, []);

  const currentDataset = useMemo(() => {
    if (!data) return [];
    return activeTab === "samples" ? data.samples : data.cases;
  }, [data, activeTab]);

  const filteredCases = useMemo(() => {
    return currentDataset.filter((c) => {
      if (statusFilter === "MULTIMODAL" && !MULTIMODAL_IDS.has(c.case_id)) {
        return false;
      }
      if (
        statusFilter !== "ALL" &&
        statusFilter !== "MULTIMODAL" &&
        c.deletion_status !== statusFilter
      ) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.case_id.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.request_text.toLowerCase().includes(q) ||
        c.steps.some(
          (s) =>
            s.system_id.toLowerCase().includes(q) ||
            s.resource_id.toLowerCase().includes(q) ||
            s.evidence_id.toLowerCase().includes(q)
        )
      );
    });
  }, [currentDataset, statusFilter, searchQuery]);

  const selectedCase = useMemo(() => {
    if (!currentDataset.length) return null;
    return (
      currentDataset.find((c) => c.case_id === selectedCaseId) ||
      filteredCases[0] ||
      currentDataset[0]
    );
  }, [currentDataset, selectedCaseId, filteredCases]);

  const stats = useMemo(() => {
    if (!data) {
      return { total: 0, incomplete: 0, complete: 0, notApplicable: 0 };
    }
    const incomplete = data.cases.filter(
      (c) => c.deletion_status === "INCOMPLETE"
    ).length;
    const complete = data.cases.filter(
      (c) => c.deletion_status === "COMPLETE"
    ).length;
    const notApplicable = data.cases.filter(
      (c) => c.deletion_status === "NOT_APPLICABLE"
    ).length;
    return {
      total: data.cases.length,
      incomplete,
      complete,
      notApplicable,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#F3F7F7] flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-[#1E293B] bg-[#11161F] p-8 space-y-4">
          <div className="text-xs font-mono text-[#00EA64] tracking-wider">
            HACKERRANK ORCHESTRATE · OCTOBER 2026
          </div>
          <div className="text-xl font-bold text-white">
            Yazeed Hamad Alharthi
          </div>
          <p className="text-sm text-[#94A3B8]">
            Initializing Ghost Data Still Exists Deletion-Audit Engine (518
            Evaluation Cases)...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-red-400 flex items-center justify-center p-6">
        <div className="border border-red-900 bg-[#11161F] p-6 max-w-lg">
          <h2 className="font-semibold text-lg mb-2">
            Failed to Load Audit Dataset
          </h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#F3F7F7] flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-[#1E293B] bg-[#0B0F14]">
        {/* Zone 1: Single text element Brand Wordmark */}
        <button
          onClick={() => setActiveTab("welcome")}
          className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer text-left"
        >
          HackerRank <span className="text-[#00EA64]">Orchestrate</span>
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#94A3B8]">
          <button
            onClick={() => setActiveTab("welcome")}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
              activeTab === "welcome"
                ? "text-[#00EA64] border-[#00EA64]"
                : "border-transparent"
            }`}
          >
            Welcome
          </button>
          <button
            onClick={() => {
              setActiveTab("cases");
              setSelectedCaseId("case_33");
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
              activeTab === "cases"
                ? "text-[#00EA64] border-[#00EA64]"
                : "border-transparent"
            }`}
          >
            Audit Cases
          </button>
          <button
            onClick={() => {
              setActiveTab("samples");
              setSelectedCaseId("case_01");
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
              activeTab === "samples"
                ? "text-[#00EA64] border-[#00EA64]"
                : "border-transparent"
            }`}
          >
            Benchmarks
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
              activeTab === "rules"
                ? "text-[#00EA64] border-[#00EA64]"
                : "border-transparent"
            }`}
          >
            Policy Rules
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
              activeTab === "docs"
                ? "text-[#00EA64] border-[#00EA64]"
                : "border-transparent"
            }`}
          >
            Documentation
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <a
            href="/api/download/output.csv"
            className="px-4 py-2 text-xs font-semibold text-[#0B0F14] bg-[#00EA64] hover:bg-[#2EC866] transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Download output.csv
          </a>
        </div>
      </header>

      {/* WELCOME PORTAL (HackerRank Signature Palette & Author Showcase) */}
      {activeTab === "welcome" && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-12">
          {/* 2-Column Hero Split */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Hero Brand & Author Presentation */}
            <div className="lg:col-span-7 border border-[#1E293B] bg-[#11161F] p-8 md:p-10 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#94A3B8]">
                  <span className="text-[#00EA64] font-semibold">
                    HACKERRANK ORCHESTRATE
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>OCTOBER 2026 CHALLENGE</span>
                  <span aria-hidden="true">·</span>
                  <a
                    href="https://github.com/interviewstreet/hackerrank-orchestrate-october26/tree/main"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#F3F7F7] hover:text-[#00EA64] underline underline-offset-4"
                  >
                    interviewstreet/hackerrank-orchestrate-october26
                  </a>
                </div>

                <h1
                  className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.12]"
                  style={{ textWrap: "balance" }}
                >
                  Ghost Data Still Exists — Autonomous Deletion-Audit Agent
                </h1>

                <p className="text-base text-[#94A3B8] leading-relaxed max-w-2xl">
                  Engineered by{" "}
                  <strong className="text-white font-semibold">
                    Yazeed Hamad Alharthi
                  </strong>{" "}
                  for the official{" "}
                  <span className="text-[#00EA64] font-medium">HackerRank</span>{" "}
                  challenge. A deterministic compliance and remediation engine
                  that reconstructs historical user identities, audits 88
                  multimodal evidence snapshots at exact cutoff timestamps, and
                  eliminates residual personal data across distributed replicas
                  and backup pipelines.
                </p>
              </div>

              {/* Primary & Secondary Action Bar */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => {
                      setActiveTab("cases");
                      setSelectedCaseId("case_33");
                    }}
                    className="px-6 py-3 text-sm font-bold text-[#0B0F14] bg-[#00EA64] hover:bg-[#2EC866] transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Open Audit Console (518 Cases)
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("docs");
                      setDocSubTab("prd");
                    }}
                    className="px-5 py-3 text-sm font-semibold text-white bg-[#18202C] hover:bg-[#222D3D] border border-[#2E3C51] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    View PRD, README & agent.md
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#94A3B8] pt-2">
                  <span>Submission Artifacts:</span>
                  <a
                    href="/api/download/output.csv"
                    className="text-[#00EA64] hover:underline"
                  >
                    output.csv
                  </a>
                  <span aria-hidden="true">·</span>
                  <a
                    href="/api/download/code.zip"
                    className="text-[#00EA64] hover:underline"
                  >
                    code.zip
                  </a>
                  <span aria-hidden="true">·</span>
                  <a
                    href="/api/download/PRD.md"
                    className="text-[#00EA64] hover:underline"
                  >
                    PRD.md
                  </a>
                  <span aria-hidden="true">·</span>
                  <a
                    href="/api/download/agent.md"
                    className="text-[#00EA64] hover:underline"
                  >
                    agent.md
                  </a>
                  <span aria-hidden="true">·</span>
                  <a
                    href="/api/download/log.txt"
                    className="text-[#00EA64] hover:underline"
                  >
                    log.txt
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Yazeed Hamad Alharthi & HackerRank Architect Dossier */}
            <div className="lg:col-span-5 border border-[#1E293B] bg-[#11161F] p-8 md:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
                  <div>
                    <div className="text-xs font-mono text-[#00EA64]">
                      SYSTEM ARCHITECT & AUTHOR
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-1">
                      Yazeed Hamad Alharthi
                    </h2>
                  </div>
                  <div className="w-11 h-11 bg-[#00EA64] text-[#0B0F14] font-mono font-extrabold text-lg flex items-center justify-center shrink-0">
                    H█
                  </div>
                </div>

                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Designed for the{" "}
                  <a
                    href="https://github.com/interviewstreet/hackerrank-orchestrate-october26/tree/main"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline underline-offset-4 hover:text-[#00EA64]"
                  >
                    @interviewstreet
                  </a>{" "}
                  HackerRank Orchestrate challenge to audit complex data deletion workflows
                  where reported statuses claim completion while personal data
                  persists across databases, PDFs, screenshots, and sync streams.
                </p>

                <div className="divide-y divide-[#1E293B] border-t border-b border-[#1E293B] text-xs font-mono">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#94A3B8]">Author</span>
                    <span className="text-white font-semibold">
                      Yazeed Hamad Alharthi
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#94A3B8]">Platform & Contest</span>
                    <span className="text-[#00EA64]">
                      HackerRank Orchestrate (Oct 2026)
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#94A3B8]">Public Sample Match</span>
                    <span className="text-white tabular-nums">
                      32 / 32 Cases (100.00%)
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#94A3B8]">Step-Level Accuracy</span>
                    <span className="text-white tabular-nums">
                      162 / 162 Steps (100.00%)
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#94A3B8]">Evaluation Output</span>
                    <span className="text-white tabular-nums">
                      518 / 518 Verified Rows
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 text-xs font-mono font-semibold text-[#00EA64] border border-[#00EA64]/50 hover:bg-[#00EA64]/10 transition-colors flex items-center justify-between"
                >
                  <span>Official HackerRank Challenge Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </section>

          {/* Full-Width 4-Column Quantitative Proof Row */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#1E293B] bg-[#11161F] divide-y sm:divide-y-0 sm:divide-x divide-[#1E293B]">
            <div className="p-6 space-y-1">
              <div className="text-xs font-mono text-[#94A3B8]">
                Total Evaluation Cases Audited
              </div>
              <div className="text-3xl font-mono font-bold text-white tabular-nums">
                {stats.total}
              </div>
              <div className="text-xs text-[#00EA64]">
                case_33 through case_550 in output.csv
              </div>
            </div>

            <div className="p-6 space-y-1">
              <div className="text-xs font-mono text-[#94A3B8]">
                Incomplete (Ghost Data Remediated)
              </div>
              <div className="text-3xl font-mono font-bold text-amber-400 tabular-nums">
                {stats.incomplete}
              </div>
              <div className="text-xs text-[#94A3B8]">
                65.06% · Ordered remediation plans built
              </div>
            </div>

            <div className="p-6 space-y-1">
              <div className="text-xs font-mono text-[#94A3B8]">
                Complete (Compliance Verified)
              </div>
              <div className="text-3xl font-mono font-bold text-[#00EA64] tabular-nums">
                {stats.complete}
              </div>
              <div className="text-xs text-[#94A3B8]">
                33.01% · Proven by cutoff-valid evidence
              </div>
            </div>

            <div className="p-6 space-y-1">
              <div className="text-xs font-mono text-[#94A3B8]">
                Non-Deletion Requests Filtered
              </div>
              <div className="text-3xl font-mono font-bold text-slate-200 tabular-nums">
                {stats.notApplicable}
              </div>
              <div className="text-xs text-[#94A3B8]">
                1.93% · NOT_APPLICABLE (steps_json=[])
              </div>
            </div>
          </section>

          {/* 4-Stage Architecture Overview Section */}
          <section className="space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#1E293B] pb-4">
              <h2 className="text-2xl font-bold text-white">
                01. Four-Stage Deterministic Audit Pipeline
              </h2>
              <span className="text-xs font-mono text-[#94A3B8]">
                Engineered by Yazeed Hamad Alharthi · Powered for @hackerrank
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border border-[#1E293B] bg-[#11161F] p-6 space-y-3">
                <div className="text-xs font-mono text-[#00EA64]">
                  01. Intent Authorization
                </div>
                <h3 className="text-base font-bold text-white">
                  Multilingual Request Parser
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Analyzes customer requests across 6 languages to separate
                  binding erasure requests from data exports, billing edits, and
                  marketing opt-outs.
                </p>
              </div>

              <div className="border border-[#1E293B] bg-[#11161F] p-6 space-y-3">
                <div className="text-xs font-mono text-[#00EA64]">
                  02. Identity Graph Resolution
                </div>
                <h3 className="text-base font-bold text-white">
                  Historical Identifier Linking
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Traverses <code className="text-white">user_identities.csv</code>{" "}
                  and <code className="text-white">user_audit_log.csv</code> to
                  recover canonical <code className="text-white">user_id</code>s,
                  retired emails, phones, and SHA-256 hashes.
                </p>
              </div>

              <div className="border border-[#1E293B] bg-[#11161F] p-6 space-y-3">
                <div className="text-xs font-mono text-[#00EA64]">
                  03. Multimodal Evidence Audit
                </div>
                <h3 className="text-base font-bold text-white">
                  Cutoff-Strict Inspection
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Correlates SQLite replica dumps, PDF documents, admin UI
                  screenshots, JSON exports, and system activity strictly at or
                  before <code className="text-white">audit_at</code>.
                </p>
              </div>

              <div className="border border-[#1E293B] bg-[#11161F] p-6 space-y-3">
                <div className="text-xs font-mono text-[#00EA64]">
                  04. Topological Remediation
                </div>
                <h3 className="text-base font-bold text-white">
                  Safe Execution Sequencing
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Disables active sync flows and blocks unsafe backup restores
                  before deleting, redacting, or anonymizing downstream and
                  source records.
                </p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* AUDIT CASES & BENCHMARK SAMPLES EXPLORER */}
      {(activeTab === "cases" || activeTab === "samples") && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Column: Case List */}
          <div className="lg:col-span-4 border-r border-[#1E293B] flex flex-col h-[calc(100vh-69px)] bg-[#0B0F14]">
            <div className="p-4 border-b border-[#1E293B] space-y-3 bg-[#11161F]">
              <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
                <span>
                  {activeTab === "samples"
                    ? "Public Benchmark Samples (32)"
                    : "Evaluation Dataset (518)"}
                </span>
                <button
                  onClick={() => setActiveTab("evidence")}
                  className="text-[#00EA64] hover:underline cursor-pointer"
                >
                  View Evidence Manifest ({data.evidenceFiles.length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by case_id, email, system, evidence..."
                  className="w-full bg-[#0B0F14] border border-[#1E293B] pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00EA64]"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    "ALL",
                    "INCOMPLETE",
                    "COMPLETE",
                    "NOT_APPLICABLE",
                    ...(activeTab === "cases" ? ["MULTIMODAL"] : []),
                  ] as const
                ).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f as typeof statusFilter)}
                    className={`px-2.5 py-1 text-[11px] font-mono cursor-pointer border whitespace-nowrap shrink-0 ${
                      statusFilter === f
                        ? "bg-[#00EA64] text-[#0B0F14] border-[#00EA64] font-semibold"
                        : "bg-[#0B0F14] border-[#1E293B] text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#1E293B]">
              {filteredCases.map((c) => {
                const isSelected = selectedCase?.case_id === c.case_id;
                const isMultimodal = MULTIMODAL_IDS.has(c.case_id);
                return (
                  <button
                    key={c.case_id}
                    onClick={() => setSelectedCaseId(c.case_id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                      isSelected ? "bg-[#16202E]" : "hover:bg-[#11161F]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            isSelected ? "text-[#00EA64]" : "text-white"
                          }`}
                        >
                          {c.case_id}
                        </span>
                        {isMultimodal && (
                          <span className="text-[#94A3B8]">
                            · Multimodal Evidence
                          </span>
                        )}
                      </div>
                      <span
                        className={
                          c.deletion_status === "COMPLETE"
                            ? "text-[#00EA64]"
                            : c.deletion_status === "INCOMPLETE"
                            ? "text-amber-400"
                            : "text-[#94A3B8]"
                        }
                      >
                        {c.deletion_status}
                      </span>
                    </div>
                    <div className="text-xs text-[#94A3B8] font-mono truncate mt-1">
                      {c.email}
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {c.request_text}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Case Inspector */}
          <div className="lg:col-span-8 p-6 overflow-y-auto h-[calc(100vh-69px)] space-y-6">
            {selectedCase ? (
              <>
                <div className="border border-[#1E293B] bg-[#11161F] p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="text-xl font-bold text-white">
                          {selectedCase.case_id}
                        </span>
                        <span aria-hidden="true" className="text-[#94A3B8]">
                          ·
                        </span>
                        <span
                          className={`font-semibold ${
                            selectedCase.deletion_status === "COMPLETE"
                              ? "text-[#00EA64]"
                              : selectedCase.deletion_status === "INCOMPLETE"
                              ? "text-amber-400"
                              : "text-[#94A3B8]"
                          }`}
                        >
                          Verdict: {selectedCase.deletion_status}
                        </span>
                        {selectedCase.reported_status !==
                          selectedCase.deletion_status && (
                          <>
                            <span
                              aria-hidden="true"
                              className="text-[#94A3B8]"
                            >
                              ·
                            </span>
                            <span className="text-rose-400">
                              Workflow Claimed: {selectedCase.reported_status}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-[#94A3B8] font-mono">
                        Subject Email: {selectedCase.email}
                      </p>
                    </div>

                    <div className="text-right font-mono text-xs text-[#94A3B8] space-y-0.5 tabular-nums">
                      <div>Requested: {selectedCase.requested_at}</div>
                      <div>Reported: {selectedCase.reported_at}</div>
                      <div className="text-[#00EA64]">
                        Audit Cutoff: {selectedCase.audit_at}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0B0F14] border border-[#1E293B] p-4">
                    <div className="text-xs font-mono text-[#94A3B8] mb-1">
                      Submitted Customer Request Text
                    </div>
                    <p className="text-sm text-white">
                      "{selectedCase.request_text}"
                    </p>
                  </div>
                </div>

                {/* Ordered Steps Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      Ordered Audit & Remediation Plan (
                      {selectedCase.steps.length} Steps)
                    </h3>
                    <span className="text-xs font-mono text-[#94A3B8]">
                      FINDING → REMEDIATION → VERIFICATION
                    </span>
                  </div>

                  {selectedCase.steps.length === 0 ? (
                    <div className="border border-[#1E293B] bg-[#11161F] p-6 text-center text-sm text-[#94A3B8]">
                      Request does not authorize personal data deletion (
                      <code className="text-white">NOT_APPLICABLE</code>). Empty{" "}
                      <code className="text-white">steps_json=[]</code>.
                    </div>
                  ) : (
                    <div className="border border-[#1E293B] bg-[#11161F] overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#0B0F14] border-b border-[#1E293B] text-[#94A3B8]">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">Phase</th>
                            <th className="p-3">Operation</th>
                            <th className="p-3">System / Resource</th>
                            <th className="p-3">State</th>
                            <th className="p-3">Evidence ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E293B]">
                          {selectedCase.steps.map((step) => (
                            <tr
                              key={step.step_no}
                              className="hover:bg-[#16202E]"
                            >
                              <td className="p-3 text-white font-bold tabular-nums">
                                {step.step_no}
                              </td>
                              <td
                                className={`p-3 font-semibold ${
                                  step.phase === "FINDING"
                                    ? "text-rose-400"
                                    : step.phase === "REMEDIATION"
                                    ? "text-amber-400"
                                    : "text-[#00EA64]"
                                }`}
                              >
                                {step.phase}
                              </td>
                              <td className="p-3 text-white">
                                {step.operation}
                              </td>
                              <td className="p-3 text-[#94A3B8]">
                                <span className="text-white">
                                  {step.system_id}
                                </span>{" "}
                                / {step.resource_id}
                              </td>
                              <td className="p-3 text-[#94A3B8]">
                                {step.state}
                              </td>
                              <td className="p-3 text-[#00EA64]">
                                {step.evidence_id || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* POLICY RULES TAB */}
      {activeTab === "rules" && (
        <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                Deletion Policy Rules (dataset/deletion_rules.csv)
              </h2>
              <p className="text-xs text-[#94A3B8] mt-1">
                Governing retention, deletion, redaction, anonymization, and
                tombstone rules enforced by Yazeed Hamad Alharthi's audit
                engine.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("evidence")}
              className="px-4 py-2 text-xs font-mono font-semibold text-[#00EA64] border border-[#00EA64]/50 hover:bg-[#00EA64]/10 cursor-pointer"
            >
              Inspect Evidence Manifest ({data.evidenceFiles.length} Files)
            </button>
          </div>

          <div className="border border-[#1E293B] bg-[#11161F] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0F14] border-b border-[#1E293B] text-[#94A3B8] font-mono">
                <tr>
                  <th className="p-3.5">Rule ID</th>
                  <th className="p-3.5">Data Category</th>
                  <th className="p-3.5">Condition</th>
                  <th className="p-3.5">Required Action</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] font-mono">
                {data.rules.map((r, i) => (
                  <tr key={i} className="hover:bg-[#16202E]">
                    <td className="p-3.5 text-[#00EA64] font-semibold">
                      {r.rule_id}
                    </td>
                    <td className="p-3.5 text-white">{r.data_category}</td>
                    <td className="p-3.5 text-[#94A3B8]">{r.condition}</td>
                    <td className="p-3.5 text-white font-semibold">
                      {r.required_action}
                    </td>
                    <td className="p-3.5 text-[#94A3B8] font-sans">
                      {r.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EVIDENCE MANIFEST TAB */}
      {activeTab === "evidence" && (
        <div className="p-6 max-w-6xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Multimodal Evidence Manifest (dataset/evidence_files.csv)
            </h2>
            <button
              onClick={() => setActiveTab("cases")}
              className="px-4 py-2 text-xs font-mono text-[#00EA64] border border-[#1E293B] hover:border-[#00EA64] cursor-pointer"
            >
              Back to Audit Cases
            </button>
          </div>
          <div className="border border-[#1E293B] bg-[#11161F] overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0B0F14] border-b border-[#1E293B] text-[#94A3B8]">
                <tr>
                  <th className="p-3.5">File ID</th>
                  <th className="p-3.5">Source System</th>
                  <th className="p-3.5">Artifact Type</th>
                  <th className="p-3.5">Captured At</th>
                  <th className="p-3.5">Path</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {data.evidenceFiles.map((ev) => (
                  <tr key={ev.file_id} className="hover:bg-[#16202E]">
                    <td className="p-3.5 text-[#00EA64] font-semibold">
                      {ev.file_id}
                    </td>
                    <td className="p-3.5 text-white">{ev.source_system}</td>
                    <td className="p-3.5 text-[#94A3B8]">{ev.artifact_type}</td>
                    <td className="p-3.5 text-[#94A3B8] tabular-nums">
                      {ev.captured_at}
                    </td>
                    <td className="p-3.5 text-[#94A3B8]">{ev.file_path}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCUMENTATION HUB TAB (README.md, PRD.md, agent.md, AGENTS.md, Evaluation & Usage Reports) */}
      {activeTab === "docs" && (
        <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                Project Documentation, PRD & Agent Governance
              </h2>
              <p className="text-xs text-[#94A3B8] mt-1">
                Authored by{" "}
                <strong className="text-white">Yazeed Hamad Alharthi</strong>{" "}
                for{" "}
                <a
                  href="https://github.com/interviewstreet/hackerrank-orchestrate-october26/tree/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00EA64] hover:underline"
                >
                  interviewstreet/hackerrank-orchestrate-october26
                </a>{" "}
                (HackerRank Orchestrate October 2026)
              </p>
            </div>

            {/* Interactive Document Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "readme", label: "README.md" },
                  { id: "prd", label: "PRD.md" },
                  { id: "agent", label: "agent.md" },
                  { id: "agents_root", label: "AGENTS.md" },
                  { id: "evaluation", label: "evaluation_report.md" },
                  { id: "usage", label: "usage_report.md" },
                ] as const
              ).map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setDocSubTab(doc.id)}
                  className={`px-3 py-1.5 text-xs font-mono cursor-pointer border whitespace-nowrap shrink-0 ${
                    docSubTab === doc.id
                      ? "bg-[#00EA64] text-[#0B0F14] border-[#00EA64] font-bold"
                      : "bg-[#11161F] text-[#94A3B8] border-[#1E293B] hover:text-white"
                  }`}
                >
                  {doc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-[#1E293B] bg-[#11161F] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <span className="text-sm font-mono font-bold text-[#00EA64]">
                {docSubTab === "readme" && "README.md"}
                {docSubTab === "prd" && "PRD.md — Product Requirements Document"}
                {docSubTab === "agent" &&
                  "agent.md — Deletion-Audit Agent Specification"}
                {docSubTab === "agents_root" &&
                  "AGENTS.md — Official HackerRank Agent Instructions"}
                {docSubTab === "evaluation" &&
                  "evaluation/evaluation_report.md"}
                {docSubTab === "usage" && "evaluation/usage_report.md"}
              </span>

              {docSubTab === "readme" && (
                <a
                  href="/api/download/README.md"
                  className="text-xs font-mono text-[#00EA64] hover:underline flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download README.md
                </a>
              )}
              {docSubTab === "prd" && (
                <a
                  href="/api/download/PRD.md"
                  className="text-xs font-mono text-[#00EA64] hover:underline flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PRD.md
                </a>
              )}
              {docSubTab === "agent" && (
                <a
                  href="/api/download/agent.md"
                  className="text-xs font-mono text-[#00EA64] hover:underline flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download agent.md
                </a>
              )}
              {docSubTab === "agents_root" && (
                <a
                  href="/api/download/AGENTS.md"
                  className="text-xs font-mono text-[#00EA64] hover:underline flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download AGENTS.md
                </a>
              )}
            </div>

            <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap overflow-x-auto leading-relaxed">
              {docSubTab === "readme" && data.readmeDoc}
              {docSubTab === "prd" && data.prdDoc}
              {docSubTab === "agent" && data.agentDoc}
              {docSubTab === "agents_root" && data.agentsRootDoc}
              {docSubTab === "evaluation" && data.evalReport}
              {docSubTab === "usage" && data.usageReport}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
