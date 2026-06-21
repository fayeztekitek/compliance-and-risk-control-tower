import fs from "fs";
import path from "path";

// Relative paths inside the active shell workspace
const codePath = "./tmp/crunch.py";
const codeContent = fs.readFileSync(codePath, "utf-8");

// Extract the triple quoted string containing CSV data
const startMarker = 'data = """';
const endMarker = '"""';

const startIndex = codeContent.indexOf(startMarker);
if (startIndex === -1) {
  console.error("Could not find start of CSV data in crunch.py");
  process.exit(1);
}

const dataPart = codeContent.substring(startIndex + startMarker.length);
const endIndex = dataPart.indexOf(endMarker);
if (endIndex === -1) {
  console.error("Could not find end of CSV data in crunch.py");
  process.exit(1);
}

const csvData = dataPart.substring(0, endIndex).trim();

// Custom parser to handle quotes, multiline cells, and comma delimiters safely
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let curr = "";
  let insideQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        curr += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      row.push(curr);
      curr = "";
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF
      }
      row.push(curr);
      lines.push(row);
      row = [];
      curr = "";
    } else {
      curr += char;
    }
  }
  if (curr !== "" || row.length > 0) {
    row.push(curr);
    lines.push(row);
  }
  return lines;
}

const records = parseCSV(csvData);
const headers = records[0].map(h => h.trim());

console.log("Found CSV headers:", headers);
console.log(`Parsed ${records.length - 1} data rows.`);

function cleanNumber(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

const parsedDeals = records.slice(1).map((row, index) => {
  if (row.length < 11) return null;
  
  const id = row[0]?.trim() || `REAL-VEG-${index}`;
  const client = row[1]?.trim() || "Unknown Client";
  const rawTitle = row[2]?.trim() || "";
  const title = rawTitle.replace(/\n/g, " ").replace(/\s+/g, " ").substring(0, 100) || `${client} Deal ${id}`;
  const identifierNumber = row[3]?.trim() || "";
  const owner = row[4]?.trim() || "Fayez Tekitek";
  const region = row[5]?.trim() || "EU";
  const businessLine = row[6]?.trim() || "General";
  const products = row[7]?.trim() || "Product suite";
  const dealTypeStr = row[8]?.trim() || "Go n Go";
  const vegDate = row[9]?.trim() || "";
  const rawDecision = row[10]?.trim() || "";
  
  const tcvK = cleanNumber(row[11]);
  const ipMaintenanceK = cleanNumber(row[12]);
  const saasK = cleanNumber(row[13]);
  const psVegK = cleanNumber(row[14]);
  const workloadMD = cleanNumber(row[15]) || 350;
  const wlVegInvestmentMD = cleanNumber(row[16]);
  
  const salesStatusStr = row[21]?.trim() || "Open";
  const comment = row[29]?.trim() || "";
  
  let status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CONTRACT_SIGNATURE" = "SUBMITTED";
  if (salesStatusStr.toLowerCase().includes("won candidate")) {
    status = "APPROVED";
  } else if (salesStatusStr.toLowerCase().includes("won")) {
    status = "CONTRACT_SIGNATURE";
  } else if (salesStatusStr.toLowerCase().includes("canceled") || rawDecision.toLowerCase().includes("no go")) {
    status = "REJECTED";
  } else if (salesStatusStr.toLowerCase().includes("open") || !salesStatusStr) {
    status = "SUBMITTED";
  }

  let financeState: "PENDING" | "APPROVED" | "REJECTED" = "APPROVED";
  let salesState: "PENDING" | "APPROVED" | "REJECTED" = "APPROVED";
  let productState: "PENDING" | "APPROVED" | "REJECTED" = "APPROVED";
  let legalState: "PENDING" | "APPROVED" | "REJECTED" = "APPROVED";

  const decisionClean = rawDecision.toUpperCase();
  let goNoGoDecision: "GO" | "NO_GO" | "PENDING" = "PENDING";
  let bidDecision: "BID" | "NO_BID" | "PENDING" = "PENDING";

  if (decisionClean.includes("GO")) {
    goNoGoDecision = decisionClean.includes("NO") ? "NO_GO" : "GO";
    bidDecision = "BID";
  } else if (decisionClean.includes("BID")) {
    bidDecision = "BID";
  } else if (decisionClean.includes("NO BID") || decisionClean.includes("NO GO")) {
    goNoGoDecision = "NO_GO";
    bidDecision = "NO_BID";
  }

  const marginEstimate = tcvK > 0 ? Math.round(( (tcvK - psVegK) / tcvK ) * 100) || 75 : 75;

  return {
    id,
    title,
    type: dealTypeStr.toLowerCase().includes("bid") ? "BID_COMMITTEE_OVERSIGHT" : "RFP",
    status,
    client,
    marginEstimate: marginEstimate > 100 || marginEstimate < 0 ? 40 : marginEstimate,
    workloadMD: workloadMD || 200,
    financeState,
    salesState,
    productState,
    legalState,
    owner,
    date: vegDate ? new Date(vegDate).toISOString().split("T")[0] : "2026-06-01",
    // Extended properties
    region,
    businessLine,
    products,
    dealTypeStr,
    tcvK,
    ipMaintenanceK,
    saasK,
    psVegK,
    wlVegInvestmentMD,
    rawDecision,
    salesStatusStr,
    comment
  };
}).filter(x => x !== null);

const tsOutput = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VEGRequest } from "./types";

export interface RealVEGRequest extends VEGRequest {
  region?: string;
  businessLine?: string;
  products?: string;
  dealTypeStr?: string;
  tcvK?: number;
  ipMaintenanceK?: number;
  saasK?: number;
  psVegK?: number;
  wlVegInvestmentMD?: number;
  rawDecision?: string;
  salesStatusStr?: string;
  comment?: string;
}

export const REAL_VEG_REQUESTS: RealVEGRequest[] = ${JSON.stringify(parsedDeals, null, 2)};
`;

fs.writeFileSync("./src/realVegRequests.ts", tsOutput, "utf-8");
console.log("Successfully wrote ./src/realVegRequests.ts with real deals!");
