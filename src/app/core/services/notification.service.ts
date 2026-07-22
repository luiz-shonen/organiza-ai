import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private hasPermission = false;

  constructor() {
    this.checkPermission();
  }

  private async checkPermission(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações de desktop');
      return;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
    }
  }

  sendLocalNotification(title: string, body: string, icon?: string): void {
    if (!this.hasPermission) return;

    try {
      new Notification(title, {
        body,
        icon: icon || '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
      } as any);
    } catch (e) {
      console.error('Erro ao disparar notificação local', e);
    }
  }
}
