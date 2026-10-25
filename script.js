/**
 * ============================================================================
 * SMART CALCULATOR - MAIN JAVASCRIPT (script.js)
 * ============================================================================
 * 
 * Features implemented:
 * 1. Vanilla JavaScript - No external frameworks or libraries.
 * 2. Safe Mathematical Evaluation with correct BODMAS operator precedence
 *    (Zero use of eval() for maximum security & interview standards).
 * 3. Accurate floating-point handling (eliminates 0.1 + 0.2 = 0.30000000000000004).
 * 4. Division by zero detection with friendly user error messages.
 * 5. Full Keyboard navigation & visual keypress animations.
 * 6. Calculation history with localStorage persistence, reload, & clear features.
 * 7. Dark / Light theme toggle with localStorage persistence.
 * 8. Optional Web Audio API tactile sound clicks (100% offline, zero assets).
 * 9. One-click Copy result to clipboard with toast notification.
 * 
 * ============================================================================
 */

// Encapsulate everything in an IIFE or clean Class structure to avoid global pollution
(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. DOM Element Selectors
     -------------------------------------------------------------------------- */
  // Displays
  const expressionDisplay = document.getElementById('expressionDisplay');
  const resultDisplay = document.getElementById('resultDisplay');
  const calcStatus = document.getElementById('calcStatus');

  // Keypad & Buttons
  const keypadGrid = document.getElementById('keypadGrid');
  const clearBtn = document.getElementById('btnClear');
  const deleteBtn = document.getElementById('btnDelete');
  const equalsBtn = document.getElementById('btnEquals');
  const copyResultBtn = document.getElementById('copyResultBtn');

  // Theme & Sound Controls
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundOnIcon = soundToggleBtn.querySelector('.sound-on-icon');
  const soundOffIcon = soundToggleBtn.querySelector('.sound-off-icon');

  // History Panel & Modal
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyBadge = document.getElementById('historyBadge');
  const historyPanel = document.getElementById('historyPanel');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');
  const historyEmpty = document.getElementById('historyEmpty');
  const backdrop = document.getElementById('backdrop');

  // Shortcuts Modal
  const keyboardInfoBtn = document.getElementById('keyboardInfoBtn');
  const shortcutsModal = document.getElementById('shortcutsModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // Toast Notification
  const toast = document.getElementById('toast');

  /* --------------------------------------------------------------------------
     2. Application State
     -------------------------------------------------------------------------- */
  const state = {
    currentOperand: '0',        // The number currently being typed
    previousOperand: '',       // The left-hand expression string
    operation: null,           // Current active operator ('+', '-', '×', '÷')
    isResultCalculated: false, // True if '=' was just pressed
    hasError: false,           // True if division by zero or invalid input
    history: [],               // Saved calculations array
    soundEnabled: true,        // Audio feedback toggle
    theme: 'dark'              // 'dark' (default) or 'light'
  };

  /* --------------------------------------------------------------------------
     3. Web Audio API Click Feedback (Zero External MP3 Assets)
     -------------------------------------------------------------------------- */
  let audioCtx = null;

  function playKeyClickSound(frequency = 600, duration = 0.035) {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio not supported or blocked by browser policy; fail silently
    }
  }

  /* --------------------------------------------------------------------------
     4. Number & Arithmetic Helper Functions
     -------------------------------------------------------------------------- */

  /**
   * Cleans floating-point artifacts (e.g. 0.1 + 0.2 = 0.30000000000000004).
   * Strips unnecessary trailing zeroes and formats within readable bounds.
   */
  function cleanFloat(number) {
    if (isNaN(number)) return 'Error';
    if (!isFinite(number)) return 'Cannot divide by 0';

    // Round to 10 decimal precision to remove IEEE 754 precision noise
    const factor = 1e10;
    const rounded = Math.round((number + Number.EPSILON) * factor) / factor;

    // For extremely large or microscopic numbers, use scientific notation
    if (Math.abs(rounded) >= 1e14 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 1e-9)) {
      return rounded.toExponential(6).replace(/\.?0+e/, 'e');
    }

    return rounded.toString();
  }

  /**
   * Safe Expression Evaluator with Operator Precedence (BODMAS: ×/÷ before +/-)
   * Without using eval() or new Function()!
   */
  function evaluateExpressionString(expr) {
    // 1. Replace UI symbols with standard math symbols
    const cleanExpr = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-');

    // 2. Tokenize into numbers and operators
    const tokens = [];
    let currentNum = '';

    for (let i = 0; i < cleanExpr.length; i++) {
      const char = cleanExpr[i];

      // Handle negative numbers: at the start or immediately after an operator
      if (char === '-' && (i === 0 || ['+', '-', '*', '/'].includes(cleanExpr[i - 1].trim()))) {
        currentNum += char;
        continue;
      }

      if (['+', '-', '*', '/'].includes(char)) {
        if (currentNum !== '') {
          tokens.push(parseFloat(currentNum));
          currentNum = '';
        }
        tokens.push(char);
      } else if (char !== ' ') {
        currentNum += char;
      }
    }

    if (currentNum !== '') {
      tokens.push(parseFloat(currentNum));
    }

    if (tokens.length === 0) return 0;
    if (tokens.length === 1 && typeof tokens[0] === 'number') return tokens[0];

    // 3. First Pass: Handle High Precedence Operators (* and /)
    const pass1 = [];
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === '*' || token === '/') {
        const prevNum = pass1.pop();
        const nextNum = tokens[i + 1];

        if (nextNum === undefined || isNaN(nextNum)) {
          throw new Error('Invalid Expression');
        }

        if (token === '/') {
          if (nextNum === 0 || Math.abs(nextNum) < 1e-15) {
            throw new Error('Cannot divide by 0');
          }
          pass1.push(prevNum / nextNum);
        } else {
          pass1.push(prevNum * nextNum);
        }
        i += 2; // Skip operator and next number
      } else {
        pass1.push(token);
        i++;
      }
    }

    // 4. Second Pass: Handle Low Precedence Operators (+ and -)
    let result = pass1[0];
    let j = 1;
    while (j < pass1.length) {
      const op = pass1[j];
      const nextNum = pass1[j + 1];

      if (nextNum === undefined || isNaN(nextNum)) {
        throw new Error('Invalid Expression');
      }

      if (op === '+') {
        result += nextNum;
      } else if (op === '-') {
        result -= nextNum;
      }
      j += 2;
    }

    return result;
  }

  /* --------------------------------------------------------------------------
     5. Calculator UI Updates & Display Management
     -------------------------------------------------------------------------- */

  function updateDisplay() {
    // 1. Update Result Display with size auto-scaling
    resultDisplay.textContent = state.currentOperand;

    // Adjust font size dynamically for long numbers
    const len = state.currentOperand.length;
    resultDisplay.classList.remove('long-text', 'very-long-text');
    if (len > 12) {
      resultDisplay.classList.add('very-long-text');
    } else if (len > 8) {
      resultDisplay.classList.add('long-text');
    }

    // 2. Update Expression Display
    if (state.previousOperand !== '') {
      expressionDisplay.textContent = state.previousOperand;
    } else {
      expressionDisplay.textContent = '';
    }

    // 3. Update status indicator
    if (state.hasError) {
      calcStatus.textContent = 'Error';
      calcStatus.style.setProperty('--status-color', '#ef4444');
    } else if (state.isResultCalculated) {
      calcStatus.textContent = 'Calculated';
    } else if (state.operation) {
      calcStatus.textContent = 'Calculating...';
    } else {
      calcStatus.textContent = 'Ready';
    }

    // 4. Highlight active operator button if waiting for next operand
    document.querySelectorAll('.btn-operator').forEach((btn) => {
      if (state.operation && btn.getAttribute('data-operator') === state.operation && !state.isResultCalculated) {
        btn.classList.add('active-op');
      } else {
        btn.classList.remove('active-op');
      }
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    toast.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      toast.classList.remove('show');
      toast.setAttribute('aria-hidden', 'true');
    }, 2200);
  }

  /* --------------------------------------------------------------------------
     6. Calculator Core Actions
     -------------------------------------------------------------------------- */

  /**
   * Appends a number digit (0-9) to the current operand
   */
  function appendNumber(number) {
    playKeyClickSound(650);

    // If an error was showing or a calculation was just finalized, start fresh
    if (state.hasError || state.isResultCalculated) {
      state.currentOperand = number;
      if (state.isResultCalculated) {
        state.previousOperand = '';
      }
      state.isResultCalculated = false;
      state.hasError = false;
      updateDisplay();
      return;
    }

    // Prevent multiple leading zeros (e.g. "0000")
    if (state.currentOperand === '0') {
      state.currentOperand = number;
    } else {
      // Limit input length to 15 digits to avoid overflow
      if (state.currentOperand.replace(/[-.]/g, '').length >= 15) return;
      state.currentOperand += number;
    }

    updateDisplay();
  }

  /**
   * Appends decimal point (.) ensuring only one decimal point exists per operand
   */
  function appendDecimal() {
    playKeyClickSound(700);

    if (state.hasError || state.isResultCalculated) {
      state.currentOperand = '0.';
      if (state.isResultCalculated) {
        state.previousOperand = '';
      }
      state.isResultCalculated = false;
      state.hasError = false;
      updateDisplay();
      return;
    }

    // Prevent multiple decimals in the same number
    if (state.currentOperand.includes('.')) return;

    if (state.currentOperand === '' || state.currentOperand === '-') {
      state.currentOperand += '0.';
    } else {
      state.currentOperand += '.';
    }

    updateDisplay();
  }

  /**
   * Sets or chains an arithmetic operator (+, -, ×, ÷)
   */
  function chooseOperator(operator) {
    playKeyClickSound(800);

    if (state.hasError) return;

    // If result was just calculated, chain from the result
    if (state.isResultCalculated) {
      state.previousOperand = `${state.currentOperand} ${operator} `;
      state.currentOperand = '0';
      state.operation = operator;
      state.isResultCalculated = false;
      updateDisplay();
      return;
    }

    // If user clicked an operator repeatedly, update to the newly clicked operator
    if (state.currentOperand === '0' && state.previousOperand !== '') {
      state.previousOperand = state.previousOperand.trim().replace(/[+\-×÷]$/, operator) + ' ';
      state.operation = operator;
      updateDisplay();
      return;
    }

    // Normal chaining: append current number and operator to previous operand expression
    state.previousOperand += `${state.currentOperand} ${operator} `;
    state.currentOperand = '0';
    state.operation = operator;

    updateDisplay();
  }

  /**
   * Toggles positive / negative sign on current operand
   */
  function toggleSign() {
    playKeyClickSound(550);

    if (state.hasError) return;

    if (state.currentOperand === '0' || state.currentOperand === '') return;

    if (state.currentOperand.startsWith('-')) {
      state.currentOperand = state.currentOperand.slice(1);
    } else {
      state.currentOperand = '-' + state.currentOperand;
    }

    updateDisplay();
  }

  /**
   * Calculates Percentage (%)
   * If there is an existing expression like "200 + 10%", computes 10% of 200 = 20.
   * Otherwise converts the current number to its percentage value (num / 100).
   */
  function calculatePercentage() {
    playKeyClickSound(750);

    if (state.hasError) return;

    const currentVal = parseFloat(state.currentOperand);
    if (isNaN(currentVal)) return;

    // Check if there is an active addition or subtraction in previous operand
    if (state.previousOperand.trim() !== '') {
      const parts = state.previousOperand.trim().split(' ');
      const baseNum = parseFloat(parts[0]);
      const lastOp = parts[parts.length - 1];

      if (!isNaN(baseNum) && (lastOp === '+' || lastOp === '-')) {
        // e.g. 100 + 15% -> 15% of 100 is 15
        const percentVal = (baseNum * currentVal) / 100;
        state.currentOperand = cleanFloat(percentVal);
        updateDisplay();
        return;
      }
    }

    // Standard percentage: num / 100
    state.currentOperand = cleanFloat(currentVal / 100);
    updateDisplay();
  }

  /**
   * Clears everything (AC)
   */
  function clearAll() {
    playKeyClickSound(450);

    state.currentOperand = '0';
    state.previousOperand = '';
    state.operation = null;
    state.isResultCalculated = false;
    state.hasError = false;

    updateDisplay();
  }

  /**
   * Deletes the last character from current operand (DEL)
   */
  function deleteLastChar() {
    playKeyClickSound(500);

    if (state.hasError || state.isResultCalculated) {
      clearAll();
      return;
    }

    if (state.currentOperand.length === 1 || (state.currentOperand.length === 2 && state.currentOperand.startsWith('-'))) {
      state.currentOperand = '0';
    } else {
      state.currentOperand = state.currentOperand.slice(0, -1);
    }

    updateDisplay();
  }

  /**
   * Computes the final calculation (=)
   */
  function calculateResult() {
    playKeyClickSound(950, 0.05);

    if (state.hasError) return;

    // Nothing to calculate if no operation was queued
    if (state.previousOperand === '' && !state.operation) return;

    const fullExpression = (state.previousOperand + state.currentOperand).trim();

    try {
      const result = evaluateExpressionString(fullExpression);
      const formattedResult = cleanFloat(result);

      if (formattedResult === 'Cannot divide by 0') {
        state.hasError = true;
        state.currentOperand = formattedResult;
        state.previousOperand = fullExpression + ' =';
        updateDisplay();
        return;
      }

      // Add to Calculation History
      addHistoryItem(fullExpression, formattedResult);

      // Update state with result
      state.previousOperand = `${fullExpression} =`;
      state.currentOperand = formattedResult;
      state.operation = null;
      state.isResultCalculated = true;
      state.hasError = false;

      updateDisplay();
    } catch (err) {
      state.hasError = true;
      state.currentOperand = err.message || 'Error';
      state.previousOperand = fullExpression + ' =';
      updateDisplay();
    }
  }

  /* --------------------------------------------------------------------------
     7. Calculation History & localStorage Management
     -------------------------------------------------------------------------- */

  const HISTORY_STORAGE_KEY = 'smart_calculator_history';
  const MAX_HISTORY_ITEMS = 30;

  function loadHistoryFromStorage() {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        state.history = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
      state.history = [];
    }
    renderHistory();
  }

  function saveHistoryToStorage() {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state.history));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }

  function addHistoryItem(expression, result) {
    const newItem = {
      id: Date.now().toString(),
      expression: expression,
      result: result,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.history.unshift(newItem); // Add new calculation to top
    if (state.history.length > MAX_HISTORY_ITEMS) {
      state.history.pop();
    }

    saveHistoryToStorage();
    renderHistory();
  }

  function renderHistory() {
    // Update badge count
    historyBadge.textContent = state.history.length;

    if (state.history.length === 0) {
      historyEmpty.style.display = 'flex';
      historyList.innerHTML = '';
      return;
    }

    historyEmpty.style.display = 'none';
    historyList.innerHTML = '';

    state.history.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'history-item';
      li.setAttribute('tabindex', '0');
      li.setAttribute('role', 'button');
      li.setAttribute('title', `Click to load ${item.result} into calculator`);

      li.innerHTML = `
        <div class="history-item-meta">
          <span>Calculation</span>
          <span class="history-item-time">${item.time}</span>
        </div>
        <div class="history-item-expr">${item.expression} =</div>
        <div class="history-item-result">${item.result}</div>
      `;

      // Click to reuse result in calculator
      const handleReuse = () => {
        playKeyClickSound(700);
        state.currentOperand = item.result;
        state.previousOperand = '';
        state.operation = null;
        state.isResultCalculated = true;
        state.hasError = false;
        updateDisplay();
        showToast(`Loaded ${item.result}`);

        // Close history panel and return to calculator
        toggleHistoryPanel(false);
      };

      li.addEventListener('click', handleReuse);
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleReuse();
        }
      });

      historyList.appendChild(li);
    });
  }

  function clearHistory() {
    if (state.history.length === 0) return;
    playKeyClickSound(400);

    state.history = [];
    saveHistoryToStorage();
    renderHistory();
    showToast('History cleared');
  }

  function toggleHistoryPanel(forceOpen) {
    const isOpen = typeof forceOpen === 'boolean' 
      ? forceOpen 
      : !historyPanel.classList.contains('open');

    if (isOpen) {
      historyPanel.classList.add('open');
      backdrop.classList.add('show');
    } else {
      historyPanel.classList.remove('open');
      backdrop.classList.remove('show');
    }
  }

  /* --------------------------------------------------------------------------
     8. Theme Management (Dark by Default, Light Mode Toggle)
     -------------------------------------------------------------------------- */
  const THEME_STORAGE_KEY = 'smart_calculator_theme';

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    // Dark theme by default unless explicitly saved as light
    state.theme = savedTheme === 'light' ? 'light' : 'dark';
    applyTheme(state.theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }

  function toggleTheme() {
    playKeyClickSound(850);
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    showToast(`Switched to ${state.theme} theme`);
  }

  /* --------------------------------------------------------------------------
     9. Copy to Clipboard
     -------------------------------------------------------------------------- */
  async function copyCurrentResult() {
    playKeyClickSound(600);
    const textToCopy = state.currentOperand;

    if (!textToCopy || state.hasError) {
      showToast('Nothing to copy');
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers or non-https environments
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      showToast(`Copied "${textToCopy}" to clipboard!`);
    } catch (err) {
      showToast('Failed to copy');
    }
  }

  /* --------------------------------------------------------------------------
     10. Keypad Event Delegation & Keyboard Binding
     -------------------------------------------------------------------------- */

  /**
   * Provide visual button press feedback
   */
  function flashButton(btnElement) {
    if (!btnElement) return;
    btnElement.classList.add('btn-pressed');
    setTimeout(() => {
      btnElement.classList.remove('btn-pressed');
    }, 140);
  }

  // Click handling on keypad grid using event delegation
  keypadGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    flashButton(btn);

    // Number button
    if (btn.hasAttribute('data-number')) {
      appendNumber(btn.getAttribute('data-number'));
      return;
    }

    // Operator button
    if (btn.hasAttribute('data-operator')) {
      chooseOperator(btn.getAttribute('data-operator'));
      return;
    }

    // Action button
    const action = btn.getAttribute('data-action');
    switch (action) {
      case 'clear':
        clearAll();
        break;
      case 'delete':
        deleteLastChar();
        break;
      case 'decimal':
        appendDecimal();
        break;
      case 'toggle-sign':
        toggleSign();
        break;
      case 'percent':
        calculatePercentage();
        break;
      case 'calculate':
        calculateResult();
        break;
      default:
        break;
    }
  });

  // Physical Keyboard Support
  window.addEventListener('keydown', (e) => {
    // Avoid capturing inputs if a modal or input is focused
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const key = e.key;

    // 1. Numbers 0-9
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      appendNumber(key);
      const btn = keypadGrid.querySelector(`[data-number="${key}"]`);
      flashButton(btn);
      return;
    }

    // 2. Operators: +, -, *, /
    if (['+', '-', '*', '/'].includes(key)) {
      e.preventDefault();
      let opSymbol = key;
      if (key === '*') opSymbol = '×';
      if (key === '/') opSymbol = '÷';

      chooseOperator(opSymbol);
      const btn = keypadGrid.querySelector(`[data-operator="${opSymbol}"]`);
      flashButton(btn);
      return;
    }

    // 3. Decimal Point
    if (key === '.') {
      e.preventDefault();
      appendDecimal();
      const btn = document.getElementById('btnDecimal');
      flashButton(btn);
      return;
    }

    // 4. Percentage (%)
    if (key === '%') {
      e.preventDefault();
      calculatePercentage();
      const btn = document.getElementById('btnPercent');
      flashButton(btn);
      return;
    }

    // 5. Calculate Result: Enter or '='
    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      calculateResult();
      flashButton(equalsBtn);
      return;
    }

    // 6. Delete Last Character: Backspace
    if (key === 'Backspace') {
      e.preventDefault();
      deleteLastChar();
      flashButton(deleteBtn);
      return;
    }

    // 7. Clear All: Escape
    if (key === 'Escape') {
      e.preventDefault();
      // If modal is open, close modal; else clear calculator
      if (shortcutsModal.classList.contains('show')) {
        toggleModal(false);
      } else if (historyPanel.classList.contains('open')) {
        toggleHistoryPanel(false);
      } else {
        clearAll();
        flashButton(clearBtn);
      }
      return;
    }

    // 8. Quick shortcut: 'h' or 'H' to toggle History
    if (key === 'h' || key === 'H') {
      e.preventDefault();
      toggleHistoryPanel();
    }
  });

  /* --------------------------------------------------------------------------
     11. Modal Controls & Sound Toggle
     -------------------------------------------------------------------------- */
  function toggleModal(forceOpen) {
    playKeyClickSound(650);
    const isOpen = typeof forceOpen === 'boolean'
      ? forceOpen
      : !shortcutsModal.classList.contains('show');

    if (isOpen) {
      shortcutsModal.classList.add('show');
      backdrop.classList.add('show');
      shortcutsModal.setAttribute('aria-hidden', 'false');
    } else {
      shortcutsModal.classList.remove('show');
      backdrop.classList.remove('show');
      shortcutsModal.setAttribute('aria-hidden', 'true');
    }
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
      playKeyClickSound(700);
      showToast('Sound enabled');
    } else {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
      showToast('Sound muted');
    }
  }

  /* --------------------------------------------------------------------------
     12. Initial Event Listener Attachments
     -------------------------------------------------------------------------- */
  themeToggleBtn.addEventListener('click', toggleTheme);
  soundToggleBtn.addEventListener('click', toggleSound);
  copyResultBtn.addEventListener('click', copyCurrentResult);
  clearHistoryBtn.addEventListener('click', clearHistory);

  historyToggleBtn.addEventListener('click', () => toggleHistoryPanel());
  closeHistoryBtn.addEventListener('click', () => toggleHistoryPanel(false));
  backdrop.addEventListener('click', () => {
    toggleHistoryPanel(false);
    toggleModal(false);
  });

  keyboardInfoBtn.addEventListener('click', () => toggleModal(true));
  closeModalBtn.addEventListener('click', () => toggleModal(false));

  /* --------------------------------------------------------------------------
     13. App Initialization
     -------------------------------------------------------------------------- */
  function initApp() {
    initTheme();
    loadHistoryFromStorage();
    updateDisplay();
  }

  // Start app once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
