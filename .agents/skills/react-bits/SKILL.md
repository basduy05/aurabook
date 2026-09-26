---
name: react-bits
description: >-
  Use this skill whenever the user asks to add, integrate, configure, or customize animated UI components, backgrounds, text effects, or micro-interactions from React Bits (DavidHDev/react-bits / reactbits.dev) in React or Next.js projects.
---

# React Bits Integration Skill

React Bits is an open-source collection of animated, interactive, and customizable React components built on top of Tailwind CSS, Framer Motion, and WebGL (Three.js/Canvas).

Refer to [Component Catalog & Cheat Sheet](./references/components.md) for the complete list of components, registry identifiers, and props.

---

## 1. Project Environment Verification

Before adding components, verify the project setup in the current workspace:
1. **Framework & Environment**:
   - Check if the project is Next.js (App Router or Pages Router) or Vite/CRA.
   - If **Next.js App Router**: all animated/interactive components MUST have `'use client'` at the top.
   - For Canvas/WebGL backgrounds (e.g. `Aurora`, `Hyperspeed`, `Waves`, `SplashCursor`, `Ballpit`), ensure they are safely mounted on the client:
     ```tsx
     import dynamic from 'next/dynamic';
     const Aurora = dynamic(() => import('@/components/react-bits/Aurora'), { ssr: false });
     ```
2. **Package Manager**: Identify whether the project uses `pnpm`, `npm`, `yarn`, or `bun`.

---

## 2. Core Dependencies

Ensure required peer dependencies are installed:

```bash
# Standard interactive components (Framer Motion & Utilities)
npm install framer-motion lucide-react clsx tailwind-merge

# Required only for 3D / WebGL / Canvas components (Aurora, Waves, Hyperspeed, etc.)
npm install three @types/three gsap
```

---

## 3. Installation Methods

### Method A: Via shadcn CLI (Recommended for automated setup)
React Bits publishes components to a shadcn-compatible registry with standard suffix conventions:
- `-TS-TW`: TypeScript + Tailwind CSS (Default & Recommended)
- `-JS-TW`: JavaScript + Tailwind CSS
- `-TS-CSS`: TypeScript + Vanilla CSS

Run from the web app root directory (e.g., `apps/web`):
```bash
npx shadcn@latest add @react-bits/<ComponentName>-TS-TW
```

**Common Examples:**
```bash
# Text Animations
npx shadcn@latest add @react-bits/SplitText-TS-TW
npx shadcn@latest add @react-bits/BlurText-TS-TW
npx shadcn@latest add @react-bits/ShinyText-TS-TW
npx shadcn@latest add @react-bits/DecryptedText-TS-TW
npx shadcn@latest add @react-bits/TrueFocus-TS-TW

# Backgrounds
npx shadcn@latest add @react-bits/Aurora-TS-TW
npx shadcn@latest add @react-bits/Particles-TS-TW
npx shadcn@latest add @react-bits/Squares-TS-TW
npx shadcn@latest add @react-bits/Hyperspeed-TS-TW

# Animations & Cursors
npx shadcn@latest add @react-bits/SplashCursor-TS-TW
npx shadcn@latest add @react-bits/SpotlightCard-TS-TW
npx shadcn@latest add @react-bits/TiltedCard-TS-TW
npx shadcn@latest add @react-bits/Magnet-TS-TW
```

### Method B: Via React Bits MCP Server
If the `react-bits` MCP server is active in Antigravity:
1. Call `search_components` to find components by keyword (e.g. `"text"`, `"background"`, `"card"`).
2. Call `get_component_code` to retrieve the source code, tailwind configuration, and props directly.
3. Write the component to `components/react-bits/<ComponentName>.tsx`.

### Method C: Manual Component Creation
When installing manually or customizing:
1. Place components in `components/react-bits/<ComponentName>.tsx` (or `components/ui/`).
2. Include the `'use client'` directive if using React hooks, Framer Motion, or DOM event listeners.
3. Apply standard utility imports:
   ```tsx
   import { cn } from "@/lib/utils";
   ```

---

## 4. Tailwind CSS Configuration

Ensure `tailwind.config.ts` or `tailwind.config.js` supports keyframe animations if components use custom CSS classes. For example:

```ts
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shine: {
          '0%': { 'background-position': '100%' },
          '100%': { 'background-position': '-100%' },
        },
        starBorder: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shine: 'shine 5s linear infinite',
        'star-border': 'starBorder 8s linear infinite',
      },
    },
  },
};
```

---

## 5. Best Practices & Performance

1. **Avoid Over-Animation**:
   - Limit heavy WebGL backgrounds (e.g., `Hyperspeed` or `Fluid`) to one per visible viewport.
   - Use `IntersectionObserver` or conditional rendering to pause background canvases when off-screen.
2. **Layering & Z-Index**:
   - Background components should typically use `pointer-events-none absolute inset-0 -z-10`.
   - Ensure interactive foreground content (buttons, links) retains pointer events with `relative z-10`.
3. **Accessibility**:
   - Respect `prefers-reduced-motion` media queries when rendering continuous animations.
