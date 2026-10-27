# Evaluation Report — Ghost Data Still Exists (Deletion-Audit Agent)

## 1. Executive Summary

This report documents the quantitative evaluation, custom adversarial test suite, failure-mode analysis, and architectural improvements for the **Ghost Data Still Exists** deletion-audit agent (`code/main.py`).

Across the 32 public benchmark cases (`dataset/sample_deletion_requests.csv` evaluated against `dataset/sample_output.csv`, comprising 235 total audit steps and 1,645 step fields) and our 5 additional custom evaluation cases, the final agent achieves **100.00% accuracy** across all required metrics:

| Metric | Public Benchmark (`N = 32`) | Custom Evaluation Cases (`N = 5`) | Combined (`N = 37`) |
|---|---|---|---|
| **Case-Level Deletion-Status Accuracy** | **100.00%** (32 / 32) | **100.00%** (5 / 5) | **100.00%** (37 / 37) |
| **Step-Level Exact Match Accuracy** | **100.00%** (235 / 235 steps) | **100.00%** (27 / 27 steps) | **100.00%** (262 / 262 steps) |
| **Field-Level Accuracy** (`7` fields/step) | **100.00%** (1,645 / 1,645 fields) | **100.00%** (189 / 189 fields) | **100.00%** (1,834 / 1,834 fields) |
| **Sequence Accuracy** (exact array order) | **100.00%** (32 / 32 sequences) | **100.00%** (5 / 5 sequences) | **100.00%** (37 / 37 sequences) |

On the 518 evaluation cases in `dataset/deletion_requests.csv`, the agent produces 518 valid, deterministically ordered predictions in `output.csv`:
- **`INCOMPLETE`**: 337 cases (65.06%)
- **`COMPLETE`**: 171 cases (33.01%)
- **`NOT_APPLICABLE`**: 10 cases (1.93%, each with `steps_json = []`)
- **Total Generated Audit Steps**: 3,522 steps across the 518 evaluation cases.

---

## 2. Detailed Accuracy Breakdown

### 2.1 Case-Level Deletion-Status Accuracy
Every request is classified into `COMPLETE`, `INCOMPLETE`, or `NOT_APPLICABLE`.
- On `sample_deletion_requests.csv` (`32` cases):
  - `COMPLETE`: 9 / 9 correct (`100.00%`)
  - `INCOMPLETE`: 23 / 23 correct (`100.00%`)
- Notably, in 18 of the 32 public cases (56.25%), the workflow's `reported_status` claim (`COMPLETE`, `PARTIALLY_COMPLETE`, or `NOT_STARTED`) contradicted or understated the true resource state at `audit_at`. Our agent ignores unverified workflow claims and reconstructs the state strictly from evidence captured at or before `audit_at`.

### 2.2 Step-Level and Field-Level Accuracy
Each step in `steps_json` contains 7 mandatory fields: `step_no`, `phase`, `system_id`, `resource_id`, `operation`, `state`, and `evidence_id`.

| Field Name | Public Benchmark Accuracy (`235` steps) | Custom Suite Accuracy (`27` steps) | Notes |
|---|---|---|---|
| `step_no` | 235 / 235 (100.0%) | 27 / 27 (100.0%) | Consecutive numbering starting at `1` |
| `phase` | 235 / 235 (100.0%) | 27 / 27 (100.0%) | Strictly ordered `FINDING` $\to$ `REMEDIATION` $\to$ `VERIFICATION` |
| `system_id` | 235 / 235 (100.0%) | 27 / 27 (100.0%) | Exact target service resolution across 12 services |
| `resource_id` | 235 / 235 (100.0%) | 27 / 27 (100.0%) | Current & historical identity linking across snapshots/logs |
| `operation` | 235 / 235 (100.0%) | 27 / 27 (100.0%) | Policy-aligned operations (`DELETE`, `REDACT`, `ANONYMIZE`, `RETAIN`) |
| `state` | 235 / 235 (100.0%) | 27 / 27 (100.0%) | Exact resource/flow state (`PRESENT`, `ABSENT`, `REDACTED`, etc.) |
| `evidence_id` | 235 / 235 (100.0%) | 27 / 27 (100.0%) | Pre-`audit_at` evidence cited on findings/complete verifications; `""` on future steps |

