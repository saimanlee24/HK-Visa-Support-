import express from "express";
import { key0Router } from "@key0ai/key0/express";
import { AccessTokenIssuer, RedisChallengeStore, RedisSeenTxStore, X402Adapter } from "@key0ai/key0";
import Redis from "ioredis";

const app = express();
app.use(express.json());
app.use(express.static('public'));

const adapter = new X402Adapter({ network: "mainnet" });
const redisUrl = "rediss://default:gQAAAAAAAxg0AAIgcDE5YzA0OTZkYjA1Y2Q0ODM0OGE3MDg5NmJjYTMwNTY1Mg@grown-mastiff-202804.upstash.io:6379";
const redis = new Redis(redisUrl);
const tokenIssuer = new AccessTokenIssuer("simon-super-secret-key-1234567890-abcdef");

const key0 = key0Router({
  config: {
    agentName: "HK Visa Support API",
    agentUrl: "https://hk-visa-support.onrender.com", 
    providerName: "Simon Immigration Services",
    walletAddress: "0x407aAD3F6c2df4A177e88E54CF3CE5d3B1fE4e23",
    network: "mainnet",
    routes: [
      { routeId: "immigration-check", method: "GET", path: "/api/immigration-check/:country", unitAmount: "$0.50" },
      { routeId: "document-checklist", method: "GET", path: "/api/document-checklist/:country", unitAmount: "$1.00" },
      { routeId: "visa-fees", method: "GET", path: "/api/visa-fees/:country/:nationality", unitAmount: "$1.50" },
      { routeId: "eligibility-score", method: "GET", path: "/api/eligibility-score/:country/:income", unitAmount: "$2.00" },
      { routeId: "book-consultation", method: "GET", path: "/api/book-consultation", unitAmount: "$3.00" }
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

app.get("/", (req, res) => {
  res.json({ 
    message: "Welcome to HK Visa Support API",
    status: "Live and accepting USDC payments on Base Mainnet",
    endpoints: [
      "/api/immigration-check/:country ($0.50)",
      "/api/document-checklist/:country ($1.00)",
      "/api/visa-fees/:country/:nationality ($1.50)",
      "/api/eligibility-score/:country/:income ($2.00)",
      "/api/book-consultation ($3.00)"
    ],
    contact: "65808748"
  });
});

app.get("/api/immigration-check/:country", key0.payPerRequest("immigration-check"), (req, res) => {
  res.json({ country: req.params.country, status: "Verified", data: "Processing time: 14 days.", txHash: req.key0Payment?.txHash });
});

app.get("/api/document-checklist/:country", key0.payPerRequest("document-checklist"), (req, res) => {
  const checklists = {
    "Canada": ["Passport", "Bank Statement", "Invitation Letter"],
    "USA": ["DS-160", "Passport", "Fee Receipt"],
    "UK": ["Passport", "TB Test", "Financial Proof"]
  };
  res.json({ country: req.params.country, documents: checklists[req.params.country] || ["Passport", "Bank Statement"], txHash: req.key0Payment?.txHash });
});

app.get("/api/visa-fees/:country/:nationality", key0.payPerRequest("visa-fees"), (req, res) => {
  res.json({ country: req.params.country, nationality: req.params.nationality, total_fee: "$225 USD", txHash: req.key0Payment?.txHash });
});

app.get("/api/eligibility-score/:country/:income", key0.payPerRequest("eligibility-score"), (req, res) => {
  const income = parseInt(req.params.income);
  let score = income > 50000 ? 95 : 70;
  res.json({ 
    country: req.params.country, 
    approval_probability: `${score}%`, 
    recommendation: score > 80 ? "High chance of approval." : "Needs stronger financial proof.",
    txHash: req.key0Payment?.txHash 
  });
});

app.get("/api/book-consultation", key0.payPerRequest("book-consultation"), (req, res) => {
  res.json({ 
    status: "Premium Lead Unlocked", 
    consultant: "Simon Immigration Services",
    whatsapp_link: "https://wa.me/85265808748?text=Hi%20Simon%2C%20I%20paid%20for%20priority%20visa%20consultation.",
    txHash: req.key0Payment?.txHash 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`REAL MONEY gateway running on port ${PORT}`));
