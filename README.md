# Bahrain Passage — Interactive Travel Chronicle

A premium, immersive digital travel guide for the Kingdom of Bahrain. Built as a multi-page interactive experience that lets travelers discover authentic local spots, curate personal itineraries, and collect keepsakes from 18 historically rich landmarks.

## Features

- **Mood-Based Itinerary Builder** — Select your travel vibes (Empires, Sea, Spice, Lights) to generate a personalised day-by-day itinerary
- **Wayfarer Ledger Dashboard** — A journal-style interface with day tabs, spot guides, and insider secrets
- **Wayfarer Lens** — Camera viewfinder that captures polaroid snapshots with local storyteller narration
- **Passport & XP System** — Earn XP, collect keepsakes, and rank up from Wanderer to Dilmun Pearl
- **Interactive Map** — Explore landmark positions across Bahrain
- **Lexicon Leaf** — Learn key Arabic travel phrases with audio pronunciation
- **Gold Fils Economy** — Spend earned coins in the virtual Souq shop

## Tech Stack

- React 19 + Vite
- TailwindCSS v4
- GSAP (GreenSock Animation Platform)
- Swiper.js
- Lucide React icons

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
  components/     # UI components (Dashboard, WelcomeIntro, MoodSelector, etc.)
  context/        # Global state via VibeContext / VibeProvider
  hooks/          # useItinerary, useVibe custom hooks
  services/       # Itinerary and storyteller API service
  styles/         # Global CSS and design tokens
```

## Landmarks Covered

18 curated authentic Bahraini landmarks spanning:
- Ancient forts (Qal'at al-Bahrain, Arad Fort, Riffa Fort, Barbar Temple)
- UNESCO heritage trails (Pearling Path, Muharraq Souq)
- Natural wonders (Tree of Life, Jarada Island)
- Cultural districts (Block 338, Al Jasra, A'ali Pottery)
- Coastal escapes (Al Dar Islands, Reef Island, Khalaf House)
