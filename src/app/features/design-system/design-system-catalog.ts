import type { SeasonalThemeChoice } from '../../core/models';

/** One colour role on the Colours section; the value is read live from the page. */
export interface DesignSystemColorToken {
  readonly token: string;
  readonly label: string;
  readonly use: string;
  /** Token painted on top of the swatch, to show the text pair (`--org-on-*`). */
  readonly ink?: string;
}

export interface DesignSystemColorGroup {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly tokens: readonly DesignSystemColorToken[];
}

export interface DesignSystemTypeStyle {
  readonly token: string;
  readonly label: string;
  readonly sample: string;
  readonly use: string;
}

export interface DesignSystemFontFamily {
  readonly token: string;
  readonly name: string;
  readonly sample: string;
  readonly use: string;
}

export interface DesignSystemScaleStep {
  readonly token: string;
  readonly value: string;
  readonly use?: string;
}

export interface DesignSystemPrinciple {
  readonly title: string;
  readonly description: string;
}

/** Colour has a job: every role below is named after what it is for, not what it looks like. */
export const DS_COLOR_GROUPS: readonly DesignSystemColorGroup[] = [
  {
    id: 'brand',
    title: 'Papéis da marca',
    description: 'Três cores, três funções. O resto da interface é neutro.',
    tokens: [
      {
        token: '--org-primary',
        label: 'Lilás',
        use: 'Só para ações: botões, links, foco e o item ativo.',
        ink: '--org-on-primary',
      },
      {
        token: '--org-secondary',
        label: 'Azul céu',
        use: 'Datas e informação: o selo de data e os avisos.',
        ink: '--org-on-secondary',
      },
      {
        token: '--org-tertiary',
        label: 'Verde folha',
        use: 'Progresso e sucesso: barras, confirmados e destaques.',
        ink: '--org-on-tertiary',
      },
      {
        token: '--org-primary-container',
        label: 'Lilás suave',
        use: 'Fundo de ação secundária (tonal) e do item ativo.',
        ink: '--org-on-primary-container',
      },
      {
        token: '--org-secondary-container',
        label: 'Azul suave',
        use: 'Fundo de dicas e blocos de data.',
        ink: '--org-on-secondary-container',
      },
      {
        token: '--org-tertiary-container',
        label: 'Verde suave',
        use: 'Trilho do progresso e etiquetas de sucesso.',
        ink: '--org-on-tertiary-container',
      },
    ],
  },
  {
    id: 'status',
    title: 'Estados',
    description: 'Retorno do sistema. Cada um tem a versão cheia e a suave.',
    tokens: [
      {
        token: '--org-success',
        label: 'Sucesso',
        use: 'Confirmado, salvo, completo.',
        ink: '--org-on-success',
      },
      {
        token: '--org-warning',
        label: 'Atenção',
        use: 'Pendente, falta pouco, "Eu levo".',
        ink: '--org-on-warning',
      },
      {
        token: '--org-error',
        label: 'Erro',
        use: 'Remover, cancelar, campo inválido.',
        ink: '--org-on-error',
      },
      { token: '--org-info', label: 'Informação', use: 'Avisos neutros.', ink: '--org-on-info' },
      {
        token: '--org-accent-container',
        label: 'Laranja suave',
        use: 'Dica do Organiza AI quando o evento está perto.',
        ink: '--org-on-accent-container',
      },
      {
        token: '--org-error-container',
        label: 'Erro suave',
        use: 'Fundo de banners e diálogos de remoção.',
        ink: '--org-on-error-container',
      },
    ],
  },
  {
    id: 'neutral',
    title: 'Superfícies e texto',
    description: 'Fundo calmo, cards brancos e texto com contraste AA.',
    tokens: [
      { token: '--org-canvas', label: 'Fundo da página', use: 'Muda com o tema sazonal.' },
      { token: '--org-surface', label: 'Superfície', use: 'Cards, folhas e diálogos.' },
      {
        token: '--org-surface-container-low',
        label: 'Superfície baixa',
        use: 'Blocos dentro de um card.',
      },
      {
        token: '--org-surface-container-high',
        label: 'Superfície alta',
        use: 'Trilhos, chips e realces discretos.',
      },
      { token: '--org-on-surface', label: 'Texto', use: 'Títulos e texto principal.' },
      {
        token: '--org-on-surface-variant',
        label: 'Texto secundário',
        use: 'Legendas, dicas e metadados.',
      },
      { token: '--org-outline', label: 'Contorno', use: 'Borda de campos e botões secundários.' },
      {
        token: '--org-outline-variant',
        label: 'Linha fina',
        use: 'Borda dos cards e divisórias.',
      },
    ],
  },
];

