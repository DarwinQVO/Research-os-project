export function arrayToCommaSeparated(arr: string[]): string {
  return arr.join(', ');
}

export function commaSeparatedToArray(str: string): string[] {
  if (!str || str.trim() === '') return [];
  return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

export function formatTags(tags: string[]): string {
  return tags.map(tag => tag.trim()).filter(tag => tag.length > 0).join(', ');
}

export function parseTags(input: string): string[] {
  return commaSeparatedToArray(input);
}