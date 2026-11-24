/**
 * Prints a whole HTML document of its own (a list made for paper) from a hidden frame, so only
 * that document goes to the printer, never the page around it. Waits for its fonts first.
 */
export function printHtmlDocument(html: string): void {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;';
  frame.srcdoc = html;
  frame.onload = () => {
    const view = frame.contentWindow;
    if (!view) return;
    const fontsReady = view.document.fonts?.ready ?? Promise.resolve();
    // Fonts from the web may never arrive offline: print anyway after a moment.
    const timeout = new Promise((resolve) => setTimeout(resolve, 1500));
    void Promise.race([fontsReady, timeout]).then(() => {
      view.focus();
      view.print();
      // The dialog blocks until closed on most browsers; the frame then goes away.
      setTimeout(() => frame.remove(), 1000);
    });
  };
  document.body.appendChild(frame);
}