/** Category colours: a tint behind the tag and an ink for its text. */
export const DS_CATEGORY_TOKENS: readonly DesignSystemColorToken[] = [
  {
    token: '--org-cat-aniversario-bg',
    ink: '--org-cat-aniversario-color',
    label: 'Aniversário',
    use: '',
  },
  {
    token: '--org-cat-casamento-bg',
    ink: '--org-cat-casamento-color',
    label: 'Casamento',
    use: '',
  },
  { token: '--org-cat-festa-bg', ink: '--org-cat-festa-color', label: 'Festa', use: '' },
  {
    token: '--org-cat-churrasco-bg',
    ink: '--org-cat-churrasco-color',
    label: 'Churrasco',
    use: '',
  },
  { token: '--org-cat-happy-bg', ink: '--org-cat-happy-color', label: 'Happy hour', use: '' },
  {
    token: '--org-cat-formatura-bg',
    ink: '--org-cat-formatura-color',
    label: 'Formatura',
    use: '',
  },
  { token: '--org-cat-outros-bg', ink: '--org-cat-outros-color', label: 'Outros', use: '' },
];

export const DS_GRADIENT_TOKENS: readonly DesignSystemColorToken[] = [
  {
    token: '--org-gradient-highlight',
    label: 'Destaque',
    use: 'Progresso e a palavra em destaque do título.',
  },
  { token: '--org-gradient-brand', label: 'Marca', use: 'Só no logotipo.' },
];

/** Every colour token the page reads live, so values follow the light / dark mode. */
export const DS_LIVE_COLOR_TOKENS: readonly string[] = [
  ...DS_COLOR_GROUPS.flatMap((group) => group.tokens.map((token) => token.token)),
  ...DS_CATEGORY_TOKENS.map((token) => token.token),
];

export const DS_TYPE_STYLES: readonly DesignSystemTypeStyle[] = [
  {
    token: '--org-text-display',
    label: 'Display',
    sample: 'Festa da Jéssica',
    use: 'Só em telas de marca, como o login.',
  },
  {
    token: '--org-text-heading',
    label: 'Heading',
    sample: 'Meus eventos',
    use: 'Título da página (org-page-header).',
  },
  {
    token: '--org-text-title',
    label: 'Title',
    sample: 'Lista do evento',
    use: 'Título de card (org-card-header).',
  },
  {
    token: '--org-text-body',
    label: 'Body',
    sample: 'Leve um prato para dividir com a família.',
    use: 'Texto corrido e campos.',
  },
  {
    token: '--org-text-body-sm',
    label: 'Body small',
    sample: 'Sábado, 24 de junho · 19h30',
    use: 'Metadados, dicas e legendas.',
  },
  {
    token: '--org-text-label',
    label: 'Label',
    sample: 'Confirmado',
    use: 'Etiquetas de status, em maiúsculas.',
  },
];

export const DS_FONT_FAMILIES: readonly DesignSystemFontFamily[] = [
  {
    token: '--org-font-display',
    name: 'Fredoka',
    sample: 'Aa Bb Cc 123',
    use: 'Títulos de página e de card.',
  },
  {
    token: '--org-font-body',
    name: 'Plus Jakarta Sans',
    sample: 'Aa Bb Cc 123',
    use: 'Todo o resto da interface.',
  },
  {
    token: '--org-font-mono',
    name: 'JetBrains Mono',
    sample: '{ gap: 8px }',
    use: 'Código, só neste catálogo.',
  },
  {
    token: '--org-font-script',
    name: 'Great Vibes',
    sample: 'Com carinho',
    use: 'Só nos convites: saudação e assinatura.',
  },
  {
    token: '--org-font-invite',
    name: 'Cormorant Garamond',
    sample: 'Festa Junina',
    use: 'Só nos convites: nome da festa e data.',
  },
];

export const DS_SPACING_SCALE: readonly DesignSystemScaleStep[] = [
  { token: '--org-space-2xs', value: '2px' },
  { token: '--org-space-xs', value: '4px' },
  { token: '--org-space-sm', value: '8px' },
  { token: '--org-space-md', value: '16px' },
  { token: '--org-space-lg', value: '24px' },
  { token: '--org-space-xl', value: '32px' },
  { token: '--org-space-2xl', value: '48px' },
  { token: '--org-space-3xl', value: '64px' },
];

export const DS_RADIUS_SCALE: readonly DesignSystemScaleStep[] = [
  { token: '--org-radius-xs', value: '6px', use: 'Etiquetas' },
  { token: '--org-radius-sm', value: '12px', use: 'Campos' },
  { token: '--org-radius-md', value: '16px', use: 'Blocos internos' },
  { token: '--org-radius-card', value: '18px', use: 'Cards' },
  { token: '--org-radius-xl', value: '28px', use: 'Folhas e diálogos' },
  { token: '--org-radius-full', value: 'pílula', use: 'Botões e chips' },
];

