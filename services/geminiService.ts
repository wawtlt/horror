import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { StoryState, HorrorIntensity, Language } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to interpret errors and return specific horror-themed messages
const interpretError = (error: any, language: Language): string => {
  const msg = (error?.message || String(error)).toUpperCase();
  const isJa = language === 'ja';

  // 1. Safety / Content Moderation (Detailed checks)
  if (msg.includes("SAFETY") || msg.includes("BLOCKED") || msg.includes("HARM_CATEGORY") || msg.includes("FINISH_REASON")) {
    if (msg.includes("SEXUALLY_EXPLICIT")) {
       return isJa 
         ? "禁忌：性的な表現が含まれているため、闇がそれを拒絶しました。" 
         : "Taboo: Darkness rejected the content due to explicit nature.";
    }
    if (msg.includes("HATE_SPEECH")) {
       return isJa 
         ? "禁忌：憎悪に満ちた言葉は、霊たちを怒らせます。" 
         : "Taboo: Hateful words anger the spirits.";
    }
    if (msg.includes("HARASSMENT")) {
       return isJa 
         ? "禁忌：他者を傷つける意図は、呪いとなって返ってきます。" 
         : "Taboo: Harmful intent returns as a curse.";
    }
    if (msg.includes("DANGEROUS")) {
       return isJa 
         ? "禁忌：危険な儀式（コンテンツ）は中断されました。" 
         : "Taboo: Dangerous rituals (content) were interrupted.";
    }
    // Generic Safety
    return isJa 
      ? "その恐怖はあまりにも深く、禁忌に触れてしまいました... (Safety Block)"
      : "The horror was too deep, touching upon the forbidden... (Safety Block)";
  }

  // 2. Resource Exhausted / Quota (429)
  if (msg.includes("429") || msg.includes("QUOTA") || msg.includes("EXHAUSTED") || msg.includes("RESOURCE_EXHAUSTED")) {
    return isJa 
      ? "霊力が枯渇しています... しばらく時間を置いてから、再び儀式を行ってください。"
      : "Spiritual energy is exhausted... Please wait a while before attempting the ritual again.";
  }

  // 3. API Key / Auth (401, 403)
  if (msg.includes("API_KEY") || msg.includes("403") || msg.includes("401") || msg.includes("PERMISSION") || msg.includes("UNAUTHENTICATED")) {
    return isJa 
      ? "護符（APIキー）が無効です。新しいものを求めてください。"
      : "The amulet (API key) is invalid. Please seek a new one.";
  }

  // 4. Not Found / Invalid Argument (400, 404)
  if (msg.includes("400") || msg.includes("INVALID_ARGUMENT") || msg.includes("404") || msg.includes("NOT_FOUND")) {
    return isJa 
      ? "呪文（プロンプト）が間違っています。言葉を選び直してください。"
      : "The incantation (prompt) is incorrect. Choose your words carefully.";
  }

  // 5. Server Errors (500, 502, 503, 504)
  if (msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("504") || msg.includes("OVERLOADED") || msg.includes("UNAVAILABLE") || msg.includes("INTERNAL")) {
    return isJa 
      ? "彼岸への門が混雑しています... 霊たちが騒がしいようです。"
      : "The gate to the other side is crowded... The spirits are restless.";
  }

  // 6. Network / Fetch Errors
  if (msg.includes("FETCH") || msg.includes("NETWORK") || msg.includes("FAILED TO FETCH")) {
    return isJa 
      ? "彼岸との回線が不安定です。霊的な接続（インターネット）を確認してください。"
      : "The connection to the other side is unstable. Please check your spiritual connection (internet).";
  }

  // 7. JSON Parsing / Response Format
  if (msg.includes("JSON") || msg.includes("SYNTAXERROR") || msg.includes("UNEXPECTED TOKEN") || msg.includes("NO TEXT GENERATED")) {
    return isJa 
      ? "物語が形を成しませんでした... 混沌が強すぎます。"
      : "The story failed to take shape... The chaos is too strong.";
  }

  // Default fallback
  const cleanMsg = error?.message?.replace(/\[.*?\]/g, '').trim() || String(error).slice(0, 50);
  return isJa 
    ? `未知の闇が邪魔をしています... (${cleanMsg}...)`
    : `Unknown darkness is interfering... (${cleanMsg}...)`;
};

