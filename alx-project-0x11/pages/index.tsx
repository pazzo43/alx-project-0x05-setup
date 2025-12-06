cp -r alx-project-0x10 alx-project-0x11
cd alx-project-0x11

// pages/index.tsx
import ImageCard from "@/components/common/ImageCard";
import { ImageProps } from "@/interfaces";
import React, { useState } from "react";

const Home: React.FC = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  // State to store the history of generated images
  const [generatedImages, setGeneratedImages] = useState<ImageProps[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null);


  const handleGenerateImage = async () => {
    // 1. Validation and State Reset
    if (prompt.trim() === "" || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(""); 
    
    try {
        const resp = await fetch('/api/generate-image', {
          method: 'POST',
          body: JSON.stringify({
            prompt: prompt.trim()
          }),
          headers: {
            'Content-type': 'application/json'
          }
        })


        if (!resp.ok) {
          const errorData = await resp.json();
          throw new Error(errorData.error || `Generation failed with status ${resp.status}`);
        }

        const data = await resp.json()
        
        // 2. SUCCESS: Update the main image view
        // Note: We use data.imageUrl here based on the success handling in Task 3
        const newImageUrl = data?.imageUrl || data?.message; 
        
        if (!newImageUrl) {
             throw new Error("Received empty image URL from API.");
        }
        
        setImageUrl(newImageUrl);
        
        // 3. TRACK HISTORY: Add the new image to the beginning of the history array
        setGeneratedImages((prev) => [{ imageUrl: newImageUrl, prompt: prompt.trim() }, ...prev]);
        
        setPrompt(""); // Clear input on success

    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
        console.error("Client error:", err);
    } finally {
        setIsLoading(false);
    }
  };
  
  // Action handler to display a history image in the main view
  const handleImageAction = (url: string) => {
    setImageUrl(url); 
    // Optionally update prompt to match history item, but for now, just change image.
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

        {/* Current Image Display */}
        {imageUrl && (
            <div className="w-full max-w-lg">
                <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">Latest/Selected Generation:</h2>
                <ImageCard 
                    action={() => handleImageAction(imageUrl)} // Pass the function to the card
                    imageUrl={imageUrl} 
                    prompt={prompt} 
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
                    // Clicking a thumbnail sets it as the main image (imageUrl)
                    action={() => handleImageAction(image.imageUrl)} 
                    imageUrl={image.imageUrl}
                    prompt={image.prompt}
                    key={index} // Use index as key for now, will use a unique ID in future
                    width="w-full"
                    // Added h-full to make card height consistent in the grid
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
Save all files (ensure your API Key is still correct in .env.local).

Run: npm run dev -- -p 3000

Open http://localhost:3000.

Generate Image 1: Enter a prompt (e.g., "A purple dragon") and click Generate Image. The image appears at the top.

Generate Image 2: Enter a second prompt (e.g., "A spaceship on Mars") and click Generate Image. The new image appears at the top, and the first image appears in the new Generated Images History section below.

Test History: Click the thumbnail of the first generated image in the history gallery. The large image view at the top should update to display the selected thumbnail, demonstrating that the action prop is correctly setting the imageUrl state.

