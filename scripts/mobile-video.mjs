import fs from 'node:fs';

// Presentation-only export treatment; never replaces content or advances state.
export async function applyMobileVideoProfile(page) {
  await page.addStyleTag({ content: fs.readFileSync(new URL('./mobile-video.css', import.meta.url), 'utf8') });
  await page.evaluate(() => {
    const typeset = () => {
      document.querySelectorAll('.demo-post-paper>p:not([data-mobile-typeset])').forEach(copy => {
        const original = copy.textContent;
        const parts = original.split('\n\n');
        const children = [];
        parts.forEach((text, index) => {
          if (index) children.push(document.createTextNode('\n\n'));
          const paragraph = document.createElement('span');
          paragraph.className = 'demo-copy-paragraph';
          paragraph.textContent = text;
          children.push(paragraph);
        });
        copy.replaceChildren(...children);
        copy.setAttribute('data-mobile-typeset', 'true');
        if (copy.textContent !== original) throw new Error('Export must preserve the exact generated copy.');
      });
    };
    new MutationObserver(typeset).observe(document.body, { childList: true, subtree: true });
    typeset();
  });
}
