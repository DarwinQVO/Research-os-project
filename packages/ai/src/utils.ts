export function isYouTube(url: string) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return ['youtube.com', 'youtu.be'].includes(hostname);
  } catch { 
    return false; 
  }
}