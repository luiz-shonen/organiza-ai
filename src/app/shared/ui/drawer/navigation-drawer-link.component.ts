import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navigation-drawer-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
  templateUrl: './navigation-drawer-link.component.html',
  styleUrl: './navigation-drawer-link.component.scss',
})
export class NavigationDrawerLinkComponent {
  public readonly route = input<string | null>(null);
  public readonly href = input<string | null>(null);
  public readonly icon = input.required<string>();
  public readonly label = input.required<string>();
  public readonly testId = input.required<string>();
  public readonly active = input(false);
  public readonly currentValue = input<'page' | 'location' | 'true'>('page');
  public readonly selected = output<void>();
}
