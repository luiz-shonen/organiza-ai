import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import {
  DESIGN_SYSTEM_SECTIONS,
  type DesignSystemNavigationItem,
  type SeasonalThemeOption,
} from '../../core/models';
import { ThemeService } from '../../core/services/theme.service';
import {
  FeedbackService,
  OrgDialogService,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  type FeedbackVariant,
} from '../../shared/ui';
import { DesignSystemActionsComponent } from './design-system-actions.component';
import { DS_LIVE_COLOR_TOKENS } from './design-system-catalog';
import { DesignSystemDisplayComponent } from './design-system-display.component';
import {
  DesignSystemFeedbackComponent,
  type DesignSystemDialogDemo,
} from './design-system-feedback.component';
import { DesignSystemFormsComponent } from './design-system-forms.component';
import { DesignSystemFoundationsComponent } from './design-system-foundations.component';
import { DesignSystemNavigationComponent } from './design-system-navigation.component';

export type ShowcaseSection = DesignSystemNavigationItem;

/** Every anchored section of the page, in the order of the navigation drawer. */
export const SHOWCASE_SECTIONS: readonly ShowcaseSection[] = DESIGN_SYSTEM_SECTIONS;

const SEASONAL_CLASSES = ['theme-junina', 'theme-natal', 'theme-pascoa', 'theme-ano-novo'];

const TOASTS: Record<FeedbackVariant, string> = {
  success: 'Presença confirmada!',
  info: 'O convite foi reenviado para 3 pessoas.',
  error: 'Não foi possível salvar. Tente de novo.',
};

/**
 * /design-system (super admins): the living catalog of the `Org*` components and `--org-*`
 * tokens. The page owns what touches the outside world (theme, toasts, dialogs, reading the
 * live token values); each section component only shows demos.
 */
@Component({
  selector: 'app-design-system-showcase',
  imports: [
    DesignSystemActionsComponent,
    DesignSystemDisplayComponent,
    DesignSystemFeedbackComponent,
    DesignSystemFormsComponent,
    DesignSystemFoundationsComponent,
    DesignSystemNavigationComponent,
    OrgPageHeaderComponent,
    OrgPageLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-showcase.container.html',
  styleUrl: './design-system-showcase.container.scss',
})
export class DesignSystemShowcaseContainer {
  private readonly feedbackService = inject(FeedbackService);
  private readonly dialogService = inject(OrgDialogService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly theme = inject(ThemeService);

  public readonly activeSeasonalTheme = signal<SeasonalThemeOption>('default');
  protected readonly tokenValues = signal<Readonly<Record<string, string>>>({});
  protected readonly phone = signal(false);
  protected readonly dialogAnswer = signal<string | null>(null);

  /** The seasonal class the app had before the preview, put back when leaving the page. */
  private initialSeasonalClass: string | null = null;

  public constructor() {
    afterNextRender(() => {
      const root = document.documentElement;
      this.initialSeasonalClass =
        SEASONAL_CLASSES.find((name) => root.classList.contains(name)) ?? null;
      if (this.initialSeasonalClass) {
        this.activeSeasonalTheme.set(this.initialSeasonalClass as SeasonalThemeOption);
      }

      this.readTokenValues();
      // Dark mode and seasonal themes change classes on <html>; read the values again.
      const observer = new MutationObserver(() => this.readTokenValues());
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });

      const phoneQuery = window.matchMedia?.('(max-width: 599px)');
      const updatePhone = () => this.phone.set(!!phoneQuery?.matches);
      updatePhone();
      phoneQuery?.addEventListener('change', updatePhone);

      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        phoneQuery?.removeEventListener('change', updatePhone);
        this.applySeasonalClass(this.initialSeasonalClass);
      });
    });
  }

  public setSeasonalTheme(theme: SeasonalThemeOption): void {
    this.applySeasonalClass(theme === 'default' ? null : theme);
    this.activeSeasonalTheme.set(theme);
  }

  protected setDark(dark: boolean): void {
    this.theme.setMode(dark ? 'dark' : 'light');
  }

  public showToast(variant: FeedbackVariant): void {
    this.feedbackService[variant](TOASTS[variant]);
  }

  public openDialog(kind: DesignSystemDialogDemo): void {
    if (kind === 'danger') {
      this.dialogService
        .confirm({
          title: 'Cancelar o evento?',
          message: 'Os convidados serão avisados de que o Arraiá no jardim não vai acontecer.',
          confirmLabel: 'Cancelar evento',
          cancelLabel: 'Manter evento',
          tone: 'danger',
          icon: 'cancel',
        })
        .subscribe((confirmed) =>
          this.dialogAnswer.set(confirmed ? 'cancelar o evento' : 'manter o evento'),
        );
      return;
    }

    this.dialogService
      .choose({
        title: 'Qual telefone fica?',
        message: 'Ana já tem o (11) 98888-1111. O novo número é (11) 97777-2222.',
        confirmLabel: 'Usar o novo',
        extraLabel: 'Manter os dois',
        cancelLabel: 'Voltar',
      })
      .subscribe((choice) =>
        this.dialogAnswer.set(
          choice === 'confirm' ? 'usar o novo' : choice === 'extra' ? 'manter os dois' : 'voltar',
        ),
      );
  }

  private applySeasonalClass(name: string | null): void {
    const root = document.documentElement;
    root.classList.remove(...SEASONAL_CLASSES);
    if (name) {
      root.classList.add(name);
    }
  }

  private readTokenValues(): void {
    const style = getComputedStyle(document.documentElement);
    const values: Record<string, string> = {};
    for (const token of DS_LIVE_COLOR_TOKENS) {
      values[token] = style.getPropertyValue(token).trim();
    }
    this.tokenValues.set(values);
  }
}
