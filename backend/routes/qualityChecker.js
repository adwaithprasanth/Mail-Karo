import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

router.post('/quality-check', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json(fallbackReport("Server config error"));
    }

    const { email, checkType = "normal" } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
      return res.json(fallbackReport("Email content missing"));
    }

    if (email.length > 6000) {
      return res.json(fallbackReport("Email too long"));
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite'
    });

    // 🔥 MODE-WISE STRICT PROMPT
    const prompt = `
You are an Email Quality Assurance system.

Checking Mode: ${checkType}

Return ONLY valid JSON. No markdown. No text outside JSON.

Schema:
{
  "score": number,
  "severity": "Low" | "Medium" | "High",
  "summary": string,
  "grammar": string,
  "clarity": string,
  "tone": string,
  "risk": string,
  "suggestions": string,
  "improvedEmail": string
}

Mode rules:
- normal: grammar + clarity only
- medium: tone + professionalism + risk
- advanced: deep risk + rewrite full improved email

Rules:
- All keys MUST exist
- score between 0–100
- If not advanced, improvedEmail MUST be empty string

EMAIL:
"""${email}"""
`.trim();

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    let parsed;
    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");
      parsed = JSON.parse(match[0]);
    } catch (e) {
      console.error("❌ Gemini JSON error:", rawText);
      return res.json(fallbackReport("AI response issue"));
    }

    // 🔒 HARD NORMALIZATION (NO MISSING KEYS)
    const score = Number(parsed.score) || 0;

    return res.json({
      score,

      // 🔥 SEVERITY AUTO-FIX (CRITICAL)
      severity:
        parsed.severity ||
        (score >= 80 ? "Low" : score >= 60 ? "Medium" : "High"),

      summary: parsed.summary || "No summary provided.",
      grammar: parsed.grammar || "N/A",
      clarity: parsed.clarity || "N/A",
      tone: parsed.tone || "N/A",
      risk: parsed.risk || "N/A",
      suggestions: parsed.suggestions || "",
      improvedEmail:
        checkType === "advanced" ? parsed.improvedEmail || "" : ""
    });

  } catch (err) {
    console.error("🔥 Quality check failed:", err);
    return res.json(fallbackReport("Unexpected error"));
  }
});

function fallbackReport(reason) {
  return {
    score: 0,
    severity: "High",
    summary: `Unable to analyze email (${reason}).`,
    grammar: "N/A",
    clarity: "N/A",
    tone: "N/A",
    risk: "N/A",
    suggestions: "",
    improvedEmail: ""
  };
}

export default router;
