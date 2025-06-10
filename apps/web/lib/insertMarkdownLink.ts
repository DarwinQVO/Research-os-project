export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

export function insertMarkdownLink(
  textarea: HTMLTextAreaElement,
  url: string,
  linkText?: string
): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  
  // Use provided link text, selected text, or default to "link"
  const text = linkText || selectedText || 'link';
  const markdownLink = `[${text}](${url})`;
  
  // Replace the selected text with the markdown link
  const newValue = 
    textarea.value.substring(0, start) + 
    markdownLink + 
    textarea.value.substring(end);
  
  // Update textarea value
  textarea.value = newValue;
  
  // Set cursor position after the inserted link
  const newCursorPos = start + markdownLink.length;
  textarea.setSelectionRange(newCursorPos, newCursorPos);
  
  // Trigger change event
  const event = new Event('input', { bubbles: true });
  textarea.dispatchEvent(event);
}

export function getTextSelection(textarea: HTMLTextAreaElement): TextSelection {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value.substring(start, end);
  
  return { start, end, text };
}

export function wrapSelectionWithMarkdown(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string = prefix
): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  
  const wrappedText = `${prefix}${selectedText}${suffix}`;
  
  const newValue = 
    textarea.value.substring(0, start) + 
    wrappedText + 
    textarea.value.substring(end);
  
  textarea.value = newValue;
  
  // If no text was selected, place cursor between the markers
  if (selectedText === '') {
    const cursorPos = start + prefix.length;
    textarea.setSelectionRange(cursorPos, cursorPos);
  } else {
    // Select the wrapped text
    textarea.setSelectionRange(start, start + wrappedText.length);
  }
  
  const event = new Event('input', { bubbles: true });
  textarea.dispatchEvent(event);
}