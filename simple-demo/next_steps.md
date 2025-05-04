## 1  Landing-page toggle

| What to add                                                        | Where                     | Key points                                                                             |                                                                |
| ------------------------------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Centered split-button** – “Practice Speaking” / “Mock Interview” | `index.html`, `style.css` | Use a flexbox wrapper and `:hover` transitions that match your glass-morphism palette. |                                                                |
| JS router → `app.js`                                               | `js/app.js`               | On click, set \`appState.mode = "practice"                                             | "interview"`then call`initPractice()`**or**`initInterview()\`. |

> *This keeps every existing module untouched when the user stays in “practice” mode.*

---

## 2  Collect interview parameters (Modal)

### UI

* Add a modal (Bootstrap / vanilla) that collects:

  1. **Position & company** (`roleInput`, `companyInput`)
  2. **Duration (min)** (`durationInput`) – constrain 1-60
  3. **Question focus** (`focusInput`, multiline)
  4. **Optional resource links** (`linksInput`, comma-sep)

### Code stub – `js/interview-setup.js`

```js
export async function gatherInterviewConfig() {
  return {
    role:  document.getElementById('roleInput').value,
    company: document.getElementById('companyInput').value,
    duration: +document.getElementById('durationInput').value * 60, // secs
    focus: document.getElementById('focusInput').value,
    links: document.getElementById('linksInput').value.split(',')
  };
}
```

---

## 3  Create or pick an ElevenLabs voice ( I would rather just use an existing dont waste time on this )

```js
async function ensureVoice(role, company) {
  const resp = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: { 'xi-api-key': ELEVEN_KEY },
    body: new FormData(Object.entries({
      name: `${company}-${role}-Interviewer`,
      text_prompt: `Middle-aged ${company} interviewer with confident tone`,
      model_id: 'eleven_monolingual_v2'
    }))
  });
  return (await resp.json()).voice_id;
}
```

`/v1/voices/add` supports both clip-upload and “Voice Design” prompts; creation time is ≈30-60 s ([ElevenLabs][1], [ElevenLabs][2]).

> **Tip:** cache successful `voice_id`s in `localStorage` so repeat runs skip re-cloning.

---

## 4  Spin-up the Conversational-AI agent ( Very important review and go thru once! )

```js
async function createInterviewAgent(cfg, voice_id) {
  const body = {
    name: `${cfg.company} Interviewer`,
    voice_id,
    conversation_config: {
      opening_message: `Let's begin your ${cfg.role} interview at ${cfg.company}.`,
      system_prompt:
`You are a tough but fair interviewer for a ${cfg.role} role at ${cfg.company}.
Ask concise questions focused on: ${cfg.focus}. 
Reference these links when relevant: ${cfg.links.join(', ')}.
Warn the candidate when 20 % of the time remains, and end exactly at ${cfg.duration} seconds.`,
      llm_model: "gpt-4o-mini",
      max_duration_secs: cfg.duration
    }
  };

  const res = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return (await res.json()).agent_id;
}
```

The `POST /v1/convai/agents/create` endpoint returns `agent_id` on success ([ElevenLabs][3], [ElevenLabs][4], [ElevenLabs][5]).

---

## 5  Real-time audio loop with WebSocket

### Connect

```js
const socket = new WebSocket(
  `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agent_id}`
); // public agents need no extra auth:contentReference[oaicite:2]{index=2}
```

### Stream

* **Outgoing** – Pipe your existing `audio-processor.js` raw PCM chunks directly to `socket.send(chunk)`.
* **Incoming** – On `'message'` events, push audio buffers to a `MediaSource` for smooth playback.

### Turn-taking

* Enable `voice_activity_detection=true` in the WS query to let the agent auto-pause when the user interrupts (see ElevenLabs VAD docs) ([ElevenLabs][6]).

---

## 6  3-D “Talking-ball” visualizer

* Import **three.js** (`<script type="module" src="https://unpkg.com/three@latest/build/three.module.js"></script>`).
* Create a sphere geometry (`THREE.SphereGeometry(1, 64, 64)`), load a simple noise/gradient shader, and animate small scale/pulse changes each time an incoming audio buffer lands.

Helpful tutorials/demo code:

* Codrops “Animated Displaced Sphere” (custom shaders) ([Codrops][7])
* Three JS official sphere & morph-target example ([Three.js][8])
* Audio-reactive sphere video walkthrough ([YouTube][9])

Hook the animation loop to the average RMS of the latest audio chunk for a subtle “speaking” pulse.

---

## 7  Parallel emotion & transcript capture ( Also extremely important for our overall project )

Your existing video + STT pipeline keeps running; just tag each transcript line with a `source: "agent" | "user"` flag so you can show both sides later.

If you prefer the agent’s own text, ElevenLabs WS also emits `{"type":"transcript","text":"..."}` control frames ([ElevenLabs][10]).

---

## 8  Post-interview report via OpenAI( Also extremely important need tomake sure the report looks pretty and is helpful to the user  )

```js
async function reviewWithOpenAI(conversationJson) {
  const prompt = `
Act as a candid hiring manager.  Below is the full interview transcript and emotion timeline.
Give the candidate specific feedback on content, structure, and delivery.
Return a markdown report with: ✅ Strengths | ⚠️ Areas to improve | 🎯 Next-steps.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(conversationJson) }
      ]
    })
  });
  return (await res.json()).choices[0].message.content;
}
```

Render the markdown inside a styled `<div class="report">` using your existing glass card CSS; add syntax-highlighted emoji bullets or badges for flair.

---

## 9  File / module checklist

| File                       | New / Edit | Responsibility                                |
| -------------------------- | ---------- | --------------------------------------------- |
| **index.html**             | edit       | add split button + modal skeleton             |
| **css/style.css**          | edit       | center layout, modal theme, `.report` styling |
| **js/app.js**              | edit       | mode switcher + lazy imports                  |
| **js/interview-setup.js**  | new        | modal logic & config gather                   |
| **js/interview-agent.js**  | new        | voice creation, agent creation, WS streaming  |
| **js/three-visualizer.js** | new        | 3-D talking sphere component                  |
| **js/report-renderer.js**  | new        | OpenAI call + markdown → DOM                  |
| **config.js**              | edit       | `ELEVEN_KEY`, `OPENAI_KEY`, new flags         |

---

## 10  Security & quotas

* Keep API keys in server-side env vars and expose only a thin token to the browser.
* ElevenLabs bills **minutes** + upcoming pass-through LLM tokens ([ElevenLabs][3]).  Warn heavy users.
* Respect ElevenLabs cloning policy (no deceptive voices) ([ElevenLabs][1]).

---

## 11  Smoke-test script (local)

1. `npm run dev` → open `localhost:8000`.
2. Choose **Mock Interview**, input dummy data, press **Start**.
3. Verify:

   * Agent audio plays, sphere pulses.
   * Webcam emotion overlay still updates.
   * At 80 % of time, agent issues “We’re wrapping up soon.”
   * Session ends cleanly; markdown report appears.

If all green, deploy behind HTTPS (WS & media constraints).

---

### References

1. ElevenLabs “Create agent” endpoint ([ElevenLabs][3])
2. ElevenLabs API Explorer for `/agents/create` ([ElevenLabs][4])
3. ElevenLabs voice-cloning `/voices/add` ([ElevenLabs][1])
4. WebSocket URL & auth for convai conversations ([ElevenLabs][11])
5. ElevenLabs Python/JS SDK convai sample ([ElevenLabs][6])
6. Codrops tutorial on animated spheres (Three.js) ([Codrops][7])
7. Audio-reactive sphere walkthrough (video) ([YouTube][9])
8. D3 spherical geo shapes (optional alt) ([D3.js][12])
9. Community WS + Whisper STT reference ([Reddit][13])
10. Third-party integration guide (Convai + ElevenLabs) ([Welcome | Documentation][14])
11. JS code sample for `/agents/create` (TS) ([ElevenLabs][5])
12. API explorer for voice-add (form details) ([ElevenLabs][2])
13. WebSocket API reference ([ElevenLabs][10])
14. Three.js official sphere examples ([Three.js][8])

With this roadmap, any teammate can drop straight into the codebase, follow the file checklist, and wire the new ElevenLabs interviewer into your polished mood-tracking demo. Happy shipping!

[1]: https://elevenlabs.io/docs/api-reference/voices/add?utm_source=chatgpt.com "Create voice clone | ElevenLabs Documentation"
[2]: https://elevenlabs.io/docs/api-reference/voices/add/~explorer?utm_source=chatgpt.com "Create voice clone (API Explorer) | ElevenLabs Documentation"
[3]: https://elevenlabs.io/docs/conversational-ai/api-reference/agents/create-agent?utm_source=chatgpt.com "Create agent | ElevenLabs Documentation"
[4]: https://elevenlabs.io/docs/api-reference/agents/create-agent/~explorer?utm_source=chatgpt.com "Create agent (API Explorer) | ElevenLabs Documentation"
[5]: https://elevenlabs.io/docs/api-reference/agents/create-agent?utm_source=chatgpt.com "Create agent | ElevenLabs Documentation"
[6]: https://elevenlabs.io/docs/conversational-ai/libraries/python?utm_source=chatgpt.com "Python SDK | ElevenLabs Documentation"
[7]: https://tympanus.net/codrops/2024/07/09/creating-an-animated-displaced-sphere-with-a-custom-three-js-material/?utm_source=chatgpt.com "Creating an Animated Displaced Sphere with a Custom Three.js ..."
[8]: https://threejs.org/examples/?utm_source=chatgpt.com "Examples - Three.js"
[9]: https://www.youtube.com/watch?pp=0gcJCdgAo7VqN5tD&v=qDIF2z_VtHs&utm_source=chatgpt.com "How To Create A 3D Audio Visualizer Using Three.js - YouTube"
[10]: https://elevenlabs.io/docs/conversational-ai/api-reference/conversational-ai/websocket?utm_source=chatgpt.com "Agent WebSockets | ElevenLabs Documentation"
[11]: https://elevenlabs.io/docs/conversational-ai/libraries/web-sockets?utm_source=chatgpt.com "WebSocket | ElevenLabs Documentation"
[12]: https://d3js.org/d3-geo/shape?utm_source=chatgpt.com "Spherical shapes | D3 by Observable"
[13]: https://www.reddit.com/r/OpenAI/comments/18r5ml6/near_realtime_speechtotext_with_self_hosted/?utm_source=chatgpt.com "Near Realtime speech-to-text with self hosted Whisper ... - Reddit"
[14]: https://docs.convai.com/api-docs/plugins-and-integrations/other-integrations/third-party-api-integrations/elevenlabs-api-integration?utm_source=chatgpt.com "ElevenLabs API Integration | Documentation - Convai"
