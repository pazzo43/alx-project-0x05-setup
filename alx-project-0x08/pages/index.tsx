cp -r alx-project-0x07 alx-project-0x08
cd alx-project-0x08

mkdir -p components/common
touch components/common/ImageCard.tsx

// interfaces/index.ts
import { ReactNode } from "react";

// The base props for any component that wraps children (used in Layout.tsx)
export interface ReactComponentProps {
  children: ReactNode
}

// Props required for the full ImageCard component
export interface GeneratedImageProps {
  imageUrl: string
  prompt: string
  width?: string // Optional width for responsive styling
  height?: string // Optional height for responsive styling
  action: (imagePath: string) => void // Function to handle clicks (e.g., set for full view)
}

// A utility type that picks only the data fields needed for the image history state
export type ImageProps = Pick<GeneratedImageProps, "imageUrl" | "prompt">

// components/common/ImageCard.tsx
import { GeneratedImageProps } from "@/interfaces";
import React from "react";

const ImageCard: React.FC<GeneratedImageProps> = ({ imageUrl, prompt, width, action }) => {
  return (
    <div onClick={() => action(imageUrl)} className="mt-6 border p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 hover:cursor-pointer bg-white">
      <img 
        src={imageUrl} 
        alt={prompt} 
        // Use Tailwind classes conditionally based on props for styling flexibility
        className={`w-full ${width ? width : 'max-w-md'} rounded-lg`} 
      />
      <h2 className={`${width ? 'text-sm' : 'text-xl'} font-semibold mt-4 text-gray-800`}>Your Prompt:</h2>
      <p className={`${width ? 'text-xs' : 'text-lg'} text-gray-700 mb-2`}>{prompt}</p>
    </div>
  )
}

export default ImageCard;

// pages/index.tsx
import ImageCard from "@/components/common/ImageCard";
import { ImageProps } from "@/interfaces";
import { useState } from "react";
import React from "react"; // Explicit import for React is good practice

const Home: React.FC = () => {
  // 1. STATE FOR USER INPUT
  const [prompt, setPrompt] = useState<string>("");

  // 2. STATE FOR THE CURRENT IMAGE RESULT (for display)
  const [imageUrl, setImageUrl] = useState<string>("");

  // 3. STATE FOR IMAGE HISTORY (Gallery feature)
  const [generatedImages, setGeneratedImages] = useState<ImageProps[]>(
    []
  );

  // 4. STATE FOR API STATUS (Loading indicator)
  const [isLoading, setIsLoading] = useState<boolean>(false)


  const handleGenerateImage = async () => {
    // In later tasks, this will trigger the API call
    console.log("Generating Images with prompt:", prompt);
    
    // For now, let's simulate a generated image (will be replaced by API response)
    if (prompt) {
        setIsLoading(true);
        setTimeout(() => { // Simulate API delay
            const mockUrl = "https://via.placeholder.com/500?text=" + encodeURIComponent(prompt.substring(0, 30));
            setImageUrl(mockUrl);
            // setGeneratedImages(prev => [{ imageUrl: mockUrl, prompt: prompt }, ...prev]);
            setPrompt("");
            setIsLoading(false);
        }, 1500);
    }
  };

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
            onChange={(e) => setPrompt(e.target.value)} // Binds input value to 'prompt' state
            placeholder="Enter your prompt here..."
            className="w-full p-4 border border-gray-300 rounded-lg mb-4 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          />
          <button
            onClick={handleGenerateImage}
            disabled={isLoading || prompt.trim() === ""} // Disable when loading or prompt is empty
            className={`w-full p-4 text-white font-semibold rounded-lg transition duration-300 shadow-md ${
                isLoading || prompt.trim() === "" ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
             {isLoading ? "Generating..." : "Generate Image"}
          </button>
        </div>

        {/* Display the ImageCard if imageUrl state is set */}
        {imageUrl && (
          <div className="w-full max-w-lg">
            <h2 className="text-2xl font-bold mt-8 text-gray-800">Latest Generation:</h2>
            <ImageCard 
              action={() => setImageUrl("")} // Placeholder action: clears the image when clicked
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

State Implementation Rationale:

[prompt, setPrompt]: Creates a controlled input. The value is read from the state, and the onChange event updates the state, ensuring React manages the input field's data.

TypeScript: All state variables are explicitly typed (<string>, <ImageProps[]>, <boolean>), guaranteeing type safety across the component and when updating state.

Loading State: The isLoading state is used to conditionally change the button text and disable the button, preventing multiple API requests while one is pending.

Conditional Rendering: {imageUrl && <ImageCard ... />} is a clean way to render the ImageCard only after an image URL has been successfully generated and set in the state.

5. Verification
After saving the files and running npm run dev -- -p 3000, you can now:

Type a prompt in the input field.

The input field is a controlled component (its value is controlled by the prompt state).

Click "Generate Image" (The button will change to "Generating..." and be disabled for 1.5 seconds).

A placeholder image (with the prompt text) and the ImageCard component will appear below the form, demonstrating successful state management and component usage.

