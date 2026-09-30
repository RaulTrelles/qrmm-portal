/**
 * Robust clipboard copy function with fallback for insecure contexts (HTTP / LAN IP)
 * In browsers, `navigator.clipboard` is only available in Secure Contexts (HTTPS or localhost).
 * On HTTP IP addresses like http://192.168.1.42:5173, fallback via textarea + execCommand is required.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern navigator.clipboard API if available and in secure context
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, falling back to textarea:", err);
    }
  }

  // 2. Fallback for HTTP (non-secure context) and older browsers
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Ensure element is not visible and doesn't trigger scroll
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    textArea.style.opacity = "0";
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    // For iOS compatibility
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback clipboard copy failed:", err);
    return false;
  }
}
