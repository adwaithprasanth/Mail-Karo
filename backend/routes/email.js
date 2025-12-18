import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

/**
 * POST /api/generate-email
 * Generates an email using Google Gemini AI based on user prompt
 */
router.post('/generate-email', async (req, res) => {
  try {
    // 1️⃣ API key validation (server-side only)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY missing');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // 2️⃣ Input validation
    const { prompt } = req.body;

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    // 3️⃣ Prompt length guard (VERY IMPORTANT)
    if (prompt.length > 3000) {
      return res.status(413).json({
        success: false,
        error: 'Prompt too long. Please keep it under 3000 characters.'
      });
    }

    // 4️⃣ Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite'
    });

    // Create a more detailed prompt for email generation
    const emailPrompt = `You are an expert email writer. Based on the user's input provided below, craft a professional, well-structured email.

Please analyze the topic/idea and generate a complete email that includes:

1. **Subject Line**: Create an engaging, relevant subject line
2. **Greeting**: Appropriate salutation based on context
3. **Body Content**:
   - Clear introduction establishing purpose
   - Well-organized main points developing the topic
   - Specific details or calls to action where appropriate
   - Professional tone matching the topic's nature
4. **Closing**: Polite conclusion with appropriate sign-off
5. **Sender Information**: Name placeholder and optional position

Key Requirements:
- Adapt writing style to suit the topic (business, informational, promotional, etc.)
- Maintain clarity and conciseness
- Ensure proper email formatting and structure
- Make reasonable assumptions about context where needed
- Keep the email focused and purposeful
- Keep length of email of 200 words and human tone

USER INPUT:
"${prompt}"

Generate the email now:
`.trim();

    // 6️⃣ Generate email
    const result = await model.generateContent(emailPrompt);
    const response = await result.response;
    const generatedEmail = response.text();

    // 7️⃣ Send clean response (no echoing user prompt)
    return res.json({
      success: true,
      email: generatedEmail
    });

  } catch (error) {
    console.error('🔥 Email generation failed:', error);

    // Known Gemini errors
    if (error.message?.includes('API_KEY')) {
      return res.status(401).json({
        success: false,
        error: 'AI service authentication failed'
      });
    }

    if (
      error.message?.includes('quota') ||
      error.message?.includes('rate')
    ) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }

    // Generic fallback (NO internal leak)
    return res.status(500).json({
      success: false,
      error: 'Failed to generate email. Please try again.'
    });
  }
})

export default router;