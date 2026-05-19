@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

html, body {
  background: #0a0a0a;
  color: #fafafa;
  font-feature-settings: "ss01", "cv11";
}

/* Custom Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #0a0a0a; }
::-webkit-scrollbar-thumb { background: #262626; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #404040; }

/* Number input ohne Spinner */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] { -moz-appearance: textfield; }

/* Tipp-Eingabe Input */
.score-input {
  @apply w-12 h-12 text-center text-2xl font-display font-bold bg-bg border border-border rounded-md focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors;
}

.score-input:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Sticky table header */
.table-sticky thead th {
  position: sticky;
  top: 0;
  background: #141414;
  z-index: 10;
}
