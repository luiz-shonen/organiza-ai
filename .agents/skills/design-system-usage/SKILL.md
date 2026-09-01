---
name: design-system-usage
description: Complete catalog and usage guide for all 32 Org* design system primitives in Organiza AI, imported from @shared/ui.
---

# Organiza AI — Design System Component Catalog

This guide documents the complete suite of 32 `Org*` design system components and services available in `@shared/ui` (`src/app/shared/ui`).

## Core Methodologies

All UI components and features consuming the design system must follow:
- **`tlc-spec-driven`**: Implement requirements using testable EARS acceptance criteria and atomic Conventional Commits.
- **`tdd`**: Write unit tests asserting component rendering, accessibility attributes, and user interaction outputs.
- **`bem-css`**: Style custom feature wrappers with BEM SCSS using `--org-*` custom properties.

---

## 1. Design System Foundations

- **Brand Colors**: Vibrant Modernism palette with Primary (`#ff4d94`), Secondary (`#ff8c42`), and Accent (`#ffc837`).
- **Glassmorphism**: Glass surfaces with `backdrop-filter: blur(24px)`, `background: var(--org-surface-glass)`, and subtle gradient borders.
- **Strict Encapsulation**: Feature containers and dumb components must never use raw unstyled Material tags when a canonical `Org*` component exists.

---

## 2. Component Catalog by Category

### Layout Primitives

| Component | Selector | Purpose | Key Inputs / Outputs |
|---|---|---|---|
| `OrgPageLayoutComponent` | `<org-page-layout>` | Outer responsive page container | `maxWidth`: `'narrow'` \| `'default'` \| `'wide'` \| `'full'` |
| `OrgPageHeaderComponent` | `<org-page-header>` | Page heading with gradient and actions slot | `title`, `subtitle`, `icon`, `gradient`; slot `[orgPageHeaderActions]` |
| `OrgSectionComponent` | `<org-section>` | Content section container | `title`, `icon`, `count` |
| `OrgSurfaceComponent` | `<org-surface>` | Glassmorphic surface card | `elevation`: `'none'` \| `'low'` \| `'glass'` \| `'elevated'` |

```html
<org-page-layout maxWidth="wide">
  <org-page-header title="Painel" subtitle="Visão geral" [gradient]="true">
    <div orgPageHeaderActions>
      <org-button label="Novo" icon="add" variant="primary" />
    </div>
  </org-page-header>
  <org-section title="Visão Geral" [count]="3">
    <org-surface>Conteúdo do card</org-surface>
  </org-section>
</org-page-layout>
```

---

### Actions & Triggers

| Component | Selector | Purpose | Key Inputs / Outputs |
|---|---|---|---|
| `OrgButtonComponent` | `<org-button>` | Primary, secondary, danger, and text buttons | `label`, `variant`, `icon`, `disabled`, `loading`, `type`, `(pressed)` |
| `OrgIconButtonComponent` | `<org-icon-button>` | Accessible circular action button | `icon`, `ariaLabel`, `variant`, `disabled`, `(pressed)` |
| `OrgChipComponent` | `<org-chip>` | Selectable filter or tag pill | `label`, `selected`, `variant`, `(selectedChange)` |
| `OrgIconComponent` | `<org-icon>` | Standard SVG icon renderer | `name`, `size` (`'sm'` \| `'md'` \| `'lg'`), `color` |

```html
<org-button label="Salvar Alterações" variant="primary" icon="save" (pressed)="onSave()" />
<org-icon-button icon="delete" ariaLabel="Excluir item" variant="danger" (pressed)="onDelete()" />
<org-chip label="Confirmados" [selected]="isActive()" (selectedChange)="onToggle($event)" />
<org-icon name="check_circle" size="md" color="var(--org-success)" />
```

---

### Form & Input Controls

| Component | Selector | Purpose | Key Inputs / Outputs |
|---|---|---|---|
| `OrgTextFieldComponent` | `<org-text-field>` | Single-line input with CVA support | `label`, `type`, `placeholder`, `hint`, `formControlName`, `[(value)]` |
| `OrgTextareaFieldComponent` | `<org-textarea-field>` | Multi-line text input | `label`, `placeholder`, `rows`, `formControlName`, `[(value)]` |
| `OrgDateFieldComponent` | `<org-date-field>` | Date picker input with mask | `label`, `minDate`, `maxDate`, `formControlName`, `[(value)]` |
| `OrgTimeFieldComponent` | `<org-time-field>` | Time selector input | `label`, `options`, `formControlName`, `[(value)]` |
| `OrgSelectFieldComponent` | `<org-select-field>` | Dropdown select menu | `label`, `options`: `OrgSelectOption[]`, `formControlName` |
| `OrgAutocompleteFieldComponent` | `<org-autocomplete-field>` | Autocomplete search field | `label`, `suggestions`, `(searchChange)` |

