import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: Anthropic | null = null;

export function getAIClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 10 * 60 * 1000, // 10 minutes for large document analysis
    });
  }
  return client;
}

export async function generateText(
  prompt: string,
  options: {
    system?: string;
    model?: "claude-sonnet-4-5-20250929" | "claude-opus-4-6";
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const ai = getAIClient();
  const {
    system,
    model = "claude-sonnet-4-5-20250929",
    maxTokens = 4096,
    temperature = 0.3,
  } = options;

  const response = await ai.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    ...(system ? { system } : {}),
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

export async function analyzeImage(
  base64: string,
  mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp",
  prompt: string,
  options: {
    system?: string;
    model?: "claude-sonnet-4-5-20250929" | "claude-opus-4-6";
    maxTokens?: number;
  } = {}
): Promise<string> {
  const ai = getAIClient();
  const {
    system,
    model = "claude-sonnet-4-5-20250929",
    maxTokens = 4096,
  } = options;

  const response = await ai.messages.create({
    model,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

export async function analyzeDocument(
  base64: string,
  mediaType: "application/pdf",
  prompt: string,
  options: {
    system?: string;
    model?: "claude-sonnet-4-5-20250929" | "claude-opus-4-6";
    maxTokens?: number;
  } = {}
): Promise<string> {
  const ai = getAIClient();
  const {
    system,
    model = "claude-sonnet-4-5-20250929",
    maxTokens = 4096,
  } = options;

  const response = await ai.messages.create({
    model,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

/**
 * Download a file from Supabase Storage and return its base64 + content type.
 * Works regardless of whether the bucket is public or private.
 */
export async function downloadStorageFile(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<{ base64: string; contentType: string }> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    throw new Error(`Storage download failed: ${error?.message || "no data"}`);
  }
  const buffer = await data.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = data.type || "application/octet-stream";
  return { base64, contentType };
}
