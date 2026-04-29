export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, image } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  // Build message content (text only, or text + image)
  let content;
  if (image) {
    // image is a data URL like "data:image/jpeg;base64,/9j/4AAQ..."
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: "Invalid image format" });
    const [, mediaType, base64Data] = match;
    content = [
      {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64Data },
      },
      { type: "text", text: prompt },
    ];
  } else {
    content = prompt;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 3000,
        messages: [{ role: "user", content }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(response.status).json({ error: data });
    }

    // Get Claude's text response
    let text = data.content?.map(c => c.text || "").join("") || "";

    // Strip markdown code block wrapper if present
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    res.status(200).json({ text });
  } catch (e) {
    console.error("API route error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