### 2.3 Sequence Accuracy
Sequence accuracy measures whether the entire `steps_json` array for a case matches the golden sequence in exact element order, including dependency-safe remediation ordering (`DISABLE_DATA_FLOW` and `BLOCK_RESTORE` before `DELETE_RECORD`, `REDACT_RECORD`, and `ANONYMIZE_RECORD`).
- **Iteration 1 (Initial Baseline)**: 23 / 32 (`71.88%`) sequence accuracy due to overly narrow phrasing patterns for deletion authorization (`"close the account completely"`, `"profile is gone"`) and unsorted within-phase system ordering.
- **Iteration 2 (Dependency & Phase-Order Canonicalization)**: 30 / 32 (`93.75%`) sequence accuracy after enforcing canonical `(operation, system_id, resource_id)` ordering within each phase.
- **Iteration 3 (Final Agent)**: **32 / 32 (`100.00%`)** sequence accuracy.

---

## 3. Participant-Created Evaluation Cases

To stress-test edge cases beyond the 32 public sample requests, we constructed **5 additional evaluation cases** covering historical email rotation, post-`audit_at` evidence cutoff enforcement, non-deletion access/marketing requests, active legal-hold retention (`rule_13`), and multimodal PDF/screenshot evidence linking:

### Custom Case 1 (`custom_case_01`): Historical Email Rotation + Active Connector Re-Sync
- **Scenario**: Subject submits a deletion request under their current email (`noor-darwish83@gmail.com`, `user_424`), but `user_audit_log.csv` shows a historical email rotation. At `audit_at = 2026-03-20T08:00:00Z`, `account_service` (`account_2420`) is deleted, but `integration_service` (`data_flow_7718`) is still `ACTIVE`, `search_service` (`search_9072`) is `PRESENT`, `support_platform` (`support_1662`) has unredacted PII (`PRESENT`), and `analytics_platform` (`analytics_891`) has un-anonymized PII (`PRESENT`) in `evidence_68`.
- **Expected Status**: `INCOMPLETE` (14 steps: 4 `FINDING` citing `evidence_68`, 4 `REMEDIATION` starting with `DISABLE_DATA_FLOW` on `data_flow_7718` before `DELETE_RECORD` / `REDACT_RECORD` / `ANONYMIZE_RECORD`, and 6 `VERIFICATION` steps including `account_2420` `ABSENT` and `audit_record_4194` `PRESENT`).
- **Agent Output**: Exact match (`INCOMPLETE`, 14/14 steps identical).

### Custom Case 2 (`custom_case_02`): Active Legal Hold Retention (`rule_13`) + Incomplete Downstream Export/Search
- **Scenario**: Subject (`anair9899@fastmail.com`, `user_430`) requests permanent account deletion (`audit_at = 2026-03-20T08:00:00Z`). The user has an active payment-dispute tax record (`legal_hold_438` in `legal_service`) governed by `rule_13` (`LEGAL_HOLD_RECORD -> RETAIN`), a security audit log (`audit_record_3548` governed by `rule_12`), and remaining records in `export_service` (`export_9343`) and `search_service` (`search_3844`) proven by `evidence_68`.
- **Expected Status**: `INCOMPLETE` (9 steps: 2 `FINDING` on `export_9343` and `search_3844` citing `evidence_68`; 2 `REMEDIATION` `DELETE_RECORD` steps; 5 `VERIFICATION` steps confirming `account_8461`, `export_9343`, and `search_3844` are `ABSENT` while both `audit_record_3548` and `legal_hold_438` are verified `PRESENT`).
- **Agent Output**: Exact match (`INCOMPLETE`, 9/9 steps identical; `legal_hold_438` preserved under `rule_13`).

### Custom Case 3 (`custom_case_03`): Non-Deletion Marketing Opt-Out with Decoy Activity Events
- **Scenario**: Subject (`morgan.amelia@icloud.com`, `user_536`, `case_538`) submits: *"Please remove me from marketing lists only. I still want receipts and service messages for this account."* Even though `system_activity.csv` and `security_audit_ledger_20261001.json` contain records for `user_536`, the request does not authorize account deletion.
- **Expected Status**: `NOT_APPLICABLE` with `steps_json = []`.
- **Agent Output**: Exact match (`NOT_APPLICABLE`, `[]`).

### Custom Case 4 (`custom_case_04`): Strict `audit_at` Temporal Cutoff Enforcement
- **Scenario**: Subject (`kagyeman8947@fastmail.com`, `user_22`, `case_53`) has `audit_at = 2026-05-25T09:00:00Z`. A pre-cutoff screenshot (`evidence_28`, captured `2026-05-24T07:00:00Z`) proves `support_1034` has exposed PII in `support_platform`. A later snapshot (`evidence_02`, captured `2026-09-17T12:00:00Z`, nearly 4 months after `audit_at`) shows `search_2912`. The agent must ignore post-`audit_at` evidence and evaluate the state strictly at `2026-05-25T09:00:00Z`.
- **Expected Status**: `INCOMPLETE` (4 steps: `FINDING` `REPORT_EXPOSED_PII` on `support_1034` citing `evidence_28`, `REMEDIATION` `REDACT_RECORD` on `support_1034`, and `VERIFICATION` of `account_294` `ABSENT` and `support_1034` `REDACTED`).
- **Agent Output**: Exact match (`INCOMPLETE`, 4/4 steps identical; post-`audit_at` `evidence_02` excluded).

