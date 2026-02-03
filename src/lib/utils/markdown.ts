/**
 * Simple Markdown to HTML converter
 * Handles common Markdown syntax without external dependencies
 */

/**
 * Detect if content is Markdown (not HTML)
 */
export function isMarkdown(content: string): boolean {
  if (!content) return false;

  // If it starts with HTML tags, it's probably HTML
  const trimmed = content.trim();
  if (trimmed.startsWith('<') && !trimmed.startsWith('<http')) {
    return false;
  }

  // Check for common Markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m,           // Headers: # ## ### etc.
    /^\*\s/m,               // Unordered list with *
    /^-\s/m,                // Unordered list with -
    /^\d+\.\s/m,            // Ordered list
    /\*\*[^*]+\*\*/,        // Bold **text**
    /\*[^*]+\*/,            // Italic *text*
    /\[.+\]\(.+\)/,         // Links [text](url)
    /^>/m,                  // Blockquote
    /```/,                  // Code blocks
    /^---$/m,               // Horizontal rule
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
}

/**
 * Convert Markdown to HTML
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Escape HTML entities first (but preserve intentional HTML if mixed)
  // html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre><code class="language-${lang || 'text'}">${escapedCode.trim()}</code></pre>`;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers (## Header)
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Strikethrough (~~text~~)
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-terracotta-600 hover:underline">$1</a>');

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-4" />');

  // Callouts/Admonitions (GitHub-style: > [!NOTE], > [!IMPORTANT], > [!WARNING], > [!TIP], > [!CAUTION])
  // First, detect and convert callout blocks
  html = html.replace(/^>\s*\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\s*\n((?:>\s*.*\n?)*)/gim, (_, type, content) => {
    const cleanContent = content.replace(/^>\s*/gm, '').trim();
    const typeUpper = type.toUpperCase();
    const colors: Record<string, { bg: string; border: string; icon: string }> = {
      NOTE: { bg: 'bg-blue-50', border: 'border-blue-400', icon: 'ℹ️' },
      IMPORTANT: { bg: 'bg-amber-50', border: 'border-amber-400', icon: '⚠️' },
      WARNING: { bg: 'bg-red-50', border: 'border-red-400', icon: '🚨' },
      TIP: { bg: 'bg-green-50', border: 'border-green-400', icon: '💡' },
      CAUTION: { bg: 'bg-orange-50', border: 'border-orange-400', icon: '⚡' },
    };
    const style = colors[typeUpper] || colors.NOTE;
    return `<div class="my-4 p-4 rounded-lg border-l-4 ${style.border} ${style.bg}">
      <div class="flex items-start gap-2">
        <span class="text-lg">${style.icon}</span>
        <div class="flex-1"><strong>${typeUpper}</strong><br/>${cleanContent}</div>
      </div>
    </div>`;
  });

  // Blockquotes (> quote) - simple ones
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Horizontal rule (--- or ***)
  html = html.replace(/^(---|___|\*\*\*)$/gm, '<hr />');

  // Unordered lists
  html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)(?=\n(?!<li>)|$)/g, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\n<ul>/g, '\n');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<oli>$1</oli>');
  // Wrap consecutive <oli> in <ol>
  html = html.replace(/(<oli>[\s\S]*?<\/oli>)(?=\n(?!<oli>)|$)/g, '<ol>$1</ol>');
  html = html.replace(/<\/ol>\n<ol>/g, '\n');
  html = html.replace(/<\/?oli>/g, (match) => match === '<oli>' ? '<li>' : '</li>');

  // Paragraphs - wrap text blocks not already in tags
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inParagraph = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      processedLines.push('');
      continue;
    }

    // Check if line is already wrapped in a block element
    const isBlockElement = /^<(h[1-6]|p|div|ul|ol|li|blockquote|pre|hr|table|thead|tbody|tr|td|th)[\s>]/i.test(trimmedLine);

    if (isBlockElement) {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      processedLines.push(line);
    } else {
      if (!inParagraph) {
        processedLines.push('<p>' + line);
        inParagraph = true;
      } else {
        processedLines.push('<br />' + line);
      }
    }
  }

  if (inParagraph) {
    processedLines.push('</p>');
  }

  html = processedLines.join('\n');

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

/**
 * Process content - convert from Markdown if needed
 */
export function processContent(content: string): string {
  if (!content) return '';

  // If it looks like Markdown, convert it
  if (isMarkdown(content)) {
    return markdownToHtml(content);
  }

  // Otherwise return as-is (already HTML)
  return content;
}
