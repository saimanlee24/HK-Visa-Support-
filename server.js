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

// NEW: Welcome route for the main homepage
app.get("/", (req, res) => {
  res.json({ 
    message: "Welcome to HK Visa Support API",
    status: "Live and accepting USDC payments on Base Mainnet",
    testEndpoint: "/api/immigration-check/Canada",
    contact: "65808748"
  });
});

// Protected paid route
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`REAL MONEY gateway running on port ${PORT}`));
