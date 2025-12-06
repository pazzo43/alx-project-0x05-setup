cp -r alx-project-0x11 alx-project-0x12
cd alx-project-0x12

mkdir -p hooks
touch hooks/useFetchData.ts

// hooks/useFetchData.ts
import { ImageProps, RequestProps } from "@/interfaces";
import { useState } from "react";
import { RequestBody } from "next-api-middleware"; // Using RequestBody for type clarity, but RequestProps works for this project

// Interface for the return value of the hook (for better typing in Home.tsx)
interface FetchHookResult<T> {
    isLoading: boolean;
    responseData: T | null;
    error: string | null;
    generatedImages: ImageProps[];
    // The fetchData function is generic, accepting the endpoint URL and the request body (R)
    fetchData: (endpoint: string, body: RequestBody) => void;
}

// Custom hook definition using Generics
// T: Type of the successful API response data
// R: Type of the request body (input data)
const useFetchData = <T, R extends RequestProps>(): FetchHookResult<T> => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseData, setResponseData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<ImageProps[]>([]);

  // The core function that performs the asynchronous API call
  const fetchData = async (endpoint: string, body: R) => {
    setIsLoading(true);
    setError(null);
    setResponseData(null); // Clear previous response data

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await resp.json();

      if (!resp.ok)
      {
        // Handle errors from the API route (e.g., 400 or 500 status)
        throw new Error(result.error || 'Failed to fetch data');
      }

      setResponseData(result);
      
      // Update the history array with the new image. 
      // We assume 'result.imageUrl' or 'result.message' contains the image URL.
      const newImageUrl = result?.imageUrl || result?.message; 
      
      if (newImageUrl) {
        setGeneratedImages((prev) => [{ imageUrl: newImageUrl, prompt: body?.prompt }, ...prev]);
      }
      
    } catch (err) {
      setError((err as Error).message)
      setResponseData(null);
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    responseData,
    error,
    fetchData,
    generatedImages
  }
}

export default useFetchData;

// pages/index.tsx
import ImageCard from "@/components/common/ImageCard";
import useFetchData from "@/hooks/useFetchData";
import { ImageProps, RequestProps } from "@/interfaces";
import React, { useEffect, useState } from "react";

// Define the expected response type from the /api/generate-image endpoint
interface ImageResponse {
    message?: string; // Used by the RapidAPI example response
    imageUrl?: string; // Used by the simplified response structure
    prompt: string;
}


const Home: React.FC = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  
  // 1. USE THE CUSTOM HOOK: De-structure the logic and state we need
  const { 
    isLoading, 
    responseData, 
    generatedImages, 
    error, // Destructure the error state now
    fetchData 
  } = useFetchData<ImageResponse, RequestProps>();

  // 2. SIMPLIFIED HANDLER: Just calls the hook's function with the required parameters
  const handleGenerateImage =  () => {
    if (prompt.trim() === "") return;
    
    // Call the generic fetchData function, passing the endpoint and the required body
    fetchData('/api/generate-image', { prompt: prompt.trim() });
    
    // Note: We intentionally don't clear the prompt here yet, as the prompt is used
    // in the ImageCard render below. The prompt state is for the input field.
  }

  // 3. EFFECT FOR UPDATING MAIN IMAGE DISPLAY: Runs when the API successfully returns data
  useEffect(() => {
    if (responseData && !isLoading) {
      // Prioritize the correct 'imageUrl', fall back to 'message' if using RapidAPI's specific response field
      const url = responseData.imageUrl || responseData.message; 
      if (url) {
        setImageUrl(url);
        // We can now clear the input prompt, since the history has recorded the successful prompt
        // setPrompt(""); 
      }
    }
  }, [responseData, isLoading]);
  
  // Action handler to display a history image in the main view
  const handleImageAction = (url: string) => {
    setImageUrl(url); 
    // Find the prompt associated with this URL in history (optional, for completeness)
    const selectedImage = generatedImages.find(img => img.imageUrl === url);
    if (selectedImage) {
      // Update prompt state to show the correct prompt for the selected image
      // We'll set the prompt state to the selected prompt, but not display it in the input field
      // setPrompt(selectedImage.prompt);
    }
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
            {isLoading ? "Loading..." : "Generate Image"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
            <div className="mt-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg w-full max-w-lg" role="alert">
                <span className="font-medium">Error:</span> {error}
            </div>
        )}

        {/* Current Image Display: Use the component's internal imageUrl state */}
        {imageUrl && (
            <div className="w-full max-w-lg">
                <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">Latest/Selected Generation:</h2>
                <ImageCard 
                    action={() => handleImageAction(imageUrl)} 
                    imageUrl={imageUrl} 
                    prompt={responseData?.prompt || "..."} // Use responseData's prompt if available
                />
            </div>
        )}
      </div>
      
      {/* ----------------- GENERATED IMAGES HISTORY (GALLERY) ----------------- */}
      {
        generatedImages.length > 0 && (
          <div className="w-full mt-10">
            <h3 className="text-3xl text-center font-bold mb-6 text-gray-800">Generated Images History</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 border border-gray-300 bg-white rounded-xl shadow-inner max-w-7xl mx-auto overflow-y-scroll h-96">
              {generatedImages.map(
                (image: ImageProps, index) => (
                  <ImageCard
                    action={() => handleImageAction(image.imageUrl)}
                    imageUrl={image.imageUrl}
                    prompt={image.prompt}
                    key={index}
                    width="w-full"
                    height="h-full"
                  />
                )
              )}
            </div>
          </div>
        )
      }
    </div>
  );
};

export default Home;

Verification
Save all files.

Run: npm run dev -- -p 3000

Open http://localhost:3000.

Enter a prompt and click Generate Image.

You will observe the exact same behavior as Task 4, but the internal logic of Home.tsx is now much cleaner, demonstrating the power of custom hooks. The fetching, loading, error handling, and history tracking are all contained within useFetchData.ts


