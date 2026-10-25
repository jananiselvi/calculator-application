# 🧮 Smart Calculator Web Application

A sleek, responsive, and feature-rich **Smart Calculator** built exclusively with **HTML5**, **CSS3**, and **Vanilla JavaScript** (no external libraries, frameworks, or dependencies). 

Designed with a modern glassmorphic interface, dark/light themes, calculation history with `localStorage` persistence, tactile keyboard navigation, and a safe mathematical parser that respects **BODMAS/PEMDAS** operator precedence without using unsafe functions like `eval()`.

---

## 🌟 Live Features

1. **Core Arithmetic Calculations**:
   - Addition (`+`), Subtraction (`−`), Multiplication (`×`), and Division (`÷`).
   - Percentage calculations (`%`) with both standalone (`50% = 0.5`) and contextual arithmetic (`200 + 10% = 220`).
   - Positive/Negative sign toggle (`±`).
   - All Clear (`AC`) and character-by-character Delete (`DEL`).
   - Decimal point support with duplicate prevention (e.g., prevents `3.14.15`).

2. **Safe Mathematical Evaluation & Precision**:
   - **BODMAS / PEMDAS Precedence**: Multiplication and division are executed before addition and subtraction.
   - **Zero `eval()` Security**: Custom two-pass mathematical tokenizer and evaluator for safety against code injection.
   - **Accurate Floating-Point Math**: Rounds precision artifacts (e.g., `0.1 + 0.2 = 0.3`, instead of `0.30000000000000004`).
   - **Friendly Division by Zero**: Displays `"Cannot divide by 0"` instead of crashing or showing `Infinity`.

3. **Persistent Calculation History**:
   - Automatically saves up to 30 recent calculations with timestamps to the browser's `localStorage`.
   - **Interactive Reuse**: Click any previous calculation result to immediately load it back into the calculator.
   - History count badge and a one-click **Clear History** button.
   - Clean, friendly empty state when no history exists.

4. **Dark & Light Mode Themes**:
   - Dark theme by default with high-contrast text and ambient light glows.
   - Smooth toggle to a clean Light theme with one click.
   - Persists your chosen theme across browser refreshes via `localStorage`.
   - Built with modern CSS Custom Properties (Variables).

5. **Full Keyboard Support**:
   - `0`–`9` for digits.
   - `+`, `-`, `*`, `/` for arithmetic operations.
   - `Enter` or `=` to calculate results.
   - `Backspace` to delete the last character.
   - `Escape` to clear everything (`AC`).
   - `.` for decimals and `%` for percentages.
   - `H` to toggle calculation history.
   - **Visual Feedback**: Buttons visibly press and glow when corresponding keys are pressed on your physical keyboard.

6. **Tactile Sound Feedback & Clipboard Copy**:
   - Subtle, realistic key click audio synthesized via the native **Web Audio API** (100% offline, zero external audio files).
   - Sound toggle button to mute or enable audio anytime.
   - One-click **Copy Result** button with animated confirmation toast.

7. **Fully Responsive Layout**:
   - **Desktop**: Dual-card layout with calculator and history side-by-side.
   - **Mobile & Tablet**: Smooth slide-over history drawer with backdrop overlay.

---

## 📂 Project Structure

```text
smart-calculator/
├── index.html        # Semantic HTML5 markup, display, keypad grid, modal
├── style.css         # CSS3 design system, themes, animations, responsiveness
├── script.js         # Vanilla JavaScript logic, precedence parser, localStorage
└── README.md         # Documentation, explanations, and interview cheat sheet
```

---

## 🔍 How Each File Works (Beginner's Explanation)

### 1. `index.html` (Structure & Semantics)
- **Semantic Tags**: Uses `<header>`, `<main>`, `<section>`, `<aside>`, and `<footer>` for accessibility and SEO.
- **Display Area (`.display-container`)**: Contains two lines:
  - An **expression line** (`#expressionDisplay`) showing the running formula (e.g., `12.5 × 4 + 8 =`).
  - A **primary result line** (`#resultDisplay`) displaying the current operand or answer in a large, readable font.
- **Keypad Grid (`#keypadGrid`)**: A 4-column CSS Grid containing buttons categorized with `data-number`, `data-operator`, and `data-action` custom attributes.
- **History Panel (`#historyPanel`)**: Positioned as an `<aside>` element. On wide screens, it sits alongside the calculator; on narrow screens, it functions as an off-canvas drawer.
- **Shortcuts Modal (`#shortcutsModal`)**: Accessible dialog showing keyboard key maps with `<kbd>` tags.

### 2. `style.css` (Design, Variables & Responsiveness)
- **CSS Custom Properties (`:root` & `[data-theme="light"]`)**:
  - Centralizes design tokens such as colors, borders, shadows, and radii. Switching themes only requires updating the `data-theme` attribute on the `<html>` root tag.
