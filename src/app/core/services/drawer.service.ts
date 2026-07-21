import { Injectable, signal, computed } from '@angular/core';

export type AppDrawerType = 'admin' | 'event' | null;

@Injectable({
  providedIn: 'root'
})
export class DrawerService {
  readonly drawerType = signal<AppDrawerType>(null);
  readonly isOpen = computed(() => this.drawerType() !== null);
  readonly drawerData = signal<unknown>(null);

  public openAdminDrawer(): void {
    this.drawerType.set('admin');
  }

  public openEventDrawer(data?: unknown): void {
    this.drawerData.set(data);
    this.drawerType.set('event');
  }

  public close(): void {
    this.drawerType.set(null);
    this.drawerData.set(null);
  }
}