const getSystemInstruction = (intensity: HorrorIntensity, language: Language, username?: string) => {
  const isJa = language === 'ja';
  const userContext = username ? (isJa ? `主人公または登場人物として、あるいは恐怖の対象が語りかける相手として「${username}」という名前を物語に自然に組み込んでください。これにより没入感を高めてください。` : `Incorporate the name "${username}" naturally into the story, either as the protagonist, a character, or the person being addressed by the entity, to heighten immersion.`) : "";

  let intensityInstruction = "";
  
  if (isJa) {
    switch (intensity) {
      case 'mild':
        intensityInstruction = `
【恐怖レベル: 控えめ (Mild)】
- 直接的な残虐表現やグロテスクな描写は避けてください。
- 「何かがいるかもしれない」という気配や、不思議な現象、少しの違和感に焦点を当ててください。
- 読後感は、不気味だがトラウマにはならない程度に留めてください。
`;
        break;
      case 'extreme':
        intensityInstruction = `
【恐怖レベル: 極限 (Extreme)】
- 容赦のない恐怖、絶望的で救いのない結末を描いてください。
- 生理的嫌悪感を催すような具体的な描写や、精神を蝕むような狂気を含めてください。
- 読者を徹底的に不安にさせ、心拍数を上げるような緊迫感のある展開にしてください。
`;
        break;
      default: // standard
        intensityInstruction = `
【恐怖レベル: 標準 (Standard)】
- 日本の怪談らしい、湿り気のある恐怖と適度な緊張感を持たせてください。
- 幽霊や怪異の存在を明確にしつつ、想像の余地を残すバランスの良い恐怖を目指してください。
`;
        break;
    }

    return `
あなたは日本の怪談（Kaidan）やホラー小説の熟練した作家です。
ユーザーの入力に基づいて、恐ろしく、心理的に不安にさせるような短いホラー小説（300文字〜500文字程度）を作成してください。

${userContext}

${intensityInstruction}

【重要：言語設定】
**必ず日本語で執筆してください。**

【重要：画像プロンプトの作成】
物語の最も恐ろしいシーン、あるいは象徴的な場面を描写する「画像生成AIへのプロンプト」を作成してください。
このプロンプトは**必ず英語**で記述してください。
恐怖を最大限に引き出し、日本のホラー映画のような湿り気のある恐怖を表現するために、以下のスタイルやキーワードを必ず含めてください：

"photorealistic, 8k, highly detailed, dark horror atmosphere, cinematic lighting, gloomy, grainy, disturbing, muted colors, unsettling, eerie, high contrast, desaturated, psychological horror aesthetic"

**描写の指針**:
- 恐怖の対象（幽霊、影、異形のもの）を明確に、しかし不気味に描写する。
- 抽象的な表現よりも、視覚的に訴える具体的な表現を用いる。
- 明るくポップな要素は排除する。

【重要：ジャンプスケアのタイミング】
物語の中で最も緊張が高まる瞬間、または「驚かせ」に適したポイントを、0.0から1.0の数値（物語全体の進行度）で指定してください。
例: 0.85（物語の終盤85%の時点）
恐怖のクライマックスに合わせて設定してください。

以下のJSON形式で出力してください:
{
  "title": "恐ろしいタイトル",
  "content": "本文...",
  "mood": "psychological" | "paranormal" | "creepy",
  "imagePrompt": "A photorealistic image of...",
  "jumpScareTiming": 0.8
}
`;
  } else {
    // ENGLISH INSTRUCTIONS
    switch (intensity) {
      case 'mild':
        intensityInstruction = `
[Intensity: Mild]
- Avoid direct gore or grotesque descriptions.
- Focus on the sense that "something might be there," strange phenomena, or slight unease.
- Ensure the aftertaste is creepy but not traumatic.
`;
        break;
      case 'extreme':
        intensityInstruction = `
[Intensity: Extreme]
- Depict relentless horror and a hopeless ending.
- Include visceral descriptions that evoke physiological disgust or madness that erodes the mind.
- Create intense developments that thoroughly unsettle the reader and raise their heart rate.
`;
        break;
      default: // standard
        intensityInstruction = `
[Intensity: Standard]
- Balance atmospheric dread with moderate tension, typical of classic ghost stories.
- Clearly imply the presence of ghosts or anomalies while leaving room for imagination.
`;
        break;
    }

    return `
You are a master writer of horror stories and urban legends.
Based on the user's input, create a terrifying, psychologically unsettling short horror story (approx. 200-400 words).

${userContext}

${intensityInstruction}

【IMPORTANT: Language】
**Write the story entirely in English.**

【IMPORTANT: Image Prompt Creation】
Create a prompt for an AI image generator depicting the scariest or most symbolic scene of the story.
This prompt **must be in English**.
Include the following keywords to maximize horror and achieve a dark, cinematic look:

"photorealistic, 8k, highly detailed, dark horror atmosphere, cinematic lighting, gloomy, grainy, disturbing, muted colors, unsettling, eerie, high contrast, desaturated, psychological horror aesthetic"

**Visual Guidelines**:
- Clearly but eerily depict the source of fear (ghost, shadow, anomaly).
- Use concrete visual descriptions rather than abstract concepts.
- Strictly exclude bright or cheerful elements.

【IMPORTANT: Jump Scare Timing】
Specify the moment of highest tension or the best point for a "scare" as a float between 0.0 and 1.0 (representing story progression).
Example: 0.85 (at 85% of the story).

Output in the following JSON format:
{
  "title": "Scary Title",
  "content": "Story content...",
  "mood": "psychological" | "paranormal" | "creepy",
  "imagePrompt": "A photorealistic image of...",
  "jumpScareTiming": 0.8
}
`;
  }
};

