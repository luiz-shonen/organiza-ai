import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SecretSantaCardComponent, type SecretSantaShareLink } from './secret-santa-card.component';
import type { SecretSantaParticipant } from '../../../../core/models';

describe('SecretSantaCardComponent', () => {
  let fixture: ComponentFixture<SecretSantaCardComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const button = (testId: string) =>
    el().querySelector(
      `[data-testid="${testId}"] button, button[data-testid="${testId}"]`,
    ) as HTMLButtonElement | null;

  const people: SecretSantaParticipant[] = ['Ana', 'Bruno', 'Carla'].map((name, i) => ({
    id: `p${i}`,
    name,
    phone: '',
    giftOptions: [],
  }));
  const links: SecretSantaShareLink[] = people.map((p) => ({
    participantId: p.id,
    name: p.name,
    phone: p.name === 'Ana' ? '(11) 98888-1111' : '',
    url: `https://organiza.app/amigo-oculto/tok-${p.id}`,
    openedAt: p.name === 'Bruno' ? '2026-11-16T23:49:00.000Z' : null,
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretSantaCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SecretSantaCardComponent);
    fixture.componentRef.setInput('participants', people);
    fixture.detectChanges();
  });

  it('gives collaborators no draw button', () => {
    expect(button('secret-santa-draw-btn')).toBeNull();
  });

  it('lets the owner draw once there are enough participants', () => {
    let draws = 0;
    fixture.componentInstance.draw.subscribe(() => draws++);
    fixture.componentRef.setInput('isOwner', true);
    fixture.detectChanges();
    button('secret-santa-draw-btn')!.click();
    expect(draws).toBe(1);

    fixture.componentRef.setInput('participants', people.slice(0, 2));
    fixture.detectChanges();
    expect(button('secret-santa-draw-btn')).toBeNull();
    // How many are missing is said by the participants list, not again here.
    expect(el().querySelector('[data-testid="secret-santa-too-few"]')).toBeNull();
  });

  it('after the draw, lists each link to send by WhatsApp, never who drew whom', () => {
    const sent: SecretSantaShareLink[] = [];
    fixture.componentInstance.send.subscribe((link) => sent.push(link));
    fixture.componentRef.setInput('isOwner', true);
    fixture.componentRef.setInput('drawnAt', '2026-11-16T20:00:00.000Z');
    fixture.componentRef.setInput('links', links);
    fixture.detectChanges();

    const list = el().querySelector('[data-testid="secret-santa-links"]')!;
    expect(list.querySelectorAll('li')).toHaveLength(3);
    expect(list.textContent).toContain('(11) 98888-1111');
    expect(list.textContent).toContain('Sem telefone');
    (
      list.querySelector('org-button[label="Enviar no WhatsApp"] button') as HTMLButtonElement
    ).click();
    expect(sent[0].name).toBe('Ana');
    expect(button('secret-santa-redraw-btn')).not.toBeNull();
  });

  it('keeps the draw button off until the draw day chosen for the event', () => {
    fixture.componentRef.setInput('isOwner', true);
    fixture.componentRef.setInput('drawDate', '2099-12-20');
    fixture.detectChanges();
    expect(button('secret-santa-draw-btn')!.disabled).toBe(true);
    expect(el().querySelector('[data-testid="secret-santa-draw-locked"]')?.textContent).toContain(
      '20 de dezembro',
    );

    fixture.componentRef.setInput('drawDate', '2020-12-20');
    fixture.detectChanges();
    expect(button('secret-santa-draw-btn')!.disabled).toBe(false);
    expect(el().querySelector('[data-testid="secret-santa-draw-locked"]')).toBeNull();
  });

  it('after the draw, leaves out the sign-ups and the duplicates: only the links matter', () => {
    fixture.componentRef.setInput('isOwner', true);
    fixture.componentRef.setInput('duplicates', [
      {
        keep: { id: 'a', name: 'Ana', phone: '', giftOptions: [], joinedBy: 'u1' },
        drop: { id: 'b', name: 'Ana', phone: '', giftOptions: [] },
        sure: false,
      },
    ]);
    fixture.componentRef.setInput('drawnAt', '2026-11-16T20:00:00.000Z');
    fixture.componentRef.setInput('links', links);
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="secret-santa-self-join"]')).toBeNull();
    expect(el().querySelector('[data-testid="secret-santa-duplicate"]')).toBeNull();
    expect(el().querySelector('[data-testid="secret-santa-drawn"]')?.textContent).toContain(
      '1 de 3 já abriram o link.',
    );
  });

  it('warns when the list changed after the draw', () => {
    fixture.componentRef.setInput('isOwner', true);
    fixture.componentRef.setInput('drawnAt', '2026-11-16T20:00:00.000Z');
    fixture.componentRef.setInput('outdated', true);
    fixture.detectChanges();
    expect(el().textContent).toContain('mudou depois do sorteio');
  });

  it('shows who already opened their link, and offers a new link for each person', () => {
    const resent: SecretSantaShareLink[] = [];
    fixture.componentInstance.resend.subscribe((link) => resent.push(link));
    fixture.componentRef.setInput('isOwner', true);
    fixture.componentRef.setInput('drawnAt', '2026-11-16T20:00:00.000Z');
    fixture.componentRef.setInput('links', links);
    fixture.detectChanges();

    expect(el().textContent).toContain('1 de 3 já abriram');
    const statuses = [...el().querySelectorAll('[data-testid="secret-santa-link-status"]')].map(
      (s) => s.textContent?.trim(),
    );
    expect(statuses[0]).toBe('Ainda não abriu');
    expect(statuses[1]).toMatch(/^Abriu em \d{2}\/\d{2}, às /);

    const bruno = el().querySelectorAll('[data-testid="secret-santa-links"] li')[1];
    (bruno.querySelector('org-button[label="Novo link"] button') as HTMLButtonElement).click();
    expect(resent[0].name).toBe('Bruno');
  });

  it('counts who joined from the invite', () => {
    fixture.componentRef.setInput('participants', [
      ...people,
      { id: 'rsvp_u1', name: 'Maria', phone: '', giftOptions: [], joinedBy: 'u1' },
    ]);
    fixture.detectChanges();
    expect(el().textContent).toContain('1 entrou pelo convite');
    expect(el().querySelector('[data-testid="secret-santa-count-tag"]')?.textContent).toContain(
      '4 no sorteio',
    );
  });

  it('points out a possible duplicate, to join or to keep apart', () => {
    const pair = {
      keep: { id: 'rsvp_u1', name: 'Ana Souza', phone: '', giftOptions: [], joinedBy: 'u1' },
      drop: { id: 'm1', name: 'Ana Souza', phone: '(11) 97777-0000', giftOptions: [] },
      sure: false,
    };
    fixture.componentRef.setInput('duplicates', [pair]);
    fixture.detectChanges();
    const merge = vi.fn();
    const distinct = vi.fn();
    fixture.componentInstance.merge.subscribe(merge);
    fixture.componentInstance.distinct.subscribe(distinct);

    expect(el().querySelector('[data-testid="secret-santa-duplicate"]')?.textContent).toContain(
      'Possível repetido: Ana Souza (adicionado à mão, (11) 97777-0000) e Ana Souza (entrou pelo convite)',
    );
    button('secret-santa-merge-btn')?.click();
    button('secret-santa-distinct-btn')?.click();
    expect(merge).toHaveBeenCalledWith(pair);
    expect(distinct).toHaveBeenCalledWith(pair);
  });

  it('lets only the owner open or close the sign-ups from the invite', () => {
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="secret-santa-self-join"]')).toBeNull();

    fixture.componentRef.setInput('isOwner', true);
    fixture.detectChanges();
    const changed = vi.fn();
    fixture.componentInstance.selfJoinChange.subscribe(changed);
    (
      el().querySelector('[data-testid="secret-santa-self-join"] button') as HTMLInputElement
    ).click();
    expect(changed).toHaveBeenCalledWith(false);

    fixture.componentRef.setInput('selfJoinOpen', false);
    fixture.detectChanges();
    expect(el().textContent).toContain('Fechado: ninguém novo entra pelo convite');
  });

  it("gives the organizer's own link only 'Abrir link' and 'Novo link'", () => {
    const opened: SecretSantaShareLink[] = [];
    fixture.componentInstance.openOwn.subscribe((link) => opened.push(link));
    fixture.componentRef.setInput('isOwner', true);
    fixture.componentRef.setInput('drawnAt', '2026-11-16T20:00:00.000Z');
    fixture.componentRef.setInput('links', [{ ...links[0], self: true }]);
    fixture.detectChanges();

    const item = el().querySelector('[data-testid="secret-santa-links"] li')!;
    expect(item.textContent).toContain('Novo link');
    expect(item.textContent).not.toContain('WhatsApp');
    expect(item.textContent).not.toContain('Copiar');
    button('secret-santa-open-own-btn')!.click();
    expect(opened).toEqual([{ ...links[0], self: true }]);
  });

  it('only shows where things stand while the event is cancelled', () => {
    fixture.componentRef.setInput('isOwner', true);
    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="secret-santa-locked"]')).not.toBeNull();
    expect(button('secret-santa-draw-btn')).toBeNull();
    expect(el().querySelector('[data-testid="secret-santa-self-join"]')).toBeNull();
  });
});
