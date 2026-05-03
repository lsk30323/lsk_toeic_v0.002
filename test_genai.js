import { GoogleGenAI, Modality } from "@google/genai";
import fetch from "node-fetch";

// To avoid proxy issues locally, we can just supply the key or use fetch.
const ai = new GoogleGenAI({});

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hi",
    });
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}
test();