export const generateHorrorStory = async (prompt: string, intensity: HorrorIntensity = 'standard', language: Language = 'ja', username?: string): Promise<StoryState> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(intensity, language, username),
        responseMimeType: "application/json",
      },
    });

    // Explicit Check: Finish Reason
    const candidate = response.candidates?.[0];
    if (candidate?.finishReason && candidate.finishReason !== "STOP") {
        throw new Error(`BLOCKED: ${candidate.finishReason}`);
    }

    const text = response.text;
    if (!text) throw new Error("NO TEXT GENERATED");

    // Attempt to parse JSON. If the model is blocked, text might be partial or error message
    let storyData: StoryState;
    try {
        storyData = JSON.parse(text) as StoryState;
        storyData.language = language; // Tag the story with its language
    } catch (e) {
        throw new Error("JSON parsing failed: " + text.substring(0, 50));
    }

    return storyData;

  } catch (error) {
    console.error("Story Generation Error:", error);
    // Propagate the interpreted error message to the UI
    throw new Error(interpretError(error, language));
  }
};

export const generateStoryContinuation = async (
  previousContent: string, 
  intensity: HorrorIntensity, 
  language: Language
): Promise<string> => {
  try {
    const isJa = language === 'ja';
    const prompt = isJa 
      ? `以下の怪談の続きを、同じトーンと恐怖レベルで執筆してください。文脈を引き継ぎ、物語をさらに深淵へと導いてください。長さは300文字程度。\n\n[前回の内容]:\n${previousContent}`
      : `Continue the following horror story with the same tone and intensity. Maintain continuity and lead the narrative deeper into the abyss. Approx 150 words.\n\n[Previous Content]:\n${previousContent}`;

    const systemInstruction = isJa
      ? `あなたは怪談の続きを書く熟練の作家です。恐怖レベルは「${intensity}」です。JSONではなく、プレーンテキストで続きの文章のみを出力してください。`
      : `You are a master horror writer continuing a story. Intensity level is "${intensity}". Output ONLY the plain text of the continuation, not JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    // Check Candidate
    const candidate = response.candidates?.[0];
    if (candidate?.finishReason && candidate.finishReason !== "STOP") {
        throw new Error(`BLOCKED: ${candidate.finishReason}`);
    }

    const text = response.text;
    if (!text) throw new Error("No continuation generated");
    return text.trim();

  } catch (error) {
    console.error("Continuation Error:", error);
    throw new Error(interpretError(error, language));
  }
};

export const generateHorrorImage = async (imagePrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: imagePrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    // Explicit Check for FinishReason in Image Generation
    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
        console.warn("Image Generation: Blocked by Safety");
        // We return empty to allow story to proceed, but log it.
        return "";
    }

    let base64Image = "";
    const parts = candidate?.content?.parts;
    
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    return base64Image || "";
  } catch (error) {
    // We log specific image errors but do not throw, so the story can still be displayed without the image.
    // Use 'en' for log interpretation or simple default
    console.warn("Image Generation Skipped:", error); 
    return "";
  }
};

export const generateHorrorSpeech = async (text: string, language: Language = 'ja', voice: string = 'Fenrir'): Promise<string> => {
  try {
    // Pass the user-selected voice to the API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }, 
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("No audio data generated");
    }

    return audioData;
  } catch (error) {
    console.error("Speech Generation Error:", error);
    throw new Error(interpretError(error, language));
  }
};