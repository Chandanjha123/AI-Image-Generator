// netlify/functions/server.js (or backend/server.js)
import { GoogleGenAI, Modality } from "@google/genai";

export const handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // Handle POST requests to /generate
  if (event.httpMethod === 'POST') {
    try {
      const { prompt, width = 512, height = 512, count = 1 } = JSON.parse(event.body);

      if (!prompt) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: "Prompt is required" })
        };
      }

      // Check for API key
      if (!process.env.GEMINI_API_KEY) {
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: "Server configuration error" })
        };
      }

      // Initialize Gemini AI client
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

        if (response.candidates && response.candidates[0]) {
          const candidate = response.candidates[0];
          
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && part.inlineData.data) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
              }
            }
          }
        }

        if (!imageUrl) {
          return {
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              error: "Failed to generate image",
              details: "No image data received"
            })
          };
        }

        images.push(imageUrl);
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ images })
      };

    } catch (error) {
      console.error("Error generating image:", error);
      
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: "Failed to generate image",
          message: error.message 
        })
      };
    }
  }

  // Handle other HTTP methods
  return {
    statusCode: 405,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: "Method not allowed" })
  };
};