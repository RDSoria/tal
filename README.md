# TAL (Token-efficient Agent Language)

**The ultra-compressed UI composition language for AI Agents.**

TAL is a domain-specific language (DSL) designed to solve the "verbose output" problem of LLMs. By abstracting CSS classes, HTML structure, and layout logic into single-character symbols and dot-notation tokens, TAL reduces the token cost of generating UIs by **80-90%** compared to writing raw HTML/Tailwind or JSX.

## 🚀 Why TAL?

1.  **Cost Efficiency:** Drastically lowers API costs by minimizing completion tokens.
2.  **Low Latency:** Faster generation means snappier UI streaming for the user.
3.  **Modern Aesthetics:** Defaults to a premium, dark-mode, glassmorphic design system. No more "Bootstrap look".
4.  **CSP Compliant:** TAL renders to static HTML at build time (SSG). It does not execute arbitrary JavaScript or unsanitized HTML in the browser.

## 🛠️ Usage

### 1. Generate Code using an LLM
Feed the content of `tal.system.md` to your AI agent (Claude, GPT-4, etc.) as a system prompt. It will learn to speak TAL.

**Input:** "Make a pricing card with a title '$20', a description 'For pros', and a Buy button."
**Output:** `d.card.f.jc[h.h2{$20}t.sub{For pros}b.btn{Buy}]`

### 2. Build to HTML
Run the included Node.js transpiler to convert the raw TAL string into a standalone HTML file.

```bash
# 1. Save your TAL code to code.tal (or let the script auto-generate a demo)
# 2. Run the build script
node tal.build.js

# 3. Open the output
open index.html
```

## 🎨 Design System (v1.0)
TAL comes with a built-in design dictionary implementation in `tal.build.js`.

*   **Containers:** `^` (Main), `s` (Section), `d` (Div)
*   **Content:** `h` (Heading), `t` (Text), `b` (Button)
*   **Layout:** `.f` (Flex Col), `.fr` (Flex Row), `.g3` (Grid 3)
*   **Style:** `.dark` (Theme), `.card` (Surface), `.sh` (Shadow)

## 📄 License
MIT
