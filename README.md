# Persona Planner 📓

A Persona 5-inspired daily planner and diary app built with React Native + Expo Go.

## Setup

```bash
# Install dependencies
npm install

# Start Expo
npx expo start
```

Then scan the QR code with **Expo Go** on your phone.

## Features

- **3 Time Slots** per day: Morning, Afternoon, Evening
- **Plan ahead** — assign tasks to future days
- **Diary mode** — past days are locked as a record; empty slots auto-complete when you fill them in
- **Blocking rule** — can't plan future if past days have unfilled slots
- **Calendar view** — see colored dots showing completion status for every day
- **Fully offline** — all data stored locally via AsyncStorage

## Rules

| Day Type | Empty slot behavior | Task editing |
|---|---|---|
| Past | Must fill in → auto-completes instantly | ✅ Editable |
| Today | Fill in + manually mark complete | ✅ Editable |
| Future | Plan ahead freely | ✅ Delete only |

## Tech Stack

- React Native + Expo Go
- TypeScript
- AsyncStorage (`@react-native-async-storage/async-storage`)
- Lucide React Native (icons)
- React Native SVG
