const XLSX = require("xlsx");
const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

function serialToDate(serial) {
  if (!serial || typeof serial !== "number") return null;
  if (serial < 10000) {
    const d = new Date((serial - 1) * 86400000 + new Date(1899, 11, 30).getTime());
    return d.toISOString().split("T")[0];
  }
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000).toISOString().split("T")[0];
}

function parseNum(val) {
  if (!val || val === "" || val === "-") return 0;
  if (["BID", "No Bid", "No BID", "Won", "Lost", "Open", "Canceled"].includes(String(val).trim())) return 0;
  const n = parseFloat(String(val).replace(/[,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parseBool(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s === "yes" || s === "true" || s === "1";
}

function parseDecision(val) {
  if (!val || val === "") return null;
  const s = String(val).trim().replace(/\s+/g, " ");
  const map = {
    "GO FINAL": "GO FINAL", "GO Final": "GO FINAL", "go final": "GO FINAL",
    "GO INITIAL": "GO INITIAL", "go initial": "GO INITIAL",
    "GO without Committee FINAL": "GO without Committee",
    "GO without Committee INITIAL": "GO without Committee",
    "GO without committee FINAL": "GO without Committee",
    "GO without committee INITIAL": "GO without Committee",
    "GO without Committee": "GO without Committee",
    "BID": "BID", "Bid": "BID",
    "BID FINAL": "BID",
    "DIFFERED": "Differed", "Differed": "Differed",
    "No GO": "No GO", "No Go": "No GO", "no go": "No GO",
    "POSTPONED": "Postponed", "PostPoned": "Postponed", "postponed": "Postponed",
    "BACKLOG": "BACKLOG", "Backlog": "BACKLOG",
    "No BID": "No Bid", "No Bid": "No Bid",
    "WITHDRAWN": "WITHDRAWN", "Withdrawn": "WITHDRAWN",
    "CANCELLED": "CANCELLED", "Cancelled": "CANCELLED",
    "GO without Sales": "GO without Sales",
    "Decision reported end of this week": "Differed",
  };
  return map[s] || "GO FINAL";
}

function parseSalesStatus(val) {
  if (!val || val === "" || val === "BID") return null;
  const s = String(val).trim();
  const map = {
    "Won": "Won", "won": "Won", "Won Candidate": "Won",
    "Lost": "Lost", "lost": "Lost",
    "Open": "Open", "open": "Open",
    "Canceled": "Canceled", "canceled": "Canceled",
    "Committed": "Committed", "committed": "Committed",
    "Deferred": "Deferred", "deferred": "Deferred",
    "Revenu 0": "Lost",
    "No bid": "No Bid", "No Bid": "No Bid",
  };
  return map[s] || null;
}

function parseAccountType(val) {
  if (!val || val === "BID") return null;
  const s = String(val).trim();
  if (s.includes("Existing")) return "Existing account";
  if (s.includes("New")) return "New account";
  return null;
}

function parseDealType(val) {
  if (!val || val === "BID" || val === "" || val === "-") return "NA";
  const s = String(val).trim().toLowerCase();
  const map = { "upsell": "upSell", "crosssell": "crossSell", "newaccount": "newAccount", "renewal": "renewal", "hunting": "hunting", "na": "NA" };
  return map[s] || "NA";
}

function parseCommitteeType(val) {
  if (!val) return "Go n Go";
  const s = String(val).trim();
  if (s.toLowerCase().includes("bid")) return "Bid n Bid";
  if (s.toLowerCase().includes("megara")) return "Go n Go";
  return "Go n Go";
}

function cleanText(val) {
  if (!val) return null;
  const s = String(val).trim();
  return s || null;
}

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "compliance_tower",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  });

  try {
    const wb = XLSX.readFile(process.argv[2] || "C:\\Users\\ftekitek\\Downloads\\COMPLIANCE-VEG COMMITTEES AGENDA.xlsx");
    const sheet = wb.Sheets["Compliance VEG Agenda"];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    console.log(`Read ${rows.length} rows from Excel`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const vegId = String(r["VEG ID"] || "").trim();
      if (!vegId || vegId === "BID") { skipped++; continue; }

      const client = String(r["Client"] || "").trim();
      if (!client) { skipped++; continue; }

      const vegDate = serialToDate(r["VEG Date"]);
      if (!vegDate) { skipped++; continue; }

      const decision = parseDecision(r["Decision"]);
      if (!decision) { skipped++; continue; }

      try {
        const result = await pool.query(
          `INSERT INTO veg_deals (
            veg_id, client, opportunity_crm, identifier_number,
            business_owner, region, business_line, products,
            committee_type, veg_date, decision,
            tcv, ip_maintenance, saas, ps,
            wl_ps_md, wl_investment_md, ticket_pp_invest,
            minutes, financials_url, templates_url,
            sales_status, closing_date,
            account_type, deal_type, duration_days,
            tcv_crm, id_check, delta_veg_crm, comments,
            project_name_chronos, chronos_wl_md, turnover_chronos, delta_veg_chronos_md,
            product_abbr, internal_flag, veg_year, duplicate_check
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38)
          ON CONFLICT (veg_id) DO NOTHING`,
          [
            vegId, client,
            cleanText(r["Opportunity (CRM)"]), cleanText(r["Identifier Number"]),
            cleanText(r["Business Owner"]) || "Unknown",
            cleanText(r["Region"]) || "Unknown",
            cleanText(r["Business Line"]) || "Unknown",
            cleanText(r["Products"]) || "Unknown",
            parseCommitteeType(r["Type"]), vegDate, decision,
            parseNum(r["TCV (K\u20AC)"]), parseNum(r["IP+Maintenance (K\u20AC)"]),
            parseNum(r["SaaS (K\u20AC)"]), parseNum(r["PS  VEG K\u20AC"]),
            parseNum(r["WL PS VEG (MD)"]), parseNum(r["WL VEG INVESTMENT (MD)"]),
            cleanText(r["Ticket PP INVEST"]),
            cleanText(r["Minutes"]), cleanText(r["Financials"]), cleanText(r["Templates"]),
            parseSalesStatus(r["Sales status"]),
            serialToDate(r["Closing Date "]),
            parseAccountType(r["__EMPTY"]),
            parseDealType(r["Deal Type"]),
            parseNum(r["Duration"]) || null,
            parseNum(r["TCV CRM"]),
            cleanText(r["ID check"]),
            parseNum(r["DELTA VEG/CRM"]),
            cleanText(r["Comments"]),
            cleanText(r["Project Name Chronos"]),
            parseNum(r["Chronos WL MD"]),
            parseNum(r["Turnover Chronos"]),
            parseNum(r["Delta VEG/Chronos MD"]),
            cleanText(r["a"]),
            parseBool(r["aa"]),
            parseNum(r["Year"]) || parseInt(vegId.split("-")[1]) || 2023,
            parseBool(r["Duplicate Check"]),
          ]
        );
        if (result.rowCount > 0) inserted++; else skipped++;
      } catch (err) {
        errors++;
        if (errors <= 3) console.error(`Row ${i + 2} (${vegId}):`, err.message?.slice(0, 100));
      }
    }

    console.log(`Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}, Total: ${rows.length}`);
    console.log("VEG deals seed complete.");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await pool.end();
  }
}

main();
