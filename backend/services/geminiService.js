const https = require('https');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_HOST = 'generativelanguage.googleapis.com';
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest'];
const API_VERSIONS = ['v1beta', 'v1'];

const SYSTEM_PROMPT = `You are SmartCity Chat Support Assistant for citizens.

Core responsibilities:
- Help citizens file and track civic complaints.
- Explain complaint categories: traffic, water, waste, lighting, emergency.
- Guide with clear, practical, step-by-step actions.
- Keep replies short, empathetic, and easy to understand.

Rules:
- You may request a backend action only when user clearly asks to file/register/create complaint.
- For urgent danger (fire, severe injury, active threat), advise immediate local emergency services first.
- If information is missing, ask one focused follow-up question.
- Avoid legal or medical diagnosis.
- Keep response under 140 words unless user asks for detail.`;

const ACTION_INSTRUCTION = `Return STRICT JSON only (no markdown, no code block) in this exact shape:
{
  "reply": "string",
  "action": null | {
    "type": "create_complaint",
    "payload": {
      "title": "string",
      "description": "string",
      "category": "traffic|water|waste|lighting|emergency",
      "location": "string",
      "zone": "north|south|east|west|central",
      "priority": "low|medium|high"
    }
  }
}

Action policy:
- Use action.type=create_complaint ONLY when user explicitly asks to file/create/register complaint now.
- If required details are missing, keep action=null and ask for missing details in reply.
- Never invent exact addresses; if unsure ask user first.
`;

const postJson = (path, body) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);

    const req = https.request(
      {
        hostname: GEMINI_HOST,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          let parsed;
          try {
            parsed = data ? JSON.parse(data) : {};
          } catch (error) {
            return reject(new Error('Invalid Gemini response format.'));
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            const message = parsed?.error?.message || `Gemini API failed with status ${res.statusCode}`;
            const error = new Error(message);
            error.statusCode = res.statusCode;
            return reject(error);
          }

          resolve(parsed);
        });
      }
    );

    req.on('error', (error) => {
      reject(new Error(`Gemini request failed: ${error.message}`));
    });

    req.write(payload);
    req.end();
  });
};

const normalizeHistory = (history = []) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item) => item && typeof item.content === 'string' && item.content.trim())
    .slice(-10)
    .map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content.trim().slice(0, 1200) }]
    }));
};

const extractText = (response) => {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';

  return parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join(' ')
    .trim();
};

const parseAssistantJson = (rawText) => {
  if (!rawText) return null;

  const trimmed = rawText.trim();
  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;

  const candidate = trimmed.slice(jsonStart, jsonEnd + 1);
  try {
    return JSON.parse(candidate);
  } catch (error) {
    return null;
  }
};

const normalizeAssistantResponse = (parsed, fallbackText) => {
  const safeReply = typeof parsed?.reply === 'string' && parsed.reply.trim()
    ? parsed.reply.trim()
    : fallbackText;

  if (!parsed?.action || parsed.action.type !== 'create_complaint') {
    return { reply: safeReply, action: null };
  }

  const payload = parsed.action.payload || {};
  return {
    reply: safeReply,
    action: {
      type: 'create_complaint',
      payload: {
        title: typeof payload.title === 'string' ? payload.title.trim() : '',
        description: typeof payload.description === 'string' ? payload.description.trim() : '',
        category: typeof payload.category === 'string' ? payload.category.trim().toLowerCase() : '',
        location: typeof payload.location === 'string' ? payload.location.trim() : '',
        zone: typeof payload.zone === 'string' ? payload.zone.trim().toLowerCase() : '',
        priority: typeof payload.priority === 'string' ? payload.priority.trim().toLowerCase() : ''
      }
    }
  };
};

const normalizeModelName = (name = '') => {
  if (!name) return '';
  return name.replace(/^models\//, '').trim();
};

const getCandidateModels = () => {
  const fromEnv = normalizeModelName(process.env.GEMINI_MODEL || DEFAULT_MODEL);
  const all = [fromEnv, ...FALLBACK_MODELS.map(normalizeModelName)].filter(Boolean);
  return [...new Set(all)];
};

const isUnsupportedModelError = (error) => {
  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('is not found') ||
    message.includes('not supported for generatecontent') ||
    message.includes('unknown model')
  );
};

const tryGenerateWithFallbacks = async (apiKey, payload) => {
  const models = getCandidateModels();
  const errors = [];

  for (const model of models) {
    for (const apiVersion of API_VERSIONS) {
      const path = `/${apiVersion}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      try {
        const response = await postJson(path, payload);
        if (model !== normalizeModelName(process.env.GEMINI_MODEL || '')) {
          console.warn(`Gemini fallback model in use: ${model} (${apiVersion})`);
        }
        return response;
      } catch (error) {
        errors.push(`[${apiVersion}:${model}] ${error.message}`);
        if (!isUnsupportedModelError(error)) {
          throw error;
        }
      }
    }
  }

  throw new Error(`No compatible Gemini model found. Tried: ${errors.join(' | ')}`);
};

const generateAssistantReply = async ({ message, history = [], user }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured in backend .env');
    error.statusCode = 503;
    throw error;
  }

  const userContext = `Citizen context:\n- Name: ${user?.name || 'Citizen'}\n- Role: ${user?.role || 'user'}\n- Department: ${user?.department || 'general'}`;

  const contents = [
    ...normalizeHistory(history),
    { role: 'user', parts: [{ text: message.trim().slice(0, 1500) }] }
  ];

  const payload = {
    system_instruction: {
      parts: [{ text: `${SYSTEM_PROMPT}\n\n${ACTION_INSTRUCTION}\n${userContext}` }]
    },
    contents,
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: 350
    }
  };

  const response = await tryGenerateWithFallbacks(apiKey, payload);

  const rawText = extractText(response);
  if (!rawText) {
    throw new Error('No response returned from Gemini model.');
  }

  const parsed = parseAssistantJson(rawText);
  if (!parsed) {
    return { reply: rawText, action: null };
  }

  return normalizeAssistantResponse(parsed, rawText);
};

module.exports = {
  generateAssistantReply
};
