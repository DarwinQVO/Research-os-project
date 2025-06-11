import { extract } from '@extractus/oembed-extractor';

export interface SourceInput {
  url: string;
  title: string;
  author?: string;
  publishedAt?: string;
  type: 'article' | 'video' | 'social' | 'other';
  description?: string;
  thumbnail?: string;
}

/**
 * Extract metadata from a URL using oEmbed for supported sites (YouTube, etc)
 * and fallback to meta tag parsing for others
 */
export async function fetchMetadata(url: string): Promise<SourceInput> {
  try {
    // First, try oEmbed for supported providers (YouTube, Vimeo, etc)
    if (isOEmbedSupported(url)) {
      try {
        const oembedData = await extract(url);
        if (oembedData) {
          // If oEmbed doesn't have date (common with YouTube), fall through to HTML parsing
          if (!(oembedData as any).published_date) {
            console.log('oEmbed data found but no date, falling through to HTML parsing');
          } else {
            return {
              url,
              title: oembedData.title || new URL(url).hostname,
              author: oembedData.author_name,
              publishedAt: (oembedData as any).published_date,
              type: oembedData.type === 'video' ? 'video' : 'article',
              description: (oembedData as any).description,
              thumbnail: oembedData.thumbnail_url
            };
          }
        }
      } catch (oembedError) {
        console.error('oEmbed extraction failed:', oembedError);
        // Fall through to HTML parsing
      }
    }

    // Fallback to HTML meta tag parsing (always do this for comprehensive data)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResearchOS/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const htmlMetadata = parseMetaTags(html, url);
    
    // If we have oEmbed data, merge it with HTML data (HTML takes precedence for missing data)
    if (isOEmbedSupported(url)) {
      try {
        const oembedData = await extract(url);
        if (oembedData) {
          return {
            url,
            title: oembedData.title || htmlMetadata.title,
            author: htmlMetadata.author || oembedData.author_name,
            publishedAt: htmlMetadata.publishedAt || (oembedData as any).published_date,
            type: oembedData.type === 'video' ? 'video' : htmlMetadata.type,
            description: htmlMetadata.description || (oembedData as any).description,
            thumbnail: oembedData.thumbnail_url || htmlMetadata.thumbnail
          };
        }
      } catch {
        // oEmbed failed, use HTML data
      }
    }
    
    return htmlMetadata;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    // Return minimal metadata on error
    return {
      url,
      title: new URL(url).hostname,
      type: 'other'
    };
  }
}

/**
 * Check if URL is supported by oEmbed providers
 */
function isOEmbedSupported(url: string): boolean {
  const supportedDomains = [
    'youtube.com',
    'youtu.be',
    'vimeo.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'flickr.com',
    'soundcloud.com',
    'spotify.com'
  ];

  const urlObj = new URL(url);
  return supportedDomains.some(domain => urlObj.hostname.includes(domain));
}

/**
 * Parse HTML meta tags to extract metadata
 */
function parseMetaTags(html: string, url: string): SourceInput {
  const metadata: SourceInput = {
    url,
    title: new URL(url).hostname,
    type: 'article'
  };

  // Extract title
  const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                     html.match(/<meta\s+name="twitter:title"\s+content="([^"]+)"/i) ||
                     html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    metadata.title = decodeHTMLEntities(titleMatch[1]);
  }

  // Extract author - try JSON-LD first, then meta tags
  let authorFound = false;
  
  // Try JSON-LD structured data first (reuse previous match if exists)
  const authorJsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (authorJsonLdMatch) {
    try {
      const jsonLd = JSON.parse(authorJsonLdMatch[1]);
      if (jsonLd.author) {
        if (Array.isArray(jsonLd.author) && jsonLd.author[0]?.name) {
          metadata.author = jsonLd.author[0].name;
          authorFound = true;
        } else if (jsonLd.author.name) {
          metadata.author = jsonLd.author.name;
          authorFound = true;
        } else if (typeof jsonLd.author === 'string') {
          metadata.author = jsonLd.author;
          authorFound = true;
        }
      }
    } catch {
      // Invalid JSON, continue to meta tags
    }
  }

  // If no author found in JSON-LD, try meta tags
  if (!authorFound) {
    const authorMatch = html.match(/<meta\s+name="author"\s+content="([^"]+)"/i) ||
                        html.match(/<meta\s+property="article:author"\s+content="([^"]+)"/i) ||
                        html.match(/<meta\s+name="twitter:creator"\s+content="([^"]+)"/i);
    if (authorMatch) {
      metadata.author = decodeHTMLEntities(authorMatch[1]);
    }
  }

  // Extract published date using advanced multi-source extraction
  metadata.publishedAt = extractPublishedDate(html, url);

  // Extract description
  const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
                    html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ||
                    html.match(/<meta\s+name="twitter:description"\s+content="([^"]+)"/i);
  if (descMatch) {
    metadata.description = decodeHTMLEntities(descMatch[1]);
  }

  // Extract thumbnail
  const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                     html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
  if (imageMatch) {
    metadata.thumbnail = imageMatch[1];
  }

  // Detect type based on URL patterns or meta tags
  const typeMatch = html.match(/<meta\s+property="og:type"\s+content="([^"]+)"/i);
  if (typeMatch) {
    const ogType = typeMatch[1].toLowerCase();
    if (ogType.includes('video')) {
      metadata.type = 'video';
    } else if (ogType.includes('article') || ogType.includes('blog')) {
      metadata.type = 'article';
    }
  }

  // Check for social media platforms
  const urlObj = new URL(url);
  if (urlObj.hostname.includes('twitter.com') || 
      urlObj.hostname.includes('x.com') || 
      urlObj.hostname.includes('instagram.com') ||
      urlObj.hostname.includes('facebook.com') ||
      urlObj.hostname.includes('linkedin.com')) {
    metadata.type = 'social';
  }

  return metadata;
}

/**
 * Advanced date extraction from multiple sources
 */
function extractPublishedDate(html: string, url: string): string | undefined {
  const urlObj = new URL(url);
  
  // Method 1: YouTube-specific extraction
  if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
    const youtubeDate = extractYouTubeDate(html);
    if (youtubeDate) return youtubeDate;
  }
  
  // Method 2: JSON-LD structured data (schema.org)
  const jsonLdDate = extractJsonLdDate(html);
  if (jsonLdDate) return jsonLdDate;
  
  // Method 3: Advanced meta tag patterns
  const metaDate = extractMetaTagDate(html);
  if (metaDate) return metaDate;
  
  // Method 4: URL pattern analysis (e.g., /2023/12/article-title)
  const urlDate = extractDateFromUrl(url);
  if (urlDate) return urlDate;
  
  // Method 5: Content analysis ("Published on", "Posted:", etc.)
  const contentDate = extractDateFromContent(html);
  if (contentDate) return contentDate;
  
  return undefined;
}

/**
 * Extract date from YouTube videos
 */
function extractYouTubeDate(html: string): string | undefined {
  // YouTube stores dates in multiple JSON objects
  const patterns = [
    /"publishDate":"([^"]+)"/,
    /"publishedTimeText":\{"simpleText":"([^"]+)"/,
    /"uploadDate":"([^"]+)"/,
    /"dateText":\{"simpleText":"([^"]+)"/
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const dateStr = match[1];
      const date = parseFlexibleDate(dateStr);
      if (date) return date;
    }
  }
  
  return undefined;
}

/**
 * Extract date from JSON-LD structured data
 */
function extractJsonLdDate(html: string): string | undefined {
  const scriptTags = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (!scriptTags) return undefined;
  
  for (const scriptTag of scriptTags) {
    try {
      const content = scriptTag.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
      if (!content) continue;
      const jsonLd = JSON.parse(content);
      
      // Handle different JSON-LD structures
      const dateFields = [
        jsonLd.datePublished,
        jsonLd.dateCreated,
        jsonLd.uploadDate,
        jsonLd.dateModified,
        jsonLd.publishedDate
      ];
      
      for (const dateField of dateFields) {
        if (dateField) {
          const date = parseFlexibleDate(dateField);
          if (date) return date;
        }
      }
      
      // Handle array of JSON-LD objects
      if (Array.isArray(jsonLd)) {
        for (const item of jsonLd) {
          if (item.datePublished) {
            const date = parseFlexibleDate(item.datePublished);
            if (date) return date;
          }
        }
      }
    } catch {
      // Invalid JSON, continue
    }
  }
  
  return undefined;
}

/**
 * Extract date from meta tags with comprehensive patterns
 */
