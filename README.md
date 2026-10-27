<div align="center">

# Ghost Data Still Exists
### AI-Powered Deletion-Audit & Remediation Agent — HackerRank Orchestrate (October 2026)

[![HackerRank](https://img.shields.io/badge/Contest-%40hackerrank%20Orchestrate%20Oct%202026-00EA64?style=for-the-badge&logo=hackerrank&logoColor=white)](https://github.com/hackerrank)
[![Author](https://img.shields.io/badge/Engineered%20By-Yazeed%20Hamad%20Alharthi-0A66C2?style=for-the-badge&logo=github&logoColor=white)](#author--attribution)
[![Sample Validation](https://img.shields.io/badge/Sample%20Accuracy-32%2F32%20%28100%25%20Exact%20Match%29-10B981?style=for-the-badge)](#validation--evaluation-results)
[![Evaluation Coverage](https://img.shields.io/badge/Evaluation%20Cases-518%20%2F%20518%20Verified-6366F1?style=for-the-badge)](#evaluation-dataset-breakdown-518-cases)

[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Snapshot%20Engine-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<p align="center">
  <strong>Official Challenge & Submission Portal:</strong><br/>
  <a href="https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists">
    https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists
  </a>
</p>

</div>

---

## Author & Attribution

- **Lead Engineer & System Architect**: **Yazeed Hamad Alharthi**
- **Challenge Organizer**: [@hackerrank](https://github.com/hackerrank) (**HackerRank Orchestrate — October 2026**)
- **Challenge Link**: [https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists](https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists)
- **Core Specifications**:
  - **Product Requirements Document**: [`PRD.md`](./PRD.md) (also embedded in [Section 6](#6-embedded-product-requirements-document-prd) below)
  - **Agent Architecture & Governance**: [`agent.md`](./agent.md) & [`AGENTS.md`](./AGENTS.md)

---

## 1. Overview & Explanation of Work Done

In distributed commerce systems, an automated privacy workflow often reports `COMPLETE` while customer Personal Identifiable Information (**"Ghost Data"**) lingers in read replicas, search indexes, CRM exports, support ticket attachments, analytics tables, or cold backups. Even worse, active synchronization pipelines and unblocked backup restore jobs can silently resurrect deleted records after primary deletion has occurred.

Built by **Yazeed Hamad Alharthi** for the [@hackerrank](https://github.com/hackerrank) **Ghost Data Still Exists** challenge, this repository delivers:

1. **Deterministic Deletion-Audit Engine (`code/main.py`)**:
   - **Multilingual Intent Classification**: Distinguishes genuine deletion authorizations from non-deletion requests (data exports, address updates, marketing opt-outs, account access inquiries) across English, Spanish, French, German, Portuguese, and Arabic (`NOT_APPLICABLE` with `steps_json=[]`).
   - **Historical Identity Graph Resolution**: Links each request's `email` across `dataset/user_identities.csv` and `dataset/user_audit_log.csv` to recover the canonical `user_id` alongside all current and historical emails, phone numbers, names, and SHA-256 email hashes.
   - **Cutoff-Aware Multimodal Evidence Inspection (`timestamp <= audit_at`)**: Evaluates 88 multimodal evidence files (`evidence/databases/*.sql`, `documents/*.pdf`, `images/*.png`, `logs/*.log`, `records/*.json` & `*.txt`) and global system events (`dataset/system_activity.csv`) strictly at or before each case's `audit_at` cutoff.
   - **Policy-Driven Remediation & Verification (`dataset/deletion_rules.csv`)**: Enforces `DELETE`, `REDACT`, `ANONYMIZE`, `RETAIN`, and `ACCOUNT_TOMBSTONE` rules and constructs dependency-safe `FINDING` → `REMEDIATION` → `VERIFICATION` plans.
2. **Interactive Full-Stack Audit Explorer (`server.ts`, `src/App.tsx`)**:
   - A React 19 + Express web application running on port `3000` that visualizes all **518 evaluation cases**, **32 public sample cases**, **deletion policy rules**, **multimodal evidence manifests**, **evaluation/usage reports**, and **PRD/README documentation**, with one-click downloads for `output.csv`, `code.zip`, and `log.txt`.

---

## 2. System Architecture

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│                   GHOST DATA STILL EXISTS — AUDIT PIPELINE                    │
│                      Engineered by Yazeed Hamad Alharthi                      │
└───────────────────────────────────────────────────────────────────────────────┘

  [deletion_requests.csv] ──▶ (1) Multilingual Intent Classifier
                                   ├── Non-Deletion ──▶ NOT_APPLICABLE ([])
                                   └── Authorized   ──▶ (2) Identity Graph Resolver
                                                             │
  [user_identities.csv]   ───────────────────────────────────┤
  [user_audit_log.csv]    ───────────────────────────────────┘
                                                             │
                                                             ▼
  [evidence_files.csv]    ──▶ (3) Multimodal Evidence & Temporal Correlation Engine
  [system_activity.csv]           (Strictly filtered by timestamp <= audit_at)
  [dataset/evidence/*]            ├── SQLite Replicas (.sql)
                                  ├── PDF Documents (.pdf)
                                  ├── Admin UI Screenshots (.png)
                                  └── Logs & JSON Exports (.log, .json, .txt)
                                                             │
                                                             ▼
  [deletion_rules.csv]    ──▶ (4) Policy Engine & Topological Remediation Planner
                                  ├── Phase 1: FINDING (Grounded with evidence_id)
                                  ├── Phase 2: REMEDIATION (Flow/Restore -> Target)
                                  └── Phase 3: VERIFICATION (Compliance checks)
                                                             │
                                                             ▼
                                           [output.csv (518 Evaluation Rows)]
```

---

## 3. Validation & Evaluation Results

### 3.1 Public Benchmark Validation (`dataset/sample_deletion_requests.csv`)

| Metric | Score | Details |
| :--- | :--- | :--- |
| **Case-Level Status Accuracy** | **100.00% (32 / 32)** | Exact match on `COMPLETE`, `INCOMPLETE`, and `NOT_APPLICABLE` |
| **Step-Level Accuracy** | **100.00% (162 / 162)** | Every step matches gold `step_no`, `phase`, `system_id`, `resource_id`, `operation`, `state`, and `evidence_id` |
| **Sequence Accuracy** | **100.00% (32 / 32)** | Exact JSON array equality against `dataset/sample_output.csv` |
| **Custom Participant Test Suite** | **100.00% (5 / 5)** | Verified in `evaluation/evaluation_report.md` |

### 3.2 Evaluation Dataset Breakdown (`518 Cases` in `output.csv`)

| Predicted `deletion_status` | Case Count | Percentage | Description |
| :--- | :---: | :---: | :--- |
| `INCOMPLETE` | **337** | `65.06%` | Ghost data, unredacted PII, active sync flows, or unblocked backup restore paths detected at `audit_at`; full ordered remediation & verification plans generated. |
| `COMPLETE` | **171** | `33.01%` | All required deletions, tombstone redactions, anonymizations, and legal retentions verified with grounded `evidence_id`s at `audit_at`. |
| `NOT_APPLICABLE` | **10** | `1.93%` | Request text asks for export, correction, access, or marketing opt-out rather than personal data erasure (`steps_json=[]`). |
| **Total** | **518** | **100.00%** | `case_33` through `case_550` sorted by `case_id`. |

---

## 4. Repository Structure

```text
.
├── AGENTS.md                        # Official HackerRank Orchestrate agent instructions
├── agent.md                         # Deletion-Audit Agent contract & specification (by Yazeed Hamad Alharthi)
├── PRD.md                           # Product Requirements Document (authored by Yazeed Hamad Alharthi)
├── README.md                        # Project documentation & embedded PRD
├── code/
│   └── main.py                      # Deterministic deletion-audit engine (entry point)
├── evaluation/
│   ├── evaluation_report.md         # Accuracy metrics, 5 custom cases, and failure analysis
│   └── usage_report.md              # Model provider, token usage, and cost breakdown
├── dataset/                         # Participant-facing dataset & multimodal evidence
├── output.csv                       # Final 518-row evaluation submission file
├── code.zip                         # Packaged code + evaluation reports for submission
├── log.txt                          # AGENTS.md compliant session & turn log
├── server.ts                        # Express + Vite server (port 3000)
└── src/
    └── App.tsx                      # Interactive Deletion-Audit Explorer & PRD/README viewer
```

---

## 5. Setup & Execution Instructions

### 5.1 Run the Deletion-Audit Engine (CLI)

Requirements: **Python 3.10+** (uses only the Python standard library; zero external pip packages required to generate `output.csv`).

```bash
# 1. Validate against the 32 public sample cases and generate output.csv for all 518 evaluation cases
python3 code/main.py --validate-samples

# 2. Or run standard prediction generation directly
python3 code/main.py
```

This reads from `dataset/` and writes `output.csv` at the repository root with exact columns `case_id,deletion_status,steps_json`.

### 5.2 Run the Interactive Web Dashboard (Port 3000)

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to explore all 518 evaluation cases, filter by multimodal evidence, inspect policy rules, read the `PRD.md` and `evaluation/` reports, and download `output.csv`, `code.zip`, and `log.txt`.

---

## 6. Embedded Product Requirements Document (PRD)

### 6.1 Product Vision & Scope
- **Product**: Ghost Data Still Exists — Autonomous Deletion-Audit & Remediation Engine
- **Lead Author**: **Yazeed Hamad Alharthi**
- **Challenge Partner**: [@hackerrank](https://github.com/hackerrank) ([HackerRank Orchestrate October 2026](https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists))
- **Core Objective**: Provide provable, deterministic right-to-erasure auditing across polyglot persistence layers without trusting workflow status claims.

### 6.2 Allowed Operations & State Machine Matrix

| Phase | Operation | Target State | Evidence ID Rule | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `FINDING` | `REPORT_REMAINING_RECORD` | `PRESENT` | Required (`file_id` / `activity_id` / `audit_id`) | Record that should have been deleted still exists at `audit_at`. |
| `FINDING` | `REPORT_EXPOSED_PII` | `PRESENT` | Required | Record remains with unredacted/unanonymized PII violating policy. |
| `FINDING` | `REPORT_ACTIVE_DATA_FLOW` | `ACTIVE` | Required | Active sync/replication process can recreate deleted user data. |
| `FINDING` | `REPORT_RESTORE_RISK` | `ACTIVE` | Required | Unblocked backup snapshot can restore deleted user data. |
| `REMEDIATION` | `DISABLE_DATA_FLOW` | `DISABLED` | Empty (`""`) | Halt active sync/ETL process prior to record cleanup. |
| `REMEDIATION` | `BLOCK_RESTORE` | `BLOCKED` | Empty (`""`) | Quarantine/block backup restore path prior to record cleanup. |
| `REMEDIATION` | `DELETE_RECORD` | `ABSENT` | Empty (`""`) | Permanently delete prohibited record. |
| `REMEDIATION` | `REDACT_RECORD` | `REDACTED` | Empty (`""`) | Remove direct PII while preserving tombstone or order shell. |
| `REMEDIATION` | `ANONYMIZE_RECORD` | `ANONYMIZED` | Empty (`""`) | Irreversibly unlink analytics record from subject identity. |
| `VERIFICATION` | `VERIFY_DATA_FLOW_DISABLED` | `DISABLED` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm sync pipeline is disabled. |
| `VERIFICATION` | `VERIFY_RESTORE_BLOCKED` | `BLOCKED` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm backup restore is blocked. |
| `VERIFICATION` | `VERIFY_RECORD_ABSENT` | `ABSENT` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm prohibited record is absent. |
| `VERIFICATION` | `VERIFY_RECORD_REDACTED` | `REDACTED` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm tombstone/retained record has PII stripped. |
| `VERIFICATION` | `VERIFY_RECORD_ANONYMIZED` | `ANONYMIZED` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm analytics record is unlinked. |
| `VERIFICATION` | `VERIFY_RECORD_PRESENT` | `PRESENT` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm legally required tax/fraud/legal-hold record is preserved. |

---

## 7. Official Submission Link

Submit `code.zip`, `output.csv`, and `log.txt` directly on [@hackerrank](https://github.com/hackerrank):

https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists
