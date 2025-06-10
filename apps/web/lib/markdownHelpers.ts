/**
 * Encode parentheses in URLs to prevent breaking markdown syntax
 */
export function encodeUrlForMarkdown(url: string): string {
  return url.replace(/\(/g, '%28').replace(/\)/g, '%29');
}

/**
 * Decode parentheses in URLs back to normal
 */
export function decodeUrlFromMarkdown(url: string): string {
  return url.replace(/%28/g, '(').replace(/%29/g, ')');
}

/**
 * Create a markdown link with proper URL encoding
 */
export function createMarkdownLink(text: string, url: string): string {
  const encodedUrl = encodeUrlForMarkdown(url);
  return `[${text}](${encodedUrl})`;
}

/**
 * Extract URL from markdown link, handling encoded parentheses
 */
export function extractUrlFromMarkdownLink(markdownLink: string): string | null {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/;
  const match = markdownLink.match(regex);
  
  if (match && match[2]) {
    return decodeUrlFromMarkdown(match[2]);
  }
  
  return null;
}