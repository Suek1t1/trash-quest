import { NextResponse } from "next/server";

type Detection = {
  name: string;
  box_2d: [number, number, number, number];
  level: "lv1" | "lv2" | "lv3" | "lv4";
};

const prompt = `
Analyze this messy room or desk image for a cleanup game.
Identify garbage, scattered clothes, papers, books, and small items that need to be cleaned up.
Do not detect items that are already in their proper place, such as a book on a bookshelf or trash inside a trash can.

Classify each detected item with exactly one level:
- lv1: easy to throw away, such as wrappers, paper scraps, bottles, cans, flyers, or disposable cutlery.
- lv2: has a likely storage location, such as clothing, books, dishes, towels, boxes, or game software.
- lv3: is clearly not trash but has no confidently identifiable storage location, such as cables, tools, remotes, keys, plants, or sports equipment.
- lv4: documents or papers that require examining their contents.

Return ONLY a JSON array. Each object must contain:
- "name": a short Japanese item name, such as "丸めた紙" or "本"
- "box_2d": [ymin, xmin, ymax, xmax] using normalized coordinates from 0 to 1000
- "level": exactly one of "lv1", "lv2", "lv3", "lv4"
Do not include markdown or an explanation.
`;

function parseDetections(text: string): Detection[] {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed: unknown = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini returned an invalid inspection format.");
  }

  return parsed.filter((item): item is Detection => {
    if (!item || typeof item !== "object") return false;
    const detection = item as Record<string, unknown>;
    return (
      typeof detection.name === "string" &&
      Array.isArray(detection.box_2d) &&
      detection.box_2d.length === 4 &&
      detection.box_2d.every((value) => typeof value === "number") &&
      typeof detection.level === "string" &&
      ["lv1", "lv2", "lv3", "lv4"].includes(detection.level)
    );
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || !image.type.startsWith("image/")) {
      return NextResponse.json({ error: "Please upload an image file." }, { status: 400 });
    }

    const imageData = Buffer.from(await image.arrayBuffer()).toString("base64");
    const requestBody = JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: image.type, data: imageData } }, { text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    let response: Response | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: requestBody,
        },
      );

      if (response.ok || ![429, 500, 503].includes(response.status)) break;
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }

    if (!response || !response.ok) {
      const providerError = response ? await response.text() : "No response from Gemini.";
      console.error("Gemini inspection failed:", providerError);
      const isBusy = response?.status === 429 || response?.status === 503;
      return NextResponse.json(
        { error: isBusy ? "Geminiが混み合っています。少し待ってからもう一度お試しください。" : "Geminiで画像を検査できませんでした。" },
        { status: isBusy ? 503 : 502 },
      );
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") throw new Error("Gemini returned no inspection result.");

    return NextResponse.json({ detections: parseDetections(text) });
  } catch (error) {
    console.error("Image inspection error:", error);
    return NextResponse.json({ error: "The image could not be inspected." }, { status: 500 });
  }
}