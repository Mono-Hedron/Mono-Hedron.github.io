import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import 'katex/dist/katex.min.css';

export function renderKatex(content) {
  renderMathInElement(content, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
    // Activate links in formula
    trust: (context) => context.command === String.raw`\href`,
  });
}
