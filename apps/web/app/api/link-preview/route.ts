import { NextResponse } from 'next/server';
// @ts-ignore - oembed-parser has type issues with package.json exports
import { extract } from 'oembed-parser';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Validate URL format
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    );
  }

  try {
    // Try oEmbed first for supported services
    try {
      const oembedData = await extract(url);
      if (oembedData) {
        return NextResponse.json({
          title: oembedData.title || '',
          description: oembedData.description || '',
          image: oembedData.thumbnail_url || '',
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
          type: oembedData.type || 'rich'
        }, {
          headers: {
            'Cache-Control': 's-maxage=86400, stale-while-revalidate'
          }
        });
      }
    } catch (oembedError) {
      console.log('oEmbed failed, trying HTML fetch:', oembedError);
    }

    // Fallback to basic HTML meta tag extraction
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Research-OS/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const domain = new URL(url).hostname;
    
    // Extract meta tags using simple regex (for production, consider using a proper HTML parser)
    const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i) ||
                      html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i) ||
                            html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);

    const title = titleMatch ? titleMatch[1] : domain;
    const description = descriptionMatch ? descriptionMatch[1] : '';
    const image = imageMatch ? imageMatch[1] : '';
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    return NextResponse.json({
      title,
      description,
      image,
      favicon,
      type: 'website'
    }, {
      headers: {
        'Cache-Control': 's-maxage=86400, stale-while-revalidate'
      }
    });

  } catch (error) {
    console.error('Link preview error:', error);
    
    // Return minimal fallback data
    const domain = new URL(url).hostname;
    return NextResponse.json({
      title: domain,
      description: '',
      image: '',
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      type: 'website'
    }, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate'
      }
    });
  }
}