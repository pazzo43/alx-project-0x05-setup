cp -r alx-project-0x08 alx-project-0x09
cd alx-project-0x09

mkdir -p constants
touch constants/index.ts

// interfaces/index.ts
import { ReactNode } from "react";

export interface ReactComponentProps {
  children: ReactNode
}


export interface GeneratedImageProps {
  imageUrl: string
  prompt: string
  width?: string
  height?: string
  action: (imagePath: string) => void
}

export type RequestProps = {
  prompt: string;
}

export type ImageProps = Pick<GeneratedImageProps, "imageUrl" | "prompt">

// constants/index.ts
export const WIDTH = 512
export const HEIGHT = 512

// pages/api/generate-image.ts
import { HEIGHT, WIDTH } from "@/constants";
import { RequestProps } from "@/interfaces";
import { NextApiRequest, NextApiResponse } from "next"

// --- CRITICAL SECURITY CORRECTION: Use the secure, server-side key ---
const gptApiKey = process.env.GPT_API_KEY; 
const gptUrl = "https://chatgpt-42.p.rapidapi.com/texttoimage"; // RapidAPI URL

const handler = async (request: NextApiRequest, response: NextApiResponse) => {

  if (!gptApiKey || !gptUrl) {
    return response.status(500).json({ error: "API key or URL is missing in environment variables" });
  }
  
  // 1. Validate request method
  if (request.method !== 'POST') {
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt }: RequestProps = request.body;
    
    // 2. Input validation
    if (!prompt) {
        return response.status(400).json({ error: "Prompt is required" });
    }

    // 3. Call the external RapidAPI endpoint
    const res = await fetch(gptUrl, {
      method: "POST",
      body: JSON.stringify({
        text: prompt,
        width: WIDTH,
        height: HEIGHT
      }),
      headers: {
        // Use the secure server-side key
        'x-rapidapi-key': gptApiKey.trim(), 
        'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
    });

    if (!res.ok) {
      // Attempt to read the error message from the API response
      const errorData = await res.json().catch(() => ({}));
      console.error("Failed to fetch from DALLE:", res.status, errorData);
      throw new Error(errorData.message || `Failed to fetch from DALLE (Status: ${res.status})`);
    }

    const data = await res.json();

    // 4. Return the image URL (or a placeholder if missing)
    return response.status(200).json({
      imageUrl: data?.generated_image || "https://via.placeholder.com/600x400?text=Generated+Image+Missing",
      prompt: prompt, // Echo the prompt back for client display
    });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return response.status(500).json({ error: error.message || "Internal server error" });
  }
}

export default handler

// pages/index.tsx
import ImageCard from "@/components/common/ImageCard";
import { useState } from "react";
import React from "react";

const Home: React.FC = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null); // State for error feedback

  const handleGenerateImage = async () => {
    // 1. Basic validation and state reset
    if (prompt.trim() === "" || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setImageUrl(""); // Clear previous image

    try {
        const resp = await fetch('/api/generate-image', {
          method: 'POST',
          body: JSON.stringify({ prompt: prompt.trim() }),
          headers: {
            'Content-type': 'application/json'
          }
        })

        if (!resp.ok) {
          const errorData = await resp.json();
          throw new Error(errorData.error || `Generation failed with status ${resp.status}`);
        }

        const data = await resp.json()
        
        // 2. SUCCESS: Update state with the received image URL
        setImageUrl(data.imageUrl);
        
        // Note: Keeping prompt state here for the ImageCard display, 
        // but clearing it is often desired after success: setPrompt("");

    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
        console.error("Client error:", err);
    } finally {
        setIsLoading(false)
    }
  };
  
  // Placeholder action for ImageCard
  const handleImageAction = () => {
    console.log("Image clicked:", imageUrl);
  }

  return (
    <div className="flex flex-col items-center flex-grow bg-gray-100 p-4">
      <div className="flex flex-col items-center py-12 w-full max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-3 text-gray-800">AI Image Generator</h1>
        <p className="text-lg text-gray-600 mb-8">
          Generate stunning images based on your prompts!
        </p>

        <div className="w-full max-w-lg bg-white p-6 rounded-xl shadow-lg">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            className="w-full p-4 border border-gray-300 rounded-lg mb-4 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            disabled={isLoading}
          />
          <button
            onClick={handleGenerateImage}
            disabled={isLoading || prompt.trim() === ""}
            className={`w-full p-4 text-white font-semibold rounded-lg transition duration-200 shadow-md ${
                isLoading || prompt.trim() === "" ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {
              isLoading ? "Loading..." : "Generate Image"
            }
          </button>
        </div>
        
        {/* Error Display */}
        {error && (
            <div className="mt-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg w-full max-w-lg" role="alert">
                <span className="font-medium">Error:</span> {error}
            </div>
        )}

        {/* Image Display */}
        {imageUrl && (
            <div className="w-full max-w-lg">
                <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">Latest Generation:</h2>
                <ImageCard 
                    action={handleImageAction} 
                    imageUrl={imageUrl} 
                    prompt={prompt} 
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default Home;

Verification
Save all files.

Ensure your GPT_API_KEY is correctly set in .env.local.

Run: npm run dev -- -p 3000

Open http://localhost:3000.

Enter a prompt and click Generate Image. The button will show "Loading..." and, upon success, the generated image will be displayed using the ImageCard component.

