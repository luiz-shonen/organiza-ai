import { computed, Injectable, signal } from '@angular/core';
import type {
  AppDrawerRequest,
  AppDrawerType,
  CollaboratorDrawerResult,
  RsvpDrawerResult,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class DrawerService {
  readonly request = signal<AppDrawerRequest | null>(null);
  readonly drawerType = computed<AppDrawerType | null>(() => this.request()?.kind ?? null);
  readonly isOpen = computed(() => this.request() !== null);

  public open(request: AppDrawerRequest): void {
    this.request.set(request);
  }

  public completeRsvp(result: RsvpDrawerResult): void {
    const request = this.request();
    if (request?.kind !== 'rsvp') {
      return;
    }

    request.onComplete(result);
    this.close();
  }

  public dispatchCollaboratorAction(result: CollaboratorDrawerResult): void {
    const request = this.request();
    if (request?.kind !== 'collaborator') {
      return;
    }

    request.onAction(result);
  }

  public close(): void {
    const trigger = this.request()?.trigger;
    this.request.set(null);

    if (trigger) {
      queueMicrotask(() => trigger.focus());
    }
  }
}
