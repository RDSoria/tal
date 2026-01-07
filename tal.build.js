/**
 * TAL (Token-efficient Agent Language) Build Script
 * Transpiles *.tal files into a single index.html
 */

const fs = require('fs');
const path = require('path');

// --- Configuration ---
const INPUT_FILE = 'code.tal';
const OUTPUT_FILE = 'index.html';

// --- Design Token Dictionary (v1.0) ---
const TOKENS = {
  // Tags
  '^': 'main',
  's': 'section',
  'd': 'div',
  't': 'p',
  'h': 'h1',
  'b': 'button',

  // Layout
  '.f': 'display:flex; flex-direction:column; gap:1.5rem;',
  '.fr': 'display:flex; flex-direction:row; gap:0;',
  '.row': 'display:flex; flex-direction:row; gap:1.5rem; align-items:center;',
  '.jc': 'justify-content:center; text-align:center;',
  '.jb': 'justify-content:space-between;',
  '.g2': 'display:grid; grid-template-columns:repeat(2, 1fr); gap:1.5rem;',
  '.g3': 'display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem;',

  // Custom Layouts
  '.sidebar': 'width:280px; flex-shrink:0; border-right:1px solid #334155; padding:2rem; display:flex; flex-direction:column; gap:1rem; height:100vh; position:sticky; top:0; background:rgba(15, 23, 42, 0.95);',
  '.main': 'flex:1; padding:3rem; overflow-y:auto; height:100vh;',
  '.w100': 'width:100%;',

  // Visuals
  '.dark': 'background-color:#0f172a; color:#f8fafc; min-height:100vh; font-family: system-ui, sans-serif; overflow:hidden;', // Overflow hidden for sticky layout
  '.card': 'background-color:rgba(30, 41, 59, 0.7); backdrop-filter:blur(12px); border-radius:1rem; padding:1.5rem; border:1px solid rgba(255,255,255,0.1); transition: transform 0.2s;',
  '.sh': 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);',
  '.code': 'font-family:monospace; background:#020617; padding:0.4em 0.6em; border-radius:0.375rem; color:#a5b4fc; font-size:0.9em; border:1px solid #1e293b; display:block; margin-top:0.5rem; white-space:pre-wrap;',
  '.badge': 'display:inline-block; padding:0.25rem 0.75rem; border-radius:9999px; font-size:0.75rem; font-weight:700; background:#06b6d4; color:#0f172a;',

  // Typography
  '.h1': 'font-size:3.5rem; line-height:1.1; font-weight:900; letter-spacing:-0.05em; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;',
  '.h2': 'font-size:2rem; line-height:2.5rem; font-weight:700; margin-bottom:0.5rem;',
  '.h3': 'font-size:1.25rem; font-weight:600; color:#e2e8f0;',
  '.sub': 'color:#94a3b8; font-size:1rem; line-height:1.6;',

  // Interactive
  '.btn': 'background-color:#06b6d4; color:#0f172a; font-weight:700; padding:0.75rem 1.5rem; border-radius:0.5rem; border:none; cursor:pointer; transition: all 0.2s; text-align:center;',
  '.btn2': 'background-color:#334155; color:#f8fafc; font-weight:600; padding:0.75rem 1.5rem; border-radius:0.5rem; border:none; cursor:pointer; transition: all 0.2s; text-align:center; hover:bg-slate-700;',
  '.btn:hover': 'transform:translateY(-1px); box-shadow:0 10px 15px -3px rgba(6, 182, 212, 0.2);',
};

