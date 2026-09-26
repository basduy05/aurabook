# React Bits Component Reference & Registry Cheat Sheet

This document lists the popular components available in React Bits (`reactbits.dev` / `DavidHDev/react-bits`), their registry identifiers for the shadcn CLI, and key usage details.

---

## 1. Text Animations

| Component | Registry Identifier | Description | Key Props / Features |
| :--- | :--- | :--- | :--- |
| **SplitText** | `@react-bits/SplitText-TS-TW` | Animates text letter-by-letter or word-by-word with staggered spring motion. | `text`, `delay`, `animationFrom`, `animationTo`, `threshold` |
| **BlurText** | `@react-bits/BlurText-TS-TW` | Text smoothly unblurs into clarity words or letters at a time. | `text`, `delay`, `animateBy="words"`, `direction="top"` |
| **ShinyText** | `@react-bits/ShinyText-TS-TW` | Adds a continuous animated shiny light reflection sweep across text. | `text`, `disabled`, `speed`, `className` |
| **DecryptedText** | `@react-bits/DecryptedText-TS-TW` | Cyberpunk / Matrix decryption animation revealing randomized characters. | `text`, `speed`, `maxIterations`, `revealDirection`, `sequential` |
| **TrueFocus** | `@react-bits/TrueFocus-TS-TW` | Spotlight focus rectangle that snaps to different words or on hover. | `sentence`, `manualMode`, `blurAmount`, `borderColor` |
| **VariableProximity** | `@react-bits/VariableProximity-TS-TW` | Font weight and variable font axes react dynamically to mouse distance. | `label`, `fromFontVariationSettings`, `toFontVariationSettings`, `radius` |
| **RotatingText** | `@react-bits/RotatingText-TS-TW` | Cycles through a list of rotating words with 3D or slide transitions. | `texts={['Fast', 'Modern', 'Secure']}`, `transition`, `rotationInterval` |
| **AsciiText** | `@react-bits/AsciiText-TS-TW` | Renders dynamic text as animated 3D ASCII characters via Three.js. | `text`, `asciiFontSize`, `enableWaves` |
| **CountUp** | `@react-bits/CountUp-TS-TW` | Smooth numeric counter with spring physics and number formatting. | `to`, `from`, `duration`, `separator` |

---

## 2. Backgrounds (Canvas & WebGL)

*Note: For Next.js App Router, render these with `'use client'` and dynamic import with `ssr: false`.*

| Component | Registry Identifier | Description | Dependencies |
| :--- | :--- | :--- | :--- |
| **Aurora** | `@react-bits/Aurora-TS-TW` | Fluid animated northern lights / atmospheric gradient effect. | `three` |
| **Hyperspeed** | `@react-bits/Hyperspeed-TS-TW` | Sci-fi warp speed stars or highway light streaks animation. | `three` |
| **Particles** | `@react-bits/Particles-TS-TW` | Interactive particle field with optional connecting lines responding to mouse. | Standard Canvas |
| **Squares** | `@react-bits/Squares-TS-TW` | Subtle animated retro grid of squares that glow or flip on mouse hover. | Standard Canvas |
| **Waves** | `@react-bits/Waves-TS-TW` | Flowing sine wave mesh lines with custom stroke colors. | Standard Canvas / WebGL |
| **Iridescence** | `@react-bits/Iridescence-TS-TW` | Shimmering pearlescent soap bubble / oil-slick iridescent distortion shader. | `three` |
| **GridDistortion** | `@react-bits/GridDistortion-TS-TW` | Cursor-distorted image or gradient plane grid. | `three`, `gsap` |
| **Ballpit** | `@react-bits/Ballpit-TS-TW` | 3D physics-simulated bouncing spheres that react to gravity and mouse pointer. | `three` |
| **Antigravity** | `@react-bits/Antigravity-TS-TW` | Floating items drifting upward defying gravity. | Standard Canvas |

---

## 3. Interactive Animations & Cursors

| Component | Registry Identifier | Description | Use Case |
| :--- | :--- | :--- | :--- |
| **SplashCursor** | `@react-bits/SplashCursor-TS-TW` | Full-screen interactive fluid dye simulation following cursor drag. | Hero sections, creative portfolios |
| **BlobCursor** | `@react-bits/BlobCursor-TS-TW` | Organic gooey morphing blob cursor follower using SVG filter. | Custom cursor for playful designs |
| **FollowCursor** | `@react-bits/FollowCursor-TS-TW` | Smooth spring-physics cursor follower trail. | Subtle interactive polish |
| **Magnet** | `@react-bits/Magnet-TS-TW` | Magnetic pull effect that draws buttons or icons towards the cursor. | CTAs, Nav icons, badges |
| **StarBorder** | `@react-bits/StarBorder-TS-TW` | Border with animated glowing star light rotating around the card perimeter. | Featured pricing tiers, highlighted cards |
| **ClickSpark** | `@react-bits/ClickSpark-TS-TW` | Particle explosion bursts originating from click coordinates. | Interactive feedback for buttons/cards |
| **PixelCard** | `@react-bits/PixelCard-TS-TW` | Pixelated digital noise reveal effect on hover. | Tech cards, feature showcases |

---

## 4. UI Components & Layouts

| Component | Registry Identifier | Description |
| :--- | :--- | :--- |
| **SpotlightCard** | `@react-bits/SpotlightCard-TS-TW` | Card container with a subtle radial gradient spotlight following mouse position. |
| **TiltedCard** | `@react-bits/TiltedCard-TS-TW` | Smooth 3D perspective tilt effect with glare reflection on mouse move. |
| **RollingGallery** | `@react-bits/RollingGallery-TS-TW` | 3D cylindrical carousel rotating images in a continuous loop. |
| **DomeGallery** | `@react-bits/DomeGallery-TS-TW` | Hemispherical 3D dome of interactive media cards. |
| **ElasticSlider** | `@react-bits/ElasticSlider-TS-TW` | Range/value slider with tactile rubber-band spring physics. |
| **InfiniteScroll** | `@react-bits/InfiniteScroll-TS-TW` | Seamless marquee loop for brand logos, reviews, or photo reels. |
| **FlowingMenu** | `@react-bits/FlowingMenu-TS-TW` | Fullscreen typographic menu where hover reveals floating preview images. |