```html
<org-text-field label="Nome do Evento" placeholder="Ex: Aniversário de 30 anos" formControlName="title" />
<org-date-field label="Data" formControlName="date" />
<org-select-field label="Categoria" [options]="categoryOptions" formControlName="category" />
```

---

### Selection Controls

| Component | Selector | Purpose | Key Inputs / Outputs |
|---|---|---|---|
| `OrgToggleComponent` | `<org-toggle>` | Binary switch toggle | `label`, `checked`, `disabled`, `(toggleChange)` |
| `OrgCheckboxComponent` | `<org-checkbox>` | Accessible checkbox | `label`, `checked`, `disabled`, `(checkedChange)` |
| `OrgRadioGroupComponent` | `<org-radio-group>` | Radio button group | `name`, `options`: `OrgRadioOption[]`, `[(value)]` |

---

### Navigation

| Component | Selector | Purpose | Key Inputs / Outputs |
|---|---|---|---|
| `OrgTabsComponent` | `<org-tabs>` | Horizontal tab navigation bar | `items`: `OrgTabItem[]`, `activeId`, `(tabChange)` |
| `OrgStepperComponent` | `<org-stepper>` | Multi-step wizard coordinator | `activeStepIndex`, `linear`, `(stepChange)` |
| `OrgStepComponent` | `<org-step>` | Individual step in stepper | `label`, `completed`, `editable` |
| `OrgMenuComponent` | `<org-menu>` | Contextual dropdown menu | `actions`: `OrgMenuAction[]`, `(actionSelected)` |
| `OrgNavigationListComponent` | `<org-navigation-list>` | Vertical navigation link list | `items`: `OrgNavigationItem[]`, `(itemSelected)` |

---

### Data Display

| Component | Selector | Purpose | Key Inputs / Outputs |
|---|---|---|---|
| `OrgMetricCardComponent` | `<org-metric-card>` | KPI statistic card | `label`, `value`, `description`, `trend` |
| `OrgDataTableComponent` | `<org-data-table>` | Tabular data display with columns | `columns`: `OrgDataColumn<T>[]`, `data`: `T[]` |
| `OrgBadgeComponent` | `<org-badge>` | Status and count pill badge | `label`, `variant`: `'default'` \| `'primary'` \| `'success'` \| `'warning'` \| `'danger'` |
| `OrgProgressComponent` | `<org-progress>` | Progress indicator | `value`, `variant`: `'linear'` \| `'circular'` |

```html
<org-metric-card label="Total de Convidados" value="48" description="32 confirmados" />
<org-badge variant="success" label="Confirmado" />
```

---

### Feedback & Overlays

| Component / Service | Type | Purpose | Key API |
|---|---|---|---|
| `OrgConfirmDialogComponent` | Component | Confirmation modal dialog | Injected via `OrgDialogService` |
| `OrgDialogService` | Service | Programmatic confirm dialogs | `confirm(data: OrgConfirmDialogData): Observable<boolean>` |
| `OrgEmptyStateComponent` | Component | Empty list placeholder | `icon`, `title`, `description` |
| `OrgBannerComponent` | Component | Top-level alert banner | `variant`, `title`, `message`, `dismissible` |
| `FeedbackSnackbarComponent` | Component | Toast notification popup | Injected via `FeedbackService` |
| `FeedbackService` | Service | Global toast notification trigger | `success(msg)`, `error(msg)`, `info(msg)`, `warning(msg)` |

```typescript
// Dialog confirmation usage
this.dialogs.confirm({
  title: 'Excluir Item',
  message: 'Tem certeza que deseja excluir este item da lista?',
  confirmLabel: 'Excluir',
}).subscribe((confirmed) => {
  if (confirmed) this.deleteItem();
});

// Toast feedback usage
this.feedback.success('Evento salvo com sucesso!');
```
