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

        let leftHandSide = '';
        for (const line of lines) {
          if (line.includes('&') && !line.startsWith('&')) {
            leftHandSide = line.split('&')[0].trim();
            break;
          }
        }

        const convertedLines = lines.map((line) => {
          if (!line.startsWith('&')) {
            return `$$${line.replace('&', '')}$$`;
          }
          return `$$\\phantom{${leftHandSide}}${line.slice(1)}$$`;
        });

        return convertedLines.join('\n');
      });

      return transformedCode;
    },
  };
}
