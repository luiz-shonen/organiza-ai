import { afterEach, describe, expect, it, vi } from 'vitest';
import { revealFirstInvalid } from './reveal-first-invalid';

describe('revealFirstInvalid', () => {
  afterEach(() => document.body.replaceChildren());

  const render = (html: string) => {
    const host = document.createElement('section');
    host.innerHTML = html;
    document.body.append(host);
    return host;
  };

  it('scrolls to the first field showing an error and puts the cursor in it', () => {
    const host = render(`
      <org-text-field id="name"><input /></org-text-field>
      <org-text-field id="phone"><input /><p class="org-text-field__error">Telefone é obrigatório</p></org-text-field>
      <org-textarea-field id="gifts"><textarea></textarea><p class="org-textarea-field__error">x</p></org-textarea-field>
    `);
    const phone = host.querySelector<HTMLElement>('#phone')!;
    const scroll = vi.fn();
    phone.scrollIntoView = scroll;

    revealFirstInvalid(host);

    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ block: 'center' }));
    expect(document.activeElement).toBe(phone.querySelector('input'));
  });

  it('does nothing when every field is fine', () => {
    const host = render('<org-text-field><input /></org-text-field>');
    revealFirstInvalid(host);
    expect(document.activeElement).toBe(document.body);
  });
});
