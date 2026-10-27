<div align="center">

# Product Requirements Document (PRD)
## Ghost Data Still Exists — AI-Powered Deletion-Audit & Remediation Engine

[![HackerRank](https://img.shields.io/badge/Challenge-%40hackerrank%20Orchestrate-00EA64?style=for-the-badge&logo=hackerrank&logoColor=white)](https://github.com/hackerrank)
[![Author](https://img.shields.io/badge/Author-Yazeed%20Hamad%20Alharthi-0A66C2?style=for-the-badge&logo=github&logoColor=white)](#document-control--ownership)
[![Status](https://img.shields.io/badge/Status-Production%20Ready%20%28v1.0%29-10B981?style=for-the-badge)](#1-executive-summary)
[![Accuracy](https://img.shields.io/badge/Sample%20Accuracy-32%2F32%20%28100%25%29-6366F1?style=for-the-badge)](#8-success-metrics--kpis)

</div>

---

## Document Control & Ownership

| Field | Details |
| :--- | :--- |
| **Product Title** | Ghost Data Still Exists — Autonomous Deletion-Audit & Remediation Engine |
| **Author / Lead Architect** | **Yazeed Hamad Alharthi** |
| **Organization / Event** | [@hackerrank](https://github.com/hackerrank) — **HackerRank Orchestrate (October 2026)** |
| **Official Challenge URL** | [https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists](https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists) |
| **Document Version** | `v1.0.0` (Final Submission Release) |
| **Last Updated** | October 27, 2026 |
| **Target Scale** | 518 Evaluation Audit Cases + 32 Public Benchmark Cases + 88 Multimodal Evidence Artifacts |

---

## 1. Executive Summary

Modern commerce platforms operate across dozens of distributed data stores: primary transactional databases, regional read replicas, search indexes, data warehouses, CRM pipelines, object storage exports, support ticketing systems, and cold disaster-recovery backups. When a customer submits a **Right to Erasure (GDPR Art. 17 / CCPA / PDPL)** request, internal orchestration workflows frequently report `COMPLETE` even while residual personal identifiable information (**"Ghost Data"**) persists in downstream replicas, support PDFs, screenshots, or active synchronization pipelines that can silently repopulate deleted records.

Designed and engineered by **Yazeed Hamad Alharthi** for the [@hackerrank](https://github.com/hackerrank) **Orchestrate (October 2026)** challenge, **Ghost Data Still Exists** is a deterministic, evidence-grounded deletion-audit engine and interactive compliance platform. Rather than trusting workflow status claims (`reported_status`), the system:

1. **Verifies Deletion Authorization** across multilingual customer requests (`EN`, `ES`, `FR`, `DE`, `PT`, `AR`).
2. **Reconstructs Historical Identity Graphs** (`user_id`, current/historical emails, phones, names, and SHA-256 hashes).
3. **Inspects Multimodal Evidence & Activity Streams** strictly at or before each case's `audit_at` cutoff timestamp.
4. **Enforces Granular Data Governance Policies** (`DELETE`, `REDACT`, `ANONYMIZE`, `RETAIN`, and `ACCOUNT_TOMBSTONE`).
5. **Produces Dependency-Safe Remediation & Verification Plans** (`FINDING` → `REMEDIATION` → `VERIFICATION`).

---

## 2. Problem Statement & Core Challenges

| Challenge Dimension | Real-World Failure Mode | Product Requirement |
| :--- | :--- | :--- |
| **Unreliable Workflow Claims** | Orchestrators mark requests `COMPLETE` while downstream jobs fail or skip records. | Treat `reported_status` and `reported_result` as untrusted claims; establish truth strictly from grounded evidence. |
| **Identity Drift** | Users change email addresses, phone numbers, or legal names prior to requesting deletion. | Traverse `user_identities.csv` and `user_audit_log.csv` to link every historical identifier to a canonical `user_id`. |
| **Active Recreation & Restore Risks** | Nightly ETL syncs, CDC streams, or unblocked backups overwrite deletions and resurrect PII. | Identify active flows (`REPORT_ACTIVE_DATA_FLOW`) and restore paths (`REPORT_RESTORE_RISK`) and disable/block them *before* deleting downstream records. |
| **Complex Retention & Tombstone Policies** | Deleting tax invoices or fraud holds violates legal retention rules; keeping full user profiles violates privacy. | Apply `deletion_rules.csv` per category: preserve `RETAIN` records, strip PII on `ACCOUNT_TOMBSTONE` / `REDACT` records, and unlink `ANONYMIZE` records. |
| **Strict Temporal Boundaries** | Evidence or events generated *after* `audit_at` can contaminate historical audit verdicts. | Enforce a strict temporal filter (`timestamp <= audit_at`) on all activity logs and evidence captures. |

---

## 3. Product Goals & Non-Goals

### 3.1 Goals
- **100% Deterministic Reproducibility**: Zero hallucinated steps, deterministic JSON key serialization, and identical outputs across clean runs on Linux, macOS, and Windows.
- **Multimodal Evidence Grounding**: Native ingestion of SQLite snapshot dumps (`.sql`), PDF documents (`.pdf`), application screenshots (`.png`), server logs (`.log`), and structured records (`.json`, `.txt`).
- **Safe Remediation Sequencing**: Enforce strict topological ordering—disable active sync flows and block unsafe backup restores first, remediate downstream copies before upstream sources, and conclude with targeted verification steps.
- **Interactive Audit Visibility**: Provide a full-stack React 19 + Express compliance dashboard on port `3000` for inspecting all 518 evaluation cases, 32 benchmark samples, policy rules, and evidence manifests.

### 3.2 Non-Goals
- Modifying or mutating the raw participant dataset under `dataset/`.
- Relying on external third-party APIs or non-deterministic sampling at inference time.

---

## 4. User Personas & Use Cases

1. **Data Privacy & Compliance Auditor (DPO)**
   - *Need*: Verify whether a specific customer's deletion request (`case_id`) is genuinely complete at `audit_at` and obtain an auditable evidence trail.
2. **Site Reliability / Data Platform Engineer**
   - *Need*: Execute a safe, ordered remediation runbook (`DISABLE_DATA_FLOW` → `BLOCK_RESTORE` → `DELETE_RECORD` / `REDACT_RECORD` / `ANONYMIZE_RECORD`) without triggering replication race conditions.
3. **Automated Evaluation Grader ([@hackerrank](https://github.com/hackerrank))**
   - *Need*: Consume a spec-compliant `output.csv` containing all 518 predictions with exact schema conformance (`case_id,deletion_status,steps_json`).

---

## 5. System Architecture & Data Pipeline

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│                   GHOST DATA STILL EXISTS — SYSTEM ARCHITECTURE               │
│                         Lead Architect: Yazeed Hamad Alharthi                 │
└───────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────┐       ┌────────────────────────────────────────┐
  │   deletion_requests.csv  │──────▶│ 1. Multilingual Intent Classifier      │
  │      (518 Requests)      │       │    • Authorizes Deletion vs.           │
  └──────────────────────────┘       │      Access / Export / Opt-out / Edit  │
                                     └───────────────────┬────────────────────┘
                                                         │ Authorized
                                                         ▼
  ┌──────────────────────────┐       ┌────────────────────────────────────────┐
  │   user_identities.csv    │──────▶│ 2. Historical Identity Graph Resolver  │
  │   user_audit_log.csv     │       │    • Maps Email -> Canonical user_id   │
  └──────────────────────────┘       │    • Collects Old Emails, Phones, SHA  │
                                     └───────────────────┬────────────────────┘
                                                         │ Identity Footprint
                                                         ▼
  ┌──────────────────────────┐       ┌────────────────────────────────────────┐
  │   evidence_files.csv     │──────▶│ 3. Multimodal Evidence & Temporal      │
  │   system_activity.csv    │       │    Correlation Engine (t <= audit_at)  │
  │   evidence/              │       │    • SQLite Replicas (.sql)            │
  │    ├─ databases/*.sql    │       │    • Support & Finance PDFs (.pdf)     │
  │    ├─ documents/*.pdf    │       │    • Admin UI Screenshots (.png OCR)   │
  │    ├─ images/*.png       │       │    • System Logs & JSON (.log, .json)  │
  │    └─ logs/ & records/   │       └───────────────────┬────────────────────┘
  └──────────────────────────┘                           │ Grounded Resource State
                                                         ▼
  ┌──────────────────────────┐       ┌────────────────────────────────────────┐
  │   deletion_rules.csv     │──────▶│ 4. Policy & Remediation Planner        │
  │   (Governance Rules)     │       │    • Phase 1: FINDING (with evidence)  │
  └──────────────────────────┘       │    • Phase 2: REMEDIATION (ordered)    │
                                     │    • Phase 3: VERIFICATION (checks)    │
                                     └───────────────────┬────────────────────┘
                                                         │
                         ┌───────────────────────────────┴────────────────────┐
                         ▼                                                    ▼
        ┌─────────────────────────────────┐                  ┌─────────────────────────────────┐
        │   output.csv & code.zip         │                  │   React 19 + Express Dashboard  │
        │   (518 Evaluation Rows)         │                  │   (Interactive Case Explorer)   │
        └─────────────────────────────────┘                  └─────────────────────────────────┘
```

---

## 6. Functional Requirements (FR)

### FR-1: Request Authorization & Intent Classification
- **Description**: Parse `request_text` across multiple languages (`English`, `Spanish`, `French`, `German`, `Portuguese`, `Arabic`) to determine whether the user is requesting account/personal data erasure.
- **Acceptance Criteria**:
  - Requests exclusively asking for data export/portability, billing address correction, password reset, marketing email unsubscription, or read-only access must return `deletion_status = NOT_APPLICABLE` and `steps_json = []`.
  - Requests authorizing erasure proceed to identity resolution.

### FR-2: Historical Identity Graph Reconstruction
- **Description**: Resolve the request `email` against both `user_identities.csv` (current snapshot) and `user_audit_log.csv` (historical mutations).
- **Acceptance Criteria**:
  - Recover the canonical `user_id` even when the request is submitted using a retired historical email address.
  - Aggregate all historical emails, phone numbers, full names, and `email_hash` values associated with that `user_id` at or before `audit_at`.

### FR-3: Cutoff-Aware Evidence & Activity Correlation
- **Description**: Evaluate `system_activity.csv` and all 88 files in `dataset/evidence/` (`captured_at <= audit_at`).
- **Acceptance Criteria**:
  - Ignore any activity event or evidence file captured after `audit_at`.
  - Correlate `data_catalog` resource links, SQLite primary/regional/reporting replica tables, PDF text layers, OCR-extracted screenshot fields, JSON exports, and application logs to the subject's identity graph.

### FR-4: Policy Rule Enforcement (`deletion_rules.csv`)
- **Description**: Map each discovered resource and system to its governing policy action:
  - `ACCOUNT_TOMBSTONE`: Retain `user_id` in `account_service` while redacting direct PII (`name`, `email`, `phone`, `email_hash`).
  - `DELETE`: Completely purge records in `crm_service`, `search_service`, `support_service`, `export_service`, `session_service`, `marketing_service`, and replica databases.
  - `REDACT`: Strip PII from `order_service`, `payment_service`, and `audit_log_service` records while keeping transactional integrity.
  - `ANONYMIZE`: Irreversibly unlink `analytics_service` behavioral telemetry from the user.
  - `RETAIN`: Preserve legally mandated records (`tax_service` invoices, `fraud_service` security holds, `legal_service` active holds) and verify their presence (`VERIFY_RECORD_PRESENT`).

### FR-5: Dependency-Ordered Step Generation
- **Description**: Construct `steps_json` with consecutive `step_no` starting at `1`, strictly ordered by phase (`FINDING` → `REMEDIATION` → `VERIFICATION`).
- **Acceptance Criteria**:
  - **COMPLETE Cases**: Emit only `VERIFICATION` steps, each citing the proving `evidence_id` (`file_id`, `activity_id`, or `audit_id`).
  - **INCOMPLETE Cases**:
    1. Emit `FINDING` steps (`REPORT_ACTIVE_DATA_FLOW`, `REPORT_RESTORE_RISK`, `REPORT_REMAINING_RECORD`, `REPORT_EXPOSED_PII`) with grounded `evidence_id`.
    2. Emit `REMEDIATION` steps (`DISABLE_DATA_FLOW` → `BLOCK_RESTORE` → downstream/source `DELETE_RECORD`, `REDACT_RECORD`, `ANONYMIZE_RECORD`) with `evidence_id: ""`.
    3. Emit matching post-remediation `VERIFICATION` steps (`VERIFY_DATA_FLOW_DISABLED`, `VERIFY_RESTORE_BLOCKED`, `VERIFY_RECORD_ABSENT`, `VERIFY_RECORD_REDACTED`, `VERIFY_RECORD_ANONYMIZED`, `VERIFY_RECORD_PRESENT`) with `evidence_id: ""`.

---

## 7. Non-Functional Requirements (NFR)

- **Performance**: Full batch execution across all 518 evaluation cases and 32 sample cases completes in **< 2.0 seconds** on standard CPU hardware with zero external network calls.
- **Security & Privacy**: Zero hardcoded secrets, API keys, or real personal data; full compliance with `AGENTS.md` logging redaction standards.
- **Portability**: Self-contained Python 3 standard-library execution (`code/main.py`) paired with a TypeScript/React/Express web visualizer.

---

## 8. Success Metrics & KPIs

| Metric | Target | Achieved Result |
| :--- | :--- | :--- |
| **Public Sample Case-Level Status Accuracy** | `100.0%` | **32 / 32 (100.00%)** |
| **Public Sample Step-Level & Field-Level Accuracy** | `100.0%` | **162 / 162 Steps (100.00%)** |
| **Public Sample Exact Sequence Match** | `100.0%` | **32 / 32 (100.00%)** |
| **Custom Participant Evaluation Cases** | `>= 3 Cases` | **5 / 5 (100.00%)** |
| **Evaluation Dataset Completeness (`output.csv`)** | `518 Rows` | **518 / 518 Valid Rows (`337 INCOMPLETE`, `171 COMPLETE`, `10 NOT_APPLICABLE`)** |