function extractMetaTagDate(html: string): string | undefined {
  const metaPatterns = [
    // Standard meta tags
    /<meta\s+property="article:published_time"\s+content="([^"]+)"/i,
    /<meta\s+name="publish_date"\s+content="([^"]+)"/i,
    /<meta\s+name="publication_date"\s+content="([^"]+)"/i,
    /<meta\s+name="date"\s+content="([^"]+)"/i,
    /<meta\s+property="article:published"\s+content="([^"]+)"/i,
    /<meta\s+name="pubdate"\s+content="([^"]+)"/i,
    /<meta\s+name="DC\.date"\s+content="([^"]+)"/i,
    /<meta\s+name="DC\.Date"\s+content="([^"]+)"/i,
    /<meta\s+name="sailthru\.date"\s+content="([^"]+)"/i,
    /<meta\s+property="book:release_date"\s+content="([^"]+)"/i,
    
    // WordPress and CMS specific
    /<meta\s+property="article:modified_time"\s+content="([^"]+)"/i,
    /<meta\s+name="parsely-pub-date"\s+content="([^"]+)"/i,
    /<meta\s+name="byl"\s+content="[^"]*([0-9]{4}-[0-9]{2}-[0-9]{2})"/i,
    
    // News sites
    /<meta\s+name="timestamp"\s+content="([^"]+)"/i,
    /<meta\s+name="publish-time"\s+content="([^"]+)"/i,
    /<meta\s+property="og:updated_time"\s+content="([^"]+)"/i,
    
    // Time elements
    /<time[^>]+datetime="([^"]+)"/i,
    /<time[^>]+pubdate[^>]*datetime="([^"]+)"/i
  ];
  
  for (const pattern of metaPatterns) {
    const match = html.match(pattern);
    if (match) {
      const date = parseFlexibleDate(match[1]);
      if (date) return date;
    }
  }
  
  return undefined;
}

/**
 * Extract date from URL patterns
 */
function extractDateFromUrl(url: string): string | undefined {
  const urlPatterns = [
    // Common blog patterns: /2023/12/05/title or /2023/12/title
    /\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//,
    /\/(\d{4})\/(\d{1,2})\//,
    /\/(\d{4})-(\d{1,2})-(\d{1,2})/,
    /\/(\d{4})-(\d{1,2})/,
    
    // Date in query params: ?date=2023-12-05
    /[?&]date=([\d-]+)/,
    /[?&]published=([\d-]+)/
  ];
  
  for (const pattern of urlPatterns) {
    const match = url.match(pattern);
    if (match) {
      let dateStr;
      if (match[3]) {
        // Year-month-day
        dateStr = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      } else if (match[2]) {
        // Year-month (use first day)
        dateStr = `${match[1]}-${match[2].padStart(2, '0')}-01`;
      } else {
        dateStr = match[1];
      }
      
      const date = parseFlexibleDate(dateStr);
      if (date) return date;
    }
  }
  
  return undefined;
}

/**
 * Extract date from content text patterns
 */
function extractDateFromContent(html: string): string | undefined {
  // Remove script and style tags to focus on content
  const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                       .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  const contentPatterns = [
    // "Published on December 5, 2023"
    /Published\s+on\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /Published:\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    
    // "Posted: 2023-12-05"
    /Posted:?\s*([\d-\/]+)/i,
    
    // "Date: December 5, 2023"
    /Date:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    
    // "12/05/2023" or "05/12/2023"
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    
    // "Updated: 2023-12-05"
    /Updated:?\s*([\d-]+)/i
  ];
  
  for (const pattern of contentPatterns) {
    const match = cleanHtml.match(pattern);
    if (match) {
      const date = parseFlexibleDate(match[1]);
      if (date) return date;
    }
  }
  
  return undefined;
}

/**
 * Parse various date formats into YYYY-MM-DD
 */
function parseFlexibleDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  
  try {
    // Handle relative dates
    if (dateStr.includes('ago')) {
      return parseRelativeDate(dateStr);
    }
    
    // Try direct parsing first
    let date = new Date(dateStr);
    
    // Handle MM/DD/YYYY format specifically
    if (isNaN(date.getTime()) && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [month, day, year] = dateStr.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Handle DD/MM/YYYY format (European)
    if (isNaN(date.getTime()) && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    if (!isNaN(date.getTime()) && date.getFullYear() > 1990 && date.getFullYear() <= new Date().getFullYear() + 1) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Invalid date
  }
  
  return undefined;
}

/**
 * Parse relative dates like "2 days ago", "1 month ago"
 */
function parseRelativeDate(dateStr: string): string | undefined {
  const now = new Date();
  const lowerStr = dateStr.toLowerCase();
  
  // "X days ago"
  const daysMatch = lowerStr.match(/(\d+)\s+days?\s+ago/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    now.setDate(now.getDate() - days);
    return now.toISOString().split('T')[0];
  }
  
  // "X months ago"
  const monthsMatch = lowerStr.match(/(\d+)\s+months?\s+ago/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1]);
    now.setMonth(now.getMonth() - months);
    return now.toISOString().split('T')[0];
  }
  
  // "X years ago"
  const yearsMatch = lowerStr.match(/(\d+)\s+years?\s+ago/);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    now.setFullYear(now.getFullYear() - years);
    return now.toISOString().split('T')[0];
  }
  
  return undefined;
}

/**
 * Decode HTML entities in text
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };

  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}