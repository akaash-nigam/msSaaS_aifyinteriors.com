import OpenAI from "openai";
import type { DesignGenerationRequest, DesignStyle, RoomType } from "@shared/schema";
import { storage } from "../storage";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY not set. AI features will not work.");
}

export interface GenerationResult {
  generatedImage: string;
  alternativeViews?: string[];
  metadata: {
    generationTime: number;
    dallePrompt: string;
    model: string;
    quality: string;
  };
}

/**
 * Generate AI-powered interior design visualization using DALL-E 3
 */
export async function generateRoomDesign(
  request: DesignGenerationRequest,
  userId: number
): Promise<GenerationResult> {
  const startTime = Date.now();

  // Get style and room type details
  const style = await storage.getDesignStyle(request.styleId);
  const roomType = await storage.getRoomType(request.roomTypeId);

  if (!style || !roomType) {
    throw new Error("Invalid style or room type");
  }

  // Construct DALL-E prompt with smart prompt engineering
  const basePrompt = constructDesignPrompt(style, roomType, request.customPrompt);

  console.log(`🎨 Generating design with DALL-E 3 for user ${userId}`);
  console.log(`📝 Prompt: ${basePrompt.substring(0, 100)}...`);

  try {
    // Call DALL-E 3 for main image
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: basePrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd", // Use HD quality for better interior design results
      response_format: "b64_json",
    });

    const generatedImageBase64 = response.data[0].b64_json;
    if (!generatedImageBase64) {
      throw new Error("DALL-E 3 returned no image data");
    }

    const generatedImageUrl = `data:image/png;base64,${generatedImageBase64}`;

    // Generate alternative views if requested
    let alternativeViews: string[] = [];
    if (request.generateAlternatives) {
      console.log("🔄 Generating alternative views...");
      alternativeViews = await generateAlternativeViews(basePrompt, style, roomType);
    }

    const generationTime = Date.now() - startTime;

    console.log(`✅ Design generated successfully in ${generationTime}ms`);

    return {
      generatedImage: generatedImageUrl,
      alternativeViews,
      metadata: {
        generationTime,
        dallePrompt: basePrompt,
        model: "dall-e-3",
        quality: "hd",
      },
    };
  } catch (error: any) {
    console.error("❌ DALL-E 3 generation failed:", error);
    throw new Error(`AI generation failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * Construct optimized prompt for interior design generation
 */
function constructDesignPrompt(
  style: DesignStyle,
  roomType: RoomType,
  customPrompt?: string
): string {
  // Base prompt structure for professional interior design
  let prompt = `Professional interior design photograph of a ${roomType.name.toLowerCase()} in ${style.name} style. `;

  // Add room type context for better AI understanding
  if (roomType.promptContext) {
    prompt += `${roomType.promptContext}. `;
  }

  // Add style-specific modifiers for accurate styling
  if (style.promptModifiers && style.promptModifiers.length > 0) {
    const modifiers = style.promptModifiers.join(", ");
    prompt += `Key design elements: ${modifiers}. `;
  }

  // Add user's custom requirements
  if (customPrompt && customPrompt.trim()) {
    prompt += `Additional requirements: ${customPrompt.trim()}. `;
  }

  // Quality directives for photorealistic results
  prompt += `High-resolution, photorealistic, professional architectural photography, natural lighting, wide-angle view from eye level, beautifully styled and decorated, magazine-quality interior design.`;

  return prompt;
}

/**
 * Generate alternative views with different angles/perspectives
 */
async function generateAlternativeViews(
  basePrompt: string,
  style: DesignStyle,
  roomType: RoomType
): Promise<string[]> {
  const alternatives: string[] = [];

  // Define alternative perspectives for interior design
  const perspectives = [
    {
      suffix: "Camera angle: different corner of the room showing more spatial depth and layout",
      quality: "standard" as const, // Use standard to save costs on alternatives
    },
    {
      suffix: "Camera angle: close-up detail view highlighting textures, materials, and finishes",
      quality: "standard" as const,
    },
  ];

  // Generate alternatives in parallel for speed
  const promises = perspectives.map(async (perspective) => {
    try {
      const altPrompt = `${basePrompt} ${perspective.suffix}`;

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: altPrompt,
        n: 1,
        size: "1024x1024",
        quality: perspective.quality,
        response_format: "b64_json",
      });

      const imageBase64 = response.data[0].b64_json;
      if (imageBase64) {
        return `data:image/png;base64,${imageBase64}`;
      }
      return null;
    } catch (error) {
      console.error(`Failed to generate alternative view: ${error}`);
      return null;
    }
  });

  const results = await Promise.all(promises);

  // Filter out failed generations
  for (const result of results) {
    if (result) {
      alternatives.push(result);
    }
  }

  console.log(`✅ Generated ${alternatives.length} alternative views`);

  return alternatives;
}

/**
 * Add watermark to images for free tier
 * Note: This is a placeholder - in production, use sharp or jimp
 * to add an actual watermark overlay to the image
 */
export function addWatermark(imageBase64: string): string {
  // TODO: Implement actual watermarking with sharp or jimp
  // For MVP, we just flag it in the database and could add client-side watermark
  // In production:
  // 1. Decode base64 to buffer
  // 2. Use sharp to composite watermark image
  // 3. Re-encode to base64

  // For now, return as-is (watermark will be added client-side via CSS overlay)
  return imageBase64;
}

/**
 * Estimate DALL-E 3 cost for a generation
 */
export function estimateGenerationCost(quality: "hd" | "standard", alternativeViews: number = 0): number {
  // DALL-E 3 pricing (as of 2024)
  const HD_COST = 0.080; // $0.080 per image (1024x1024 HD)
  const STANDARD_COST = 0.040; // $0.040 per image (1024x1024 standard)

  let cost = quality === "hd" ? HD_COST : STANDARD_COST;

  // Alternative views use standard quality
  cost += alternativeViews * STANDARD_COST;

  return cost;
}
