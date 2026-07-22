import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  title = signal<string | null>(null);
  showBackBtn = signal<boolean>(false);
  backUrl = signal<string>('/');
}
