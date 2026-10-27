<div align="center">

# agent.md — Deletion-Audit Agent Specification & Governance Contract
### HackerRank Orchestrate (October 2026) — Ghost Data Still Exists

[![HackerRank](https://img.shields.io/badge/Platform-interviewstreet%2Fhackerrank--orchestrate--october26-00EA64?style=for-the-badge&logo=hackerrank&logoColor=black)](https://github.com/interviewstreet/hackerrank-orchestrate-october26/tree/main)
[![Author](https://img.shields.io/badge/Lead%20Engineer-Yazeed%20Hamad%20Alharthi-0A66C2?style=for-the-badge&logo=github&logoColor=white)](#agent-identity--ownership)
[![Contract](https://img.shields.io/badge/Contract-AGENTS.md%20Compliant-10B981?style=for-the-badge)](#1-agent-contract--mission)

</div>

---

## Agent Identity & Ownership

| Attribute | Value |
| :--- | :--- |
| **Agent Name** | Ghost Data Still Exists — Deterministic Deletion-Audit Agent |
| **Author & Principal Architect** | **Yazeed Hamad Alharthi** |
| **Host Competition & Repo** | [interviewstreet/hackerrank-orchestrate-october26](https://github.com/interviewstreet/hackerrank-orchestrate-october26/tree/main) — **HackerRank Orchestrate (October 2026)** |
| **Official Challenge URL** | [https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists](https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists) |
| **Primary Entry Point** | `code/main.py` |
| **Companion Specification** | [`AGENTS.md`](./AGENTS.md) · [`PRD.md`](./PRD.md) · [`README.md`](./README.md) |

---

## 1. Agent Contract & Mission

This `agent.md` document defines both the operational architecture of the **Ghost Data Still Exists** deletion-audit agent engineered by **Yazeed Hamad Alharthi** and the full [interviewstreet/hackerrank-orchestrate-october26](https://github.com/interviewstreet/hackerrank-orchestrate-october26/tree/main) **AGENTS.md** governance specification.

For every request in `dataset/deletion_requests.csv` (`518 evaluation cases`) and `dataset/sample_deletion_requests.csv` (`32 public benchmark cases`), the agent executes a four-stage deterministic pipeline:

1. **Multilingual Request Intent Verification**:
   - Inspects `request_text` across English, Spanish, French, German, Portuguese, and Arabic.
   - Requests for data export, billing/address updates, read-only access, or marketing unsubscription are classified as `NOT_APPLICABLE` with `steps_json=[]`.
2. **Historical Identity Graph Resolution**:
   - Traverses `dataset/user_identities.csv` and `dataset/user_audit_log.csv` to bind current or historical email addresses to the canonical `user_id` and collect all historical emails, phone numbers, names, and SHA-256 email hashes.
3. **Cutoff-Filtered Multimodal Evidence & Activity Correlation (`timestamp <= audit_at`)**:
   - Evaluates `dataset/system_activity.csv` and `dataset/evidence/` (`databases/*.sql`, `documents/*.pdf`, `images/*.png`, `logs/*.log`, `records/*.json`, `records/*.txt`).
   - Treats workflow claims (`reported_status`) as untrusted until proven by grounded evidence captured at or before `audit_at`.
4. **Policy Enforcement & Ordered Remediation Planning (`dataset/deletion_rules.csv`)**:
   - Enforces `DELETE`, `REDACT`, `ANONYMIZE`, `RETAIN`, and `ACCOUNT_TOMBSTONE` policies.
   - Emits consecutive steps (`step_no = 1..N`) ordered strictly by phase: `FINDING` → `REMEDIATION` → `VERIFICATION`.

---

## 2. Allowed Operations & States

### 2.1 Findings (`phase = "FINDING"`)
| Operation | State | Grounded `evidence_id` | Description |
| :--- | :--- | :--- | :--- |
| `REPORT_REMAINING_RECORD` | `PRESENT` | Required (`file_id` / `activity_id` / `audit_id`) | A record that policy requires to be deleted still exists at `audit_at`. |
| `REPORT_EXPOSED_PII` | `PRESENT` | Required | A record remains with unredacted or unanonymized personal identifiers. |
| `REPORT_ACTIVE_DATA_FLOW` | `ACTIVE` | Required | An active sync or replication pipeline can recreate deleted data. |
| `REPORT_RESTORE_RISK` | `ACTIVE` | Required | An unblocked backup or snapshot restore path can bring deleted data back. |

### 2.2 Remediation (`phase = "REMEDIATION"`)
| Operation | State | `evidence_id` | Execution Order |
| :--- | :--- | :--- | :--- |
| `DISABLE_DATA_FLOW` | `DISABLED` | `""` | **Step Priority 1**: Stop active sync/replication flows first. |
| `BLOCK_RESTORE` | `BLOCKED` | `""` | **Step Priority 2**: Quarantine/block unsafe backup restores before record changes. |
| `DELETE_RECORD` | `ABSENT` | `""` | **Step Priority 3**: Remove downstream copies before upstream source records. |
| `REDACT_RECORD` | `REDACTED` | `""` | **Step Priority 3**: Strip direct PII while preserving tombstone or order shell. |
| `ANONYMIZE_RECORD` | `ANONYMIZED` | `""` | **Step Priority 3**: Irreversibly unlink analytics records from the user. |

### 2.3 Verification (`phase = "VERIFICATION"`)
| Operation | State | `evidence_id` | Description |
| :--- | :--- | :--- | :--- |
| `VERIFY_DATA_FLOW_DISABLED` | `DISABLED` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm that the synchronization flow is inactive. |
| `VERIFY_RESTORE_BLOCKED` | `BLOCKED` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm that backup restoration is blocked. |
| `VERIFY_RECORD_ABSENT` | `ABSENT` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm that a prohibited record no longer exists. |
| `VERIFY_RECORD_REDACTED` | `REDACTED` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm that direct PII fields were removed (`ACCOUNT_TOMBSTONE` / `REDACT`). |
| `VERIFY_RECORD_ANONYMIZED` | `ANONYMIZED` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm that analytics telemetry is unlinked from the subject. |
| `VERIFY_RECORD_PRESENT` | `PRESENT` | Grounded if `COMPLETE`, `""` if `INCOMPLETE` | Confirm that policy-mandated retained records (`tax_service`, `fraud_service`, `legal_service`) remain intact. |

---

## 3. Coding Agent Session & Turn Logging Protocol (`log.txt`)

In compliance with [`AGENTS.md`](./AGENTS.md):
- Every coding session appends a `SESSION START` entry and a per-turn summary entry to `log.txt` at the repository root.
- Every entry includes exact `tool=Google AI Studio Build` and `model=models/gemini-4-argon` identifiers.
- No secrets, API keys, credentials, or raw personal data are ever written to `log.txt` or `code.zip`.

---

## 4. Verification & Submission Summary

- **Public Sample Benchmark (`32 cases`)**: `32 / 32 (100.00%)` exact match on `deletion_status` and `steps_json`.
- **Full Evaluation Dataset (`518 cases`)**: `518 / 518` valid predictions written to `output.csv` (`337 INCOMPLETE`, `171 COMPLETE`, `10 NOT_APPLICABLE`).
- **Official Submission URL**:
  https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists
