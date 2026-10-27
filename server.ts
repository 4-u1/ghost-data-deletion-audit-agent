import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSV(content: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const nextCh = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && nextCh === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (ch === "\n" || (ch === "\r" && nextCh === "\n")) {
        if (ch === "\r") i++;
        currentRow.push(currentField);
        if (currentRow.length > 1 || currentRow[0] !== "") {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += ch;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1 || currentRow[0] !== "") {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj;
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/audit-summary", (_req, res) => {
    try {
      const outputRows = parseCSV(
        fs.readFileSync(path.join(__dirname, "output.csv"), "utf-8")
      );
      const requestRows = parseCSV(
        fs.readFileSync(
          path.join(__dirname, "dataset", "deletion_requests.csv"),
          "utf-8"
        )
      );
      const sampleReqRows = parseCSV(
        fs.readFileSync(
          path.join(__dirname, "dataset", "sample_deletion_requests.csv"),
          "utf-8"
        )
      );
      const sampleOutRows = parseCSV(
        fs.readFileSync(
          path.join(__dirname, "dataset", "sample_output.csv"),
          "utf-8"
        )
      );
      const rulesRows = parseCSV(
        fs.readFileSync(
          path.join(__dirname, "dataset", "deletion_rules.csv"),
          "utf-8"
        )
      );
      const evidenceRows = parseCSV(
        fs.readFileSync(
          path.join(__dirname, "dataset", "evidence_files.csv"),
          "utf-8"
        )
      );
      const identitiesRows = parseCSV(
        fs.readFileSync(
          path.join(__dirname, "dataset", "user_identities.csv"),
          "utf-8"
        )
      );

      const reqMap = new Map(requestRows.map((r) => [r.case_id, r]));
      const emailToUser = new Map<string, Record<string, string>>();
      identitiesRows.forEach((u) => {
        emailToUser.set(u.email, u);
      });

      const cases = outputRows.map((out) => {
        const req = reqMap.get(out.case_id) || {};
        let steps: unknown[] = [];
        try {
          steps = JSON.parse(out.steps_json || "[]");
        } catch {
          steps = [];
        }
        return {
          case_id: out.case_id,
          deletion_status: out.deletion_status,
          steps,
          email: req.email || "",
          requested_at: req.requested_at || "",
          reported_status: req.reported_status || "",
          reported_at: req.reported_at || "",
          audit_at: req.audit_at || "",
          request_text: req.request_text || "",
        };
      });

      const sampleReqMap = new Map(sampleReqRows.map((r) => [r.case_id, r]));
      const samples = sampleOutRows.map((out) => {
        const req = sampleReqMap.get(out.case_id) || {};
        let steps: unknown[] = [];
        try {
          steps = JSON.parse(out.steps_json || "[]");
        } catch {
          steps = [];
        }
        return {
          case_id: out.case_id,
          deletion_status: out.deletion_status,
          steps,
          email: req.email || "",
          requested_at: req.requested_at || "",
          reported_status: req.reported_status || "",
          reported_at: req.reported_at || "",
          audit_at: req.audit_at || "",
          request_text: req.request_text || "",
        };
      });

      const evalReport = fs.existsSync(
        path.join(__dirname, "evaluation", "evaluation_report.md")
      )
        ? fs.readFileSync(
            path.join(__dirname, "evaluation", "evaluation_report.md"),
            "utf-8"
          )
        : "";
      const usageReport = fs.existsSync(
        path.join(__dirname, "evaluation", "usage_report.md")
      )
        ? fs.readFileSync(
            path.join(__dirname, "evaluation", "usage_report.md"),
            "utf-8"
          )
        : "";
      const readmeDoc = fs.existsSync(path.join(__dirname, "README.md"))
        ? fs.readFileSync(path.join(__dirname, "README.md"), "utf-8")
        : "";
      const prdDoc = fs.existsSync(path.join(__dirname, "PRD.md"))
        ? fs.readFileSync(path.join(__dirname, "PRD.md"), "utf-8")
        : "";
      const agentDoc = fs.existsSync(path.join(__dirname, "agent.md"))
        ? fs.readFileSync(path.join(__dirname, "agent.md"), "utf-8")
        : "";
      const agentsRootDoc = fs.existsSync(path.join(__dirname, "AGENTS.md"))
        ? fs.readFileSync(path.join(__dirname, "AGENTS.md"), "utf-8")
        : "";

      res.json({
        cases,
        samples,
        rules: rulesRows,
        evidenceFiles: evidenceRows,
        evalReport,
        usageReport,
        readmeDoc,
        prdDoc,
        agentDoc,
        agentsRootDoc,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "Failed to load audit data",
      });
    }
  });

  app.get("/api/download/output.csv", (_req, res) => {
    const filePath = path.join(__dirname, "output.csv");
    res.download(filePath, "output.csv");
  });

  app.get("/api/download/code.zip", (_req, res) => {
    const filePath = path.join(__dirname, "code.zip");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "code.zip");
    } else {
      res.status(404).send("code.zip not found");
    }
  });

  app.get("/api/download/log.txt", (_req, res) => {
    const filePath = path.join(__dirname, "log.txt");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "log.txt");
    } else {
      res.status(404).send("log.txt not found");
    }
  });

  app.get("/api/download/README.md", (_req, res) => {
    const filePath = path.join(__dirname, "README.md");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "README.md");
    } else {
      res.status(404).send("README.md not found");
    }
  });

  app.get("/api/download/PRD.md", (_req, res) => {
    const filePath = path.join(__dirname, "PRD.md");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "PRD.md");
    } else {
      res.status(404).send("PRD.md not found");
    }
  });

  app.get("/api/download/agent.md", (_req, res) => {
    const filePath = path.join(__dirname, "agent.md");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "agent.md");
    } else {
      res.status(404).send("agent.md not found");
    }
  });

  app.get("/api/download/AGENTS.md", (_req, res) => {
    const filePath = path.join(__dirname, "AGENTS.md");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "AGENTS.md");
    } else {
      res.status(404).send("AGENTS.md not found");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
