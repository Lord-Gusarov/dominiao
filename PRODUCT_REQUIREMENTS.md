# Dominiao - Product Requirements Document

## Overview
Dominiao is a mobile-first domino scoreboard web app. It tracks scores for two teams across rounds in a domino game. Hosted at ghornedo.com/dominiao as a single-page PWA (installable, offline-capable).

## Core Functionality

### Scoreboard
- Two-team scoreboard (default names: "Nosotros" vs "Ellos" in Spanish, "Us" vs "Them" in English)
- Editable team names (max 12 characters)
- Large score display with count-up animation on score change
- Visual pop effect when a score updates
- Winner glow effect (gold shadow) when a team reaches the target score

### Game Modes
Three selectable modes via a mode bar at the top:
- **Classic to 200** — Standard domino game, target 200 points, no bonuses
- **To 500 with bonuses** — Long game, target 500 points, includes +25 bonus mechanic
- **Quick to 100** — Short game, target 100 points, no bonuses

Switching modes mid-game prompts a confirmation (current game is lost).

### Adding Points
- Custom numeric input per team with a "+" button to submit
- +25 Bonus buttons for each team (gold-styled)
- Bonus points cannot push a team's score to or past the target (shows a toast warning)
- Enter key submits the custom input

### Round History
- Scrollable list of all rounds played, shown newest-first
- Each entry shows: round number, points for team 1, points for team 2, bonus label if applicable
- Bonus rounds are labeled with a "b" suffix on the round number (e.g., "3b")
- Individual rounds can be deleted (with confirmation prompt)

### Win Condition
- When a team's total reaches the target, a full-screen overlay announces the winner
- Winner overlay offers three actions: Keep Playing, Share, New Game

### Bottom Action Bar
- Fixed at the bottom of the screen
- Undo button (appears only when rounds exist) — removes the last round
- Share button — uses native share API or copies score text to clipboard
- New Game button — confirms then resets rounds (keeps current mode)

## User Settings

### Language Toggle
- Spanish (default) and English
- Button in top-right corner toggles between ES/EN
- All UI text updates instantly; team names update if they match the default names
- Language preference persisted in localStorage

### Theme Toggle
- Dark mode (default) and light mode
- Button in top-right corner (sun/moon icon)
- Theme preference persisted in localStorage

## Technical Details

### Architecture
- Single HTML file (`index.html`) containing all HTML, CSS, and JavaScript
- No external dependencies or frameworks
- PWA with service worker (`sw.js`) and manifest (`manifest.json`)

### Data Persistence
- Game state (teams, rounds, mode, target, winShown) saved to localStorage
- Language and theme preferences each stored in separate localStorage keys

### Mobile Optimization
- Viewport meta prevents user scaling
- Safe area insets for notched devices
- Minimum touch target sizes (44-48px)
- Haptic feedback via Vibration API on score add, undo, share, and win
- iOS zoom prevention (all inputs >= 16px font)
- `touch-action: manipulation` to eliminate tap delay

### Design Language
- Dark theme: deep navy background (#1a1a2e), dark surface (#16213e), red accent (#e94560), green for team 2 (#2ecc71), gold for bonuses (#f5c518)
- Light theme: light gray background (#f0f0f5), white surfaces, adjusted accent colors
- 12px border radius on cards/buttons
- System font stack (-apple-system, BlinkMacSystemFont, Segoe UI, system-ui)
- Uppercase small section labels with letter spacing
- Max content width: 480px, centered

## Current UX Observations (for redesign consideration)
- The add-points section always shows +25 bonus buttons regardless of whether the current mode supports bonuses — could be confusing in non-bonus modes
- No visual progress indicator toward the target score (e.g., progress bar)
- The mode bar at the top takes up space and is rarely used mid-game
- Round history could benefit from swipe-to-delete instead of a small X button on mobile
- No match history or statistics across games
- No confetti or celebratory animation on win — just a simple overlay
- Share output is plain text only, no image/card generation
- The "New Game" button in the bottom bar opens a confirm dialog, while the mode bar also resets the game — two paths to the same action
- Custom point input and bonus buttons could be laid out more intuitively
- No onboarding or first-use guidance for new users
