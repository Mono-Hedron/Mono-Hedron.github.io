export function katexAlignedToPhantomPlugin() {
  return {
    name: 'katex-aligned-to-phantom',
    transformIndexHtml(code) {
      const alignedRegex = /\$\$\s*\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\s*\$\$/g;

      const transformedCode = code.replace(alignedRegex, (match, p1) => {
        const lines = p1
          .split(/\\\\/)
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.length === 0) return match;

        const firstLineParts = lines[0].split('&');
        const leftHandSide = firstLineParts[0].trim();

        const convertedLines = lines.map((line, index) => {
          if (index === 0) {
            return `$$${line.replace('&', '')}$$`;
          } else {
            // return `$$${line.replace('&', `\\phantom{${leftHandSide}}`)}$$`;
            if (line.startsWith('&')) {
              return `$$\\phantom{${leftHandSide}}${line.slice(1)}$$`;
            }
            return `$$${line.replace('&', `\\phantom{${leftHandSide}}`)}$$`;
          }
        });

        return convertedLines.join('\n');
      });

      return transformedCode;
    },
  };
}
