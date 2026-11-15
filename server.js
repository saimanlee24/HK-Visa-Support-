import express from "express";
import { key0Router } from "@key0ai/key0/express";
import { AccessTokenIssuer, RedisChallengeStore, RedisSeenTxStore, X402Adapter } from "@key0ai/key0";
import Redis from "ioredis";

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serves the beautiful HTML website

const adapter = new X402Adapter({ network: "mainnet" });
const redisUrl = "rediss://default:gQAAAAAAAxg0AAIgcDE5YzA0OTZkYjA1Y2Q0ODM0OGE3MDg5NmJjYTMwNTY1Mg@grown-mastiff-202804.upstash.io:6379";
const redis = new Redis(redisUrl);
const tokenIssuer = new AccessTokenIssuer("simon-super-secret-key-1234567890-abcdef");

const key0 = key0Router({
  config: {
    agentName: "HK Visa Support API",
    agentUrl: "https://hk-visa-support.onrender.com", 
    providerName: "Simon Immigration Services",
    walletAddress: "0xEb70F3Ce1fD900589Ac5332eEe8dF71Be7d5eEcB",
    network: "mainnet",
    routes: [
      { 
        routeId: "immigration-check", 
        method: "GET", 
        path: "/api/immigration-check/:country", 
        unitAmount: "$0.50" 
      },
      { 
        routeId: "document-checklist", 
        method: "GET", 
        path: "/api/document-checklist/:country", 
        unitAmount: "$1.00" 
      },
      { 
        routeId: "visa-fees", 
        method: "GET", 
        path: "/api/visa-fees/:country/:nationality", 
        unitAmount: "$1.50" 
      }
    ],
    fetchResourceCredentials: async (params) =>
      tokenIssuer.sign(
        { sub: params.requestId, jti: params.challengeId, routeId: params.routeId },
        3600,
      ),
  },
  adapter,
  store: new RedisChallengeStore({ redis }),
  seenTxStore: new RedisSeenTxStore({ redis }),
});

app.use(key0);

// 1. Welcome route for the main homepage
app.get("/", (req, res) => {
  res.json({ 
    message: "Welcome to HK Visa Support API",
    status: "Live and accepting USDC payments on Base Mainnet",
    testEndpoints: [
      "/api/immigration-check/Canada",
      "/api/document-checklist/USA",
      "/api/visa-fees/UK/Bangladeshi"
    ],
    contact: "65808748"
  });
});

// 2. Protected paid route: Immigration Check ($0.50)
app.get("/api/immigration-check/:country", key0.payPerRequest("immigration-check"), (req, res) => {
  const payment = req.key0Payment; 
  res.json({ 
    country: req.params.country, 
    status: "Success: Payment Verified on Base Mainnet",
    txHash: payment?.txHash,
    data: "Visa processing time: 14 days. Documents required: Passport, Bank Statement, Invitation Letter.",
    contact: "65808748"
  });
});

// 3. Protected paid route: Document Checklist ($1.00)
app.get("/api/document-checklist/:country", key0.payPerRequest("document-checklist"), (req, res) => {
  const payment = req.key0Payment;
  const country = req.params.country;
  const checklists = {
    "Canada": ["Valid Passport (6+ months)", "Bank Statement (last 6 months)", "Invitation Letter", "Travel Itinerary", "Passport Photo"],
    "USA": ["DS-160 Confirmation", "Valid Passport", "Visa Fee Receipt", "Photo 2x2 inches", "Employment Letter"],
    "UK": ["Valid Passport", "TB Test Certificate", "Financial Proof", "Accommodation Details", "Travel History"],
    "Australia": ["Valid Passport", "Health Insurance", "Character Certificate", "Financial Capacity", "GTE Statement"]
  };
  res.json({
    country: country,
    documents: checklists[country] || ["Valid Passport", "Bank Statement", "Travel Itinerary"],
    txHash: payment?.txHash
  });
});

// 4. Protected paid route: Visa Fees Calculator ($1.50)
app.get("/api/visa-fees/:country/:nationality", key0.payPerRequest("visa-fees"), (req, res) => {
  const payment = req.key0Payment;
  const { country, nationality } = req.params;
  res.json({
    country: country,
    applicant_nationality: nationality,
    base_fee: "$150 USD",
    service_fee: "$75 USD",
    total: "$225 USD",
    processing_days: 14,
    txHash: payment?.txHash
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`REAL MONEY gateway running on port ${PORT}`));
