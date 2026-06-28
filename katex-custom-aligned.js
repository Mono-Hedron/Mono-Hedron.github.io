export function katexCustomAlignedPlugin() {
  return {
    name: 'katex-custom-aligned',
    transformIndexHtml(code) {
      const alignedRegex = /\$\$\s*\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\s*\$\$/g;
      const mobileMarker = /\\allowbreak/g;
      const transformedCode = code.replace(alignedRegex, (match, p1) => {
        const lines = breakIntoLines(p1);

        if (lines.length === 0) return match;

        let leftHandSide = '';
        for (const line of lines) {
          if (line.includes('&') && !line.startsWith('&')) {
            leftHandSide = line.split('&')[0].trim();
            break;
          }
        }

        if (!mobileMarker.test(p1)) return generateSeperatedLines(lines, leftHandSide);

        const pcLines = breakIntoLines(p1.replace(mobileMarker, ''));
        const pcResult = generateSeperatedLines(pcLines, leftHandSide);

        const mobileLines = breakIntoLines(p1.replace(mobileMarker, '\\\\ &'));
        const mobileResult = generateSeperatedLines(mobileLines, leftHandSide);

        return `
          <span class="pc-only">${pcResult}</span>
          <span class="mobile-only">${mobileResult}</span>
        `;
      });

      return transformedCode;
    },
  };
}

function breakIntoLines(text) {
  return text
    .split(/\\\\/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function generateSeperatedLines(lines, leftHandSide) {
  const convertedLines = lines.map((line) => {
    if (!line.startsWith('&')) {
      return `$$${line.replace('&', '')}$$`;
    }
    return `$$\\phantom{${leftHandSide}}${line.slice(1)}$$`;
  });

  return convertedLines.join('\n');
}