- **Modern Glassmorphism**:
  - Uses `backdrop-filter: blur(20px)` combined with subtle translucent borders (`rgba(255, 255, 255, 0.08)`) and multi-layer drop shadows.
- **Micro-Interactions**:
  - Buttons use `:active` and `.btn-pressed` classes to scale down (`transform: scale(0.93)`) with inner inset shadows, simulating real tactile mechanical key switches.
  - The Equals button features a vibrant gradient (`linear-gradient(135deg, #6366f1, #8b5cf6)`) and distinct drop shadow.
- **Mobile First & Responsive Breakpoints**:
  - `@media (max-width: 860px)` transitions the history panel from a side card into an off-screen drawer (`transform: translateX(100%)`).
  - `@media (max-width: 480px)` scales key sizes and displays down cleanly for smartphones.

### 3. `script.js` (Logic & Functionality)
- **Encapsulated Scope**:
  - Uses an Immediately Invoked Function Expression (`(function() { ... })()`) to prevent global namespace pollution.
- **State Management (`state`)**:
  - Tracks `currentOperand`, `previousOperand`, `operation`, `isResultCalculated`, `hasError`, `history`, `soundEnabled`, and `theme`.
- **Safe BODMAS Parser (`evaluateExpressionString`)**:
  - Converts UI operator symbols into tokens.
  - **Pass 1**: Multiplications (`*`) and Divisions (`/`) are executed first.
  - **Pass 2**: Additions (`+`) and Subtractions (`-`) are executed second.
  - Completely avoids `eval()` for enterprise security standards.
- **Precision Floating-Point Fix (`cleanFloat`)**:
  - Standard JavaScript represents numbers using IEEE 754 64-bit floats, causing `0.1 + 0.2` to equal `0.30000000000000004`. The `cleanFloat` helper rounds to 10 decimal places and strips excess zeroes using `Math.round((num + Number.EPSILON) * 1e10) / 1e10`.
- **Event Delegation**:
  - Keypad clicks are handled using a single event listener on `#keypadGrid` using `e.target.closest('button')`, boosting performance and reducing memory usage.
- **`localStorage` Integration**:
  - Automatically loads and saves the calculation history list and the current theme choice.

---

## 🚀 How to Run the Project Locally

No installation, build tools, or packages are needed!

### Option 1: Direct File Open
1. Navigate to the project directory on your computer.
2. Double-click `index.html` to open it in any modern browser (Chrome, Edge, Firefox, Safari).

### Option 2: Live Server (VS Code / IDE)
1. Open the project folder in VS Code or your IDE.
2. Right-click `index.html` and click **"Open with Live Server"**.
3. The project will open at `http://127.0.0.1:5500/index.html`.

### Option 3: Python Built-in Server
Open your terminal in the project directory and run:
```bash
# Python 3
python -m http.server 3000
```
Then visit `http://localhost:3000` in your web browser.

---

## 🎓 Junior Developer Portfolio & Interview Q&A

Here are common interview questions interviewers ask about calculator projects and how this codebase answers them:

### Q1: Why did you avoid `eval()` to calculate mathematical expressions?
> **Answer**: `eval()` executes arbitrary strings as JavaScript code. Using it introduces critical **XSS (Cross-Site Scripting)** vulnerabilities and makes input validation difficult. In this project, I built a safe two-pass tokenizer that parses numbers and operators according to standard **BODMAS** precedence rules without executing arbitrary code.

### Q2: Why does `0.1 + 0.2` equal `0.30000000000000004` in JavaScript, and how did you resolve it?
> **Answer**: JavaScript numbers are standard IEEE 754 double-precision 64-bit binary floating-point numbers. In binary, fractional numbers like `0.1` and `0.2` are repeating infinite fractions, which introduces slight precision artifacts when added. I resolved this by creating the `cleanFloat` function, which rounds results using `Number.EPSILON` to 10 decimal digits and strips unnecessary trailing zeros.

### Q3: What is Event Delegation and how is it used in the keypad?
> **Answer**: Instead of attaching 20 individual `click` event listeners to each calculator button, event delegation attaches a single event listener to the parent container (`#keypadGrid`). When a click occurs, it bubbles up to the parent where `e.target.closest('button')` identifies which button was pressed and reads its `data-*` attributes. This reduces memory overhead and simplifies DOM management.

### Q4: How does dark mode persistence work?
> **Answer**: When the user clicks the theme toggle button, the application toggles the `data-theme` attribute on the `<html>` root between `"dark"` and `"light"`. The chosen string is then saved to browser `localStorage` using `localStorage.setItem('smart_calculator_theme', theme)`. On initial page load, `initTheme()` retrieves this value so the user's preference is remembered even after closing the tab.

---

## 📄 License
This project is open source and available for portfolio and educational use.
