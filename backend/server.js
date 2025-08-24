// server.js (Netlify Functions compatible version)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";
import serverless from "serverless-http";

dotenv.config();

// Check for API key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing! Check your .env file");
  process.exit(1);
}

// Initialize Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS for Netlify
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Allow Netlify domains and local development
    const allowedOrigins = [
      /\.netlify\.app$/,
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:8888' // Netlify dev server
    ];
    
    if (allowedOrigins.some(pattern => {
      if (typeof pattern === 'string') return origin === pattern;
      return pattern.test(origin);
    })) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Generate images endpoint
app.post("/.netlify/functions/server/generate", async (req, res) => {
  const { prompt, width = 512, height = 512, count = 1 } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const images = [];

    for (let i = 0; i < count; i++) {
      const imagePrompt = `${prompt}. Generate as ${width}x${height} pixel image.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: imagePrompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          imageWidth: width,
          imageHeight: height,
        },
      });

      let imageUrl = null;
      let textResponse = "";

      if (response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0];
        
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              textResponse = part.text;
            } else if (part.inlineData && part.inlineData.data) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
      }

      if (!imageUrl) {
        console.error("No image generated. Full response:", JSON.stringify(response, null, 2));
        return res.status(500).json({ 
          error: "Failed to generate image",
          details: textResponse || "No image data received"
        });
      }

      images.push(imageUrl);
    }

    res.json({ images });

  } catch (error) {
    console.error("Error generating image:", error.message);
    res.status(500).json({ 
      error: "Failed to generate image",
      message: error.message 
    });
  }
});

// Test endpoint to verify API connection
app.get("/.netlify/functions/server/test-api", async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: "Test connection - generate a simple red apple image",
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        imageWidth: 256,
        imageHeight: 256,
      },
    });
    
    res.json({ 
      status: "API Connection Successful",
      response: response.candidates ? "Received response" : "No response"
    });
  } catch (error) {
    res.status(500).json({ 
      status: "API Connection Failed",
      error: error.message 
    });
  }
});

// Health check
app.get("/.netlify/functions/server/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    model: "gemini-2.0-flash-preview-image-generation" 
  });
});

app.get("/.netlify/functions/server", (req, res) => {
  res.send("AI Image Generator Backend is running on Netlify!");
});

// Export for Netlify Functions
export const handler = serverless(app);

// Start local server if not in Netlify environment
if (process.env.NETLIFY_DEV !== 'true') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API test: http://localhost:${PORT}/test-api`);
  });
}