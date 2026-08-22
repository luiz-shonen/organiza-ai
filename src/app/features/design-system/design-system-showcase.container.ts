import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Shared UI Primitives
import {
  OrgSurfaceDirective,
  OrgPageLayoutComponent,
  OrgPageHeaderComponent,
  OrgSectionComponent,
  OrgFormGridDirective,
  OrgEmptyStateComponent,
  OrgButtonDirective,
  OrgIconButtonDirective,
  OrgChipDirective,
  OrgIconComponent,
  OrgIconName,
  ORG_ICON_MAP,
  OrgFormFieldDirective,
  OrgFieldLabelDirective,
  FeedbackService,
  OrgBannerComponent,
} from '../../shared/ui';
import { ThemeService } from '../../core/services/theme.service';
import { DrawerService } from '../../core/services/drawer.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

export type SeasonalThemeOption =
  | 'default'
  | 'theme-junina'
  | 'theme-natal'
  | 'theme-pascoa'
  | 'theme-ano-novo';

export interface NavSectionItem {
  id: string;
  title: string;
  icon: OrgIconName;
  keywords: string[];
}

export interface NavCategoryGroup {
  id: string;
  title: string;
  sections: NavSectionItem[];
}

export interface SpecimenApiProperty {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
}

export interface SpecimenCardData {
  id: string;
  name: string;
  category: 'brand' | 'foundations' | 'components' | 'guidelines';
  importPath: string;
  description: string;
  whenToUse: string[];
  whenNotToUse: string[];
  codeSnippet: string;
  apiProperties: SpecimenApiProperty[];
}

export const SHOWCASE_NAV_CATEGORIES: NavCategoryGroup[] = [
  {
    id: 'brand',
    title: 'Brand',
    sections: [
      {
        id: 'brand-overview',
        title: 'Visão Geral',
        icon: 'info',
        keywords: ['overview', 'visao geral', 'filosofia', 'brand', 'design system', 'organiza'],
      },
      {
        id: 'brand-colors',
        title: 'Cores',
        icon: 'palette',
        keywords: ['cores', 'colors', 'palette', 'pink', 'orange', 'yellow', 'brand', 'primary'],
      },
      {
        id: 'brand-typography',
        title: 'Tipografia',
        icon: 'edit',
        keywords: ['tipografia', 'typography', 'font', 'plus jakarta sans', 'headings', 'body'],
      },
      {
        id: 'brand-icons',
        title: 'Iconografia',
        icon: 'search',
        keywords: ['iconografia', 'icons', 'org-icon', 'simbolos', 'map'],
      },
    ],
  },
  {
    id: 'foundations',
    title: 'Fundações',
    sections: [
      {
        id: 'foundations-tokens',
        title: 'Tokens',
        icon: 'palette',
        keywords: ['tokens', 'css variables', '--org-*', 'design tokens', 'semantic'],
      },
      {
        id: 'foundations-fundamentals',
        title: 'Fundamentos',
        icon: 'schedule',
        keywords: ['fundamentos', 'espacamento', 'spacing', 'radius', 'sombras', 'blur', 'elevacao'],
      },
    ],
  },
  {
    id: 'components',
    title: 'Componentes',
    sections: [
      {
        id: 'components-surfaces',
        title: 'Surfaces',
        icon: 'place',
        keywords: ['surfaces', 'orgSurface', 'card', 'panel', 'hero', 'drawer', 'dialog', 'glass'],
      },
      {
        id: 'components-buttons',
        title: 'Botões & Ações',
        icon: 'how_to_reg',
        keywords: ['botoes', 'buttons', 'orgButton', 'orgIconButton', 'actions', 'cta'],
      },
      {
        id: 'components-forms',
        title: 'Formulários',
        icon: 'mail',
        keywords: ['formularios', 'forms', 'orgFormField', 'orgFieldLabel', 'input', 'select'],
      },
      {
        id: 'components-chips',
        title: 'Chips',
        icon: 'check_circle',
        keywords: ['chips', 'orgChip', 'badges', 'status', 'tags'],
      },
      {
        id: 'components-layout',
        title: 'Layout',
        icon: 'event',
        keywords: ['layout', 'org-page-layout', 'org-page-header', 'org-section', 'orgFormGrid'],
      },
      {
        id: 'components-feedback',
        title: 'Feedback',
        icon: 'info',
        keywords: ['feedback', 'empty-state', 'banner', 'snackbar', 'alerta', 'notificacao'],
      },
      {
        id: 'components-navigation',
        title: 'Navegação & Modais',
        icon: 'menu',
        keywords: ['navegacao', 'drawer', 'dialog', 'modal', 'confirm-dialog', 'side sheet'],
      },
    ],
  },
  {
    id: 'guidelines',
    title: 'Regras & Diretrizes',
    sections: [
      {
        id: 'guidelines-dos-donts',
        title: 'O que Fazer & Não Fazer',
        icon: 'check_circle',
        keywords: ['regras', 'diretrizes', 'dos', 'donts', 'boas praticas', 'proibicoes'],
      },
    ],
  },
];

