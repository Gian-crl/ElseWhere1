// NETLIFY CHAT ENDPOINT NOTE: keeps the private OpenAI key on the server and returns travelogue assistant replies.
const SYSTEM_PROMPT = `You are ElseWhere's friendly, accurate travelogue assistant. Help visitors understand the website and get grounded travel-planning inspiration. ElseWhere features 12 destinations: Mount Pulag, Batanes, Isla Gigantes, Tawi-Tawi, Palawan, and Boracay in the Philippines; Chefchaouen in Morocco, Vatican City, Tromsø in northern Norway, France, Japan, and South Korea internationally. The site has Local and International destination cards, detailed destination pages, destination search, a Gallery with filters, Travel Guide topics for packing, budgeting, transportation, accommodation, best time to travel, and photography, plus About Us, FAQ, Contact Us, Our Team, a 1–5 star feedback form, and a light/dark theme toggle. Feedback is saved locally unless the site owner configures shared review storage. The Contact Us form is a demo and does not actually send messages unless connected to a service. The five project roles are Project Leader, Asst. Leader/Programmer, Web Designer/Researcher, Content Manager/Researcher, and Document Officer/Researcher. Their names are placeholders in the current site. Be warm, practical, and concise. Answer follow-up questions using the conversation context. Do not invent current prices, opening hours, availability, transport schedules, visa rules, or local safety status. For details that change, advise visitors to verify with official sources or local providers. Ask one useful clarifying question when needed. If a request is unrelated to the site or travel, gently explain your main purpose and steer back to ElseWhere.`;
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS")
    return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST")
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: "AI is not configured yet" }),
    };
  try {
    const body = JSON.parse(event.body || "{}");
    const message =
      typeof body.message === "string" ? body.message.trim().slice(0, 800) : "";
    const history = Array.isArray(body.history)
      ? body.history
          .slice(-10)
          .map((item) => ({
            role: item && item.role === "assistant" ? "Assistant" : "Visitor",
            content:
              item && typeof item.content === "string"
                ? item.content.trim().slice(0, 1000)
                : "",
          }))
          .filter((item) => item.content)
      : [];
    const pageContext = [body.title, body.page]
      .filter((value) => typeof value === "string")
      .map((value) => value.slice(0, 200))
      .join(" | ");
    if (!message)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "A message is required" }),
      };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: SYSTEM_PROMPT,
        input: `${pageContext ? `Current page: ${pageContext}\n` : ""}${history.map((item) => `${item.role}: ${item.content}`).join("\n")}\nVisitor: ${message}\nAssistant:`,
        max_output_tokens: 650,
      }),
    });
    const data = await response.json();
    if (!response.ok)
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "The AI service could not answer right now",
        }),
      };
    let reply = data.output_text;
    if (!reply && Array.isArray(data.output))
      reply = data.output
        .flatMap((x) => x.content || [])
        .filter((x) => x.type === "output_text")
        .map((x) => x.text)
        .join("\n");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: (
          reply || "I couldn't form an answer just now. Please try again."
        ).slice(0, 5000),
      }),
    };
  } catch (_) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid request" }),
    };
  }
};