// --- recursive parser ---
function parseTAL(str) {
  let html = '';
  let i = 0;

  function eat() {
    const char = str[i];
    i++;
    return char;
  }

  function peek() {
    return str[i];
  }

  // Parse a single logical node
  function parseNode() {
    let tag = 'div'; // default
    let styles = '';
    let content = '';
    let children = '';
    let action = '';
    let tagId = '';

    const startI = i;

    // Safety check for unknown chars causing infinite loop
    if (i < str.length && !TOKENS[peek()] && !['.', '!', '{', '['].includes(peek())) {
      // Current char is not a start of ANY valid sequence.
      // Skip it.
      eat();
      // If we are strict, we could return '' or error, but let's just skip and return nothing?
      // But parseNode expects to return string.
      // If we return empty string, caller appends nothing.
      return '';
    }

    // 1. Read Tag Symbol (if present)
    // If it starts with ., !, {, or [, then tag is implicit (often div, but let's stick to explicitly reading chars if they match map)
    if (TOKENS[peek()]) {
      tag = TOKENS[eat()];
    }


    // 2. Read Chained Modifiers (., !, #)
    while (i < str.length) {
      if (peek() === '.') {
        // Class token
        eat(); // consume .
        let token = '.';
        while (i < str.length && !['[', '{', '.', '!', ']', '#'].includes(peek())) {
          token += eat();
        }
        if (TOKENS[token]) {
          styles += TOKENS[token] + ' ';
        }
      } else if (peek() === '!') {
        // Action token
        eat(); // consume !
        let act = '';
        while (i < str.length && !['[', '{', '.', '!', ']', '#'].includes(peek())) {
          act += eat();
        }
        action = act;
      } else if (peek() === '#') {
        // ID token
        eat(); // consume #
        let idStr = '';
        while (i < str.length && !['[', '{', '.', '!', ']', '#'].includes(peek())) {
          idStr += eat();
        }
        tagId = idStr;
      } else {
        break;
      }
    }


    // 3. Read Content {}
    if (peek() === '{') {
      eat(); // {
      while (i < str.length && peek() !== '}') {
        content += eat();
      }
      eat(); // }
    }

    // 4. Read Children []
    if (peek() === '[') {
      eat(); // [
      while (i < str.length && peek() !== ']') {
        // Skip whitespace
        if (/\s/.test(peek())) {
          eat();
          continue;
        }
        children += parseNode();
      }
      eat(); // ]
    }

    // Construct HTML
    let styleAttr = styles ? ` style="${styles.trim()}"` : '';
    let actionAttr = action ? ` data-action="${action}" onclick="app.dispatch('${action}')"` : '';
    let idAttr = tagId ? ` id="${tagId}"` : '';

    // Auto-close void tags if needed, but for now we stick to standard container model
    return `<${tag}${idAttr}${styleAttr}${actionAttr}>${content}${children}</${tag}>`;
  }

  // Parse state variables [$var:val] at the start
  // For this v1, we strictly strip them or ignore them, as HTML doesn't need them unless we hydrate.
  // We'll just look for the Root ^ to start.
  while (i < str.length && peek() !== '^') {
    i++;
  }

  if (i < str.length) {
    return parseNode();
  }
  return '<h1 style="color:red">Error: No Valid Root (^) Found</h1>';
}

// --- Main Execution ---
function main() {
  try {
    if (!fs.existsSync(INPUT_FILE)) {
      // Create a demo file if none exists
      const demo = '[$theme:dark]^.dark[d.f.jc[h.h1{Hello TAL}t.sub{The future of AI UI is here.}d.fr.jc[b.btn!login{Get Started}b.btn2!docs{Read Docs}]]]';
      fs.writeFileSync(INPUT_FILE, demo);
      console.log('Created demo code.tal');
    }

    const talCode = fs.readFileSync(INPUT_FILE, 'utf8');
    const body = parseTAL(talCode);

    const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TAL Generated App</title>
    <style>
      /* Reset & Base */
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { line-height: 1.5; -webkit-font-smoothing: antialiased; }
      img, picture, video, canvas, svg { display: block; max-width: 100%; }
      input, button, textarea, select { font: inherit; }
      
      /* Navigation transitions */
      section { animation: fadeIn 0.3s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    ${body}
    <script>
      const app = {
        routes: {
          'nav_home': 'home',
          'nav_docs': 'docs',
          'nav_examples': 'examples',
          'nav_res': 'resources'
        },
        dispatch(action) {
           if (this.routes[action]) {
             this.navigate(this.routes[action]);
           } else {
             console.log('Action:', action);
           }
        },
        navigate(targetId) {
           // Hide all main sections
           const sections = ['home', 'docs', 'examples', 'resources'];
           sections.forEach(id => {
             const el = document.getElementById(id);
             if(el) el.style.display = 'none';
           });
           
           // Show target
           const target = document.getElementById(targetId);
           if(target) {
             target.style.display = 'flex'; // Assuming flex layout for sections
           }
        }
      };
      
      // Init: Show only home
      window.onload = () => {
         app.navigate('home');
      };
    </script>
</body>
</html>`;

    fs.writeFileSync(OUTPUT_FILE, template);
    console.log(`Build success! Generated ${OUTPUT_FILE} (${template.length} bytes)`);

  } catch (err) {
    console.error('Build Failed:', err);
  }
}

main();