@Component({
  selector: 'app-design-system-showcase',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    OrgSurfaceDirective,
    OrgPageLayoutComponent,
    OrgPageHeaderComponent,
    OrgSectionComponent,
    OrgFormGridDirective,
    OrgEmptyStateComponent,
    OrgButtonDirective,
    OrgIconButtonDirective,
    OrgChipDirective,
    OrgIconComponent,
    OrgFormFieldDirective,
    OrgFieldLabelDirective,
    OrgBannerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-showcase.container.html',
  styleUrl: './design-system-showcase.container.scss',
})
export class DesignSystemShowcaseContainer {
  protected readonly themeService = inject(ThemeService);
  protected readonly feedbackService = inject(FeedbackService);
  protected readonly drawerService = inject(DrawerService);
  protected readonly dialog = inject(MatDialog);

  // Available icon keys for icon gallery
  public readonly allIconNames = Object.keys(ORG_ICON_MAP) as OrgIconName[];

  // Navigation data & search filter
  public readonly categories = signal<NavCategoryGroup[]>(SHOWCASE_NAV_CATEGORIES);
  public readonly activeSection = signal<string>('brand-overview');
  public readonly searchQuery = signal<string>('');

  // Seasonal theme options and active state
  public readonly seasonalOptions: Array<{ id: SeasonalThemeOption; label: string }> = [
    { id: 'default', label: 'Padrão (Organiza)' },
    { id: 'theme-junina', label: 'Festa Junina' },
    { id: 'theme-natal', label: 'Natal' },
    { id: 'theme-pascoa', label: 'Páscoa' },
    { id: 'theme-ano-novo', label: 'Ano Novo' },
  ];
  public readonly activeSeasonalTheme = signal<SeasonalThemeOption>('default');

  // Filtered categories computed from search query
  public readonly filteredCategories = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.categories();
    }
    return this.categories()
      .map((cat) => {
        const matchesCategoryTitle = cat.title.toLowerCase().includes(query);
        const matchingSections = cat.sections.filter(
          (sec) =>
            matchesCategoryTitle ||
            sec.title.toLowerCase().includes(query) ||
            sec.keywords.some((k) => k.toLowerCase().includes(query)),
        );
        return {
          ...cat,
          sections: matchingSections,
        };
      })
      .filter((cat) => cat.sections.length > 0);
  });

  // Interactive specimen testing state
  public readonly buttonLoadingState = signal<boolean>(false);
  public readonly iconSearchQuery = signal<string>('');
  public readonly selectedIconSize = signal<'sm' | 'md' | 'lg'>('md');
  public readonly surfaceBlurSlider = signal<number>(24);
  public readonly surfaceBgOpacity = signal<number>(60);
  public readonly formGridColumns = signal<string>('1fr 1fr');

  // Filtered icons for Iconography section
  public readonly filteredIcons = computed(() => {
    const q = this.iconSearchQuery().trim().toLowerCase();
    if (!q) {
      return this.allIconNames;
    }
    return this.allIconNames.filter((name) => name.toLowerCase().includes(q));
  });

  // Expanded code snippet IDs tracking & clipboard
  public readonly expandedCodeIds = signal<Set<string>>(new Set());
  public readonly copiedSnippetId = signal<string | null>(null);

  // Surface interactive styling preview computed
  public readonly surfacePreviewGlassBg = computed(() => {
    const isDark = this.themeService.isDark();
    const alpha = this.surfaceBgOpacity() / 100;
    return isDark ? `rgba(31, 26, 29, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
  });

  public readonly surfacePreviewGlassBlur = computed(() => {
    return `blur(${this.surfaceBlurSlider()}px)`;
  });

  public toggleCode(id: string): void {
    const current = new Set(this.expandedCodeIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.expandedCodeIds.set(current);
  }

  public isCodeExpanded(id: string): boolean {
    return this.expandedCodeIds().has(id);
  }

  public async copyCode(code: string, id: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        // Fallback
      }
    }
    this.copiedSnippetId.set(id);
    this.feedbackService.success('Código copiado para a área de transferência!');
    setTimeout(() => {
      if (this.copiedSnippetId() === id) {
        this.copiedSnippetId.set(null);
      }
    }, 2500);
  }

  public setSeasonalTheme(theme: SeasonalThemeOption): void {
    if (typeof document !== 'undefined') {
      const htmlEl = document.documentElement;
      htmlEl.classList.remove('theme-junina', 'theme-natal', 'theme-pascoa', 'theme-ano-novo');
      if (theme !== 'default') {
        htmlEl.classList.add(theme);
      }
    }
    this.activeSeasonalTheme.set(theme);
  }

  public toggleThemeMode(): void {
    const isDark = this.themeService.isDark();
    this.themeService.setMode(isDark ? 'light' : 'dark');
  }

  public scrollToSection(sectionId: string): void {
    this.activeSection.set(sectionId);
    if (typeof document !== 'undefined') {
      const target = document.getElementById(sectionId);
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  public openConfirmDialogSample(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Exemplo de Diálogo Glassmorphic',
        message: 'Este diálogo demonstra a surface glassmorphic dialog com botões padronizados.',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
      },
    });
  }

  public toggleButtonLoading(): void {
    this.buttonLoadingState.update((v) => !v);
  }
}