export const DS_SHADOW_SCALE: readonly DesignSystemScaleStep[] = [
  { token: '--org-shadow-xs', value: 'xs', use: 'Chips' },
  { token: '--org-shadow-sm', value: 'sm', use: 'Cards em destaque' },
  { token: '--org-shadow-md', value: 'md', use: 'Hover' },
  { token: '--org-shadow-lg', value: 'lg', use: 'Folhas e menus' },
];

export const DS_SIZE_TOKENS: readonly DesignSystemScaleStep[] = [
  { token: '--org-touch', value: '48px', use: 'Alvo de toque padrão' },
  { token: '--org-touch-min', value: '44px', use: 'Alvo mínimo' },
  { token: '--org-header-height', value: '64px', use: 'Barra do topo' },
  { token: '--org-bottom-nav-height', value: '64px', use: 'Barra inferior (celular)' },
  { token: '--org-progress-height', value: '6px', use: 'Barra de progresso' },
  { token: '--org-motion-fast', value: '160ms', use: 'Hover e foco' },
  { token: '--org-motion-base', value: '200ms', use: 'Abrir e fechar' },
  { token: '--org-motion-slow', value: '320ms', use: 'Folhas e entradas' },
];

export const DS_BREAKPOINTS: readonly DesignSystemScaleStep[] = [
  { token: 'semantic.mobile', value: '< 600px', use: 'Celular' },
  { token: 'semantic.tablet', value: '≥ 600px', use: 'Tablet' },
  { token: 'semantic.desktop', value: '≥ 900px', use: 'Desktop' },
  { token: 'semantic.wide', value: '≥ 1200px', use: 'Tela larga' },
];

export const DS_PRINCIPLES: readonly DesignSystemPrinciple[] = [
  {
    title: 'A cor tem função',
    description:
      'Lilás é "toque aqui". Azul é data e informação. Verde é progresso e sucesso. O resto é neutro.',
  },
  {
    title: 'Superfícies planas',
    description:
      'Cards brancos com linha fina e cantos de 18px. Sem vidro, sem fundo que se mexe atrás do texto.',
  },
  {
    title: 'Tipografia amigável',
    description: 'Fredoka nos títulos, Plus Jakarta Sans no resto e botões em pílula.',
  },
  {
    title: 'Celular primeiro',
    description:
      'Alvos de 48px, zero rolagem lateral e páginas em 70% da largura a partir de 1200px.',
  },
];

/** The usability laws each screen is checked against. */
export const DS_USABILITY_LAWS: readonly DesignSystemPrinciple[] = [
  { title: 'Jakob', description: 'Barra inferior no celular, sem menu hambúrguer.' },
  { title: 'Fitts', description: 'Alvos de toque de 48px.' },
  { title: 'Hick', description: 'Poucas escolhas por vez.' },
  { title: 'Miller', description: 'Informação em grupos pequenos.' },
  { title: 'Von Restorff', description: 'Uma ação em destaque por tela.' },
  { title: 'Zeigarnik', description: 'Mostrar o que falta terminar.' },
  { title: 'Gradiente de meta', description: 'O progresso fica visível e anima a chegar ao fim.' },
];

export const DS_DOS: readonly string[] = [
  'Importar componentes só de @shared/ui.',
  'Estilizar só com tokens --org-*.',
  'Testar no claro e no escuro, em 320, 600 e 1200px.',
  'Usar FeedbackService e OrgDialogService para avisos e confirmações.',
  'Faltou um componente? Criar no DS, documentar aqui e no DESIGN.md.',
];

export const DS_DONTS: readonly string[] = [
  'Importar @angular/material ou usar <mat-*> numa feature.',
  'Escrever hex, !important, .dark ou tamanhos de fonte literais.',
  'Pintar de lilás o que não é ação.',
  'Usar <button> nativo ou o atributo title.',
  'Criar alvo de toque menor que 48px.',
];

export const DS_SEASONAL_THEMES: readonly SeasonalThemeChoice[] = [
  { id: 'default', label: 'Padrão', canvasLight: '#FFFFFF', canvasDark: '#181429' },
  { id: 'theme-pascoa', label: 'Páscoa', canvasLight: '#FAF6FF', canvasDark: '#18142A' },
  { id: 'theme-junina', label: 'Festa Junina', canvasLight: '#FFF6DF', canvasDark: '#1F1712' },
  { id: 'theme-natal', label: 'Natal', canvasLight: '#FFF5F1', canvasDark: '#1F1416' },
  { id: 'theme-ano-novo', label: 'Ano Novo', canvasLight: '#FFFBED', canvasDark: '#17161C' },
];