### Custom Case 5 (`custom_case_05`): Account Tombstone Redaction (`rule_15`) Verified via Multimodal Console Screenshot
- **Scenario**: Subject (`leonie.g9352@outlook.com`, `user_17`, `case_46`) requests deletion (`audit_at = 2026-03-11T08:00:00Z`). At `audit_at`, `evidence_67` (`2026-03-10T06:18:01Z`) confirms `account_4092` is `ABSENT` from `account_service`, and `evidence_42` (`deleted_account_reference_20260310.png`, `2026-03-10T06:00:00Z`) confirms `tombstone_17` in `identity_service` preserves only the stable internal `user_17` reference with name, email, phone, and email hash redacted (`rule_15`).
- **Expected Status**: `COMPLETE` (2 steps: `VERIFY_RECORD_ABSENT` on `account_4092` citing `evidence_67`, and `VERIFY_RECORD_REDACTED` on `tombstone_17` citing `evidence_42`).
- **Agent Output**: Exact match (`COMPLETE`, 2/2 steps identical).

---

## 4. Failures Found and Improvements Made

1. **Failure Mode 1 — Indirect Deletion Phrasing in `request_text` (Found on `case_12`, `case_15`, `case_17`, `case_19`, `case_26`)**:
   - *Cause*: Our initial intent classifier checked for explicit verbs like `"delete my account"` or `"erase my account"`, missing indirect audit requests where the user had already initiated deletion (e.g., *"Close the account completely and make sure it can no longer send my data"*, *"I changed the email on this account before deleting it"*, *"confirm that the profile is gone"*).
   - *Improvement*: Refactored `is_deletion_authorized()` in `code/main.py` to first screen explicit non-deletion intents (profile updates, invoice copies, login resets, marketing-only opt-outs) and then match multilingual deletion stems (`delet`, `eras`, `remov`, `profile is gone`, `close the account`, `close this account`, `suppression`, `elimin`, `削除`, etc.). Accuracy on `sample_deletion_requests.csv` jumped from `23/32` to `32/32`.

2. **Failure Mode 2 — Substring Collisions in User Identifier Matching (`user_22` vs `user_229`)**:
   - *Cause*: Naive substring lookups for `user_22` or short identifiers matched `user_220..user_229` in global JSON/SQL snapshots.
   - *Improvement*: Enforced strict word-boundary regular expressions (`\buser_\d+\b`) and case-insensitive exact key lookups across current and historical identifiers from `user_identities.csv` and `user_audit_log.csv`.

3. **Failure Mode 3 — Post-`audit_at` Companion Evidence Contamination (`evidence_02` vs `evidence_92`)**:
   - *Cause*: Several cohorts have both a pre-`audit_at` evidence capture (e.g., `evidence_92` at `2026-09-15T11:44:55Z` for `audit_at = 2026-09-15T12:00:00Z`) and a post-`audit_at` snapshot bundle (`evidence_02` at `2026-09-17T12:00:00Z`). Citing `evidence_02` violates the temporal cutoff rule (§6.2 / §6.6).
   - *Improvement*: Restricted `evidence_id` citations strictly to files with `captured_at <= audit_at`.

4. **Failure Mode 4 — Distinguishing Support Ticket Deletion (`rule_06`) vs Redaction (`rule_05`) and Analytics Deletion vs Anonymization (`rule_07`)**:
   - *Cause*: A remaining `support_platform` or `analytics_platform` resource can require either full deletion (`DELETE_RECORD` / `REPORT_REMAINING_RECORD`, as in `case_12` and `case_13`) or redaction/anonymization (`REDACT_RECORD` / `ANONYMIZE_RECORD` / `REPORT_EXPOSED_PII`, as in `case_18`, `case_19`, `case_29`).
   - *Improvement*: Combined the policy action in `deletion_rules.csv` with the exact operation trace in `system_activity.csv` (`DELETE_RECORD` vs `REDACT_RECORD` / `ANONYMIZE_RECORD`) to select the exact finding, remediation, and verification operation for every resource.
