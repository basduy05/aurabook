# AuraBook - Project & Frontend Design Guidelines

## 🌟 Primary UI/UX Design System: Taste-Skill & Impeccable (Mandatory)

All frontend and user interface development across AuraBook is governed permanently by:
1. **Taste-Skill** (`.agents/skills/taste-skill`): Anti-slop frontend engineering, distinct art direction, zero generic templates, intentional color palettes (ocean blue, gold accent, crisp slate & pure white), and nuanced layout variance.
2. **Impeccable** (`.agents/skills/impeccable`): Out-of-distribution craft, bounded polish passes, strict quality floor, surface modes (Persuade, Operate, Read, Experience), and robust state handling.

### Mandatory Visual Rules:
- **Brand Emblem & Logo**: All logo representations must use the official geometric cinematography emblem at `/logo.png`. Never replace it with generic text or plain placeholder icons. (Favicon remains as configured).
- **Aesthetic Direction**: High-end modern publishing platform. Bright, crisp light mode with ocean blue (`#0284c7`), warm gold (`#f59e0b`), soft backdrop blurs, tactile 3D hover effects, and responsive mobile-first typography.
- **Admin & Power Tools**: Mode = `Operate`. High data density, instant search & filter, clear audit badges, and stateful dialogs.
- **Storefront & Reader**: Mode = `Persuade` & `Read`. Visual storytelling, audio previewing, clean distraction-free reading canvas.

---

## 🛠️ Stack & Architecture
- **Web App**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **API**: FastAPI (Python 3.12), Async SQLAlchemy, PostgreSQL / SQLite (with pgvector & JSONB compatibility), Redis.
- **DRM Engine**: WebAssembly HTML5 Canvas Reader, AES-256-GCM Ephemeral Session Keys, Zero-out RAM.
- **AI Ecosystem**: Gemini 2.0 Flash Vision OCR, Gemini 768-dim vector embeddings, Hybrid Search RRF (k=60).
