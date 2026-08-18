# Contexto do Projeto: Organiza AI

Este arquivo consolida as diretrizes de contexto para agentes de IA (Antigravity, Claude Code, Cursor, etc.), garantindo a consistência arquitetural na manutenção e evolução do **Organiza AI**.

---

## 1. Visão Geral

**Organiza AI** é um Progressive Web App (PWA) focado na organização colaborativa e descomplicada de eventos (festas juninas, churrascos, encontros familiares, etc.). Qualquer usuário autenticado pode criar eventos, convidar colaboradores e compartilhar links públicos para que convidados confirmem presença (RSVP) e assumam itens da lista com zero atrito.

---

## 2. Pilha de Tecnologia

- **Frontend**: Angular v21+ (Standalone Components exclusivamente).
- **UI/UX & Estilização**:
  - **Angular Material** como biblioteca base de componentes.
  - **SCSS Puro com Metodologia BEM** para estilização encapsulada dos componentes.
  - **CSS Custom Properties (Tokens)**: Uso obrigatório das variáveis com prefixo `--org-` e `--mat-sys-` definidas em `src/styles.scss` (Design System *Vibrant Modernism / Glassmorphism*).
  - **Tailwind CSS NÃO é utilizado** (removido para evitar conflitos de especificidade com o Material e garantir encapsulamento).
- **Backend / BaaS**:
  - **Firebase Modular SDK** direto (Firestore, Authentication).
  - **NÃO utilizar `@angular/fire`** (devido a incompatibilidades de dependência com Angular v21). A inicialização e injeção do Firebase é feita centralizadamente no `FirebaseService`.
- **PWA**: Configuração oficial via `@angular/pwa` (`ngsw-config.json`), suporte a QR Code (`qrcode`) e compartilhamento nativo via WhatsApp.

---

## 3. Padrões de Arquitetura Angular

- **Signals Nativos**: O estado local, inputs e outputs **devem** ser construídos usando Signals (`signal`, `computed`, `effect`, `input()`, `output()`, `model()`).
- **RxJS Apenas para Streams Externas**: Use RxJS apenas para Observables retornados pelo Firestore ou integrações de APIs assíncronas externas (convertendo para Signals com `toSignal()`).
- **Control Flow**: Utilize exclusivamente a sintaxe de novo Control Flow do Angular (`@if`, `@for`, `@switch`).
- **OnPush Obrigatório**: `ChangeDetectionStrategy.OnPush` é **obrigatório** em 100% dos componentes.
- **Smart / Dumb Components**:
  - **Smart (Container)**: Exemplo: `DashboardContainer`, `EventDetailContainer`. Injetam serviços, buscam dados no Firebase e orquestram o fluxo de estado. Sufixo `.container.ts`.
  - **Dumb (Presentational)**: Exemplo: `EventCardComponent`, `ItemListComponent`. Focados unicamente em apresentação e acessibilidade. **Zero chamadas a serviços ou banco de dados.** Recebem dados via `input()` e emitem eventos via `output()`. Sufixo `.component.ts`.
- **Arquivos Dedicados**: Todos os componentes devem obrigatoriamente possuir arquivo `.html` dedicado (`templateUrl`) e `.scss` (`styleUrl`). Nunca usar `template:` ou `style:` inline.

---

## 4. Gestão de Sessão, Perfis e RBAC

- **Super Admins**: Usuários com permissões globais de supervisão do sistema (`luiz.gmr.dev@gmail.com`, `jessica.calm.dev@gmail.com`). Definidos no frontend (`AuthService.isSuperAdmin`) e protegidos no `firestore.rules`.
- **Organizadores (Qualquer Usuário Autenticado - AD-016)**:
  - Qualquer usuário autenticado com conta Google pode criar e gerenciar seus próprios eventos sem necessidade de pré-aprovação em whitelist.
  - O criador do evento é o seu **Único Dono (Owner)** com autoridade total sobre o evento.
- **Colaboradores de Evento (AD-017)**:
  - O dono do evento pode convidar colaboradores por e-mail.
  - Colaboradores podem gerenciar itens e visualizar a lista de convidados, mas **não podem** alterar dados core do evento (título, data, local) ou excluir o evento.
- **Convidados (Guests - AD-006 / AD-009)**:
  - Acessam o evento via link público `/evento/:id`.
  - Uma sessão anônima no Firebase é inicializada automaticamente nos bastidores (`AuthService.loginAnonymously()`) para permissões de escrita seguras.
  - A identidade local do convidado é armazenada no `localStorage` via `GuestSessionService`. Convidados anônimos **não** criam registros na coleção global `users`.

---

## 5. Acessibilidade (WCAG 2.1 AA)

- Use tags semânticas da Web (`<header>`, `<main>`, `<section>`, `<dialog>`, `<button>`, `<nav>`).
- Nunca utilize `<div (click)="...">`.
- Todos os botões contendo apenas ícones devem ter `aria-label`.
- Skeletons e elementos puramente decorativos devem ter `aria-hidden="true"`.

---

## 6. Banco de Dados (Firestore)

- **`users/{uid}`**: Perfil de usuários autenticados (nome, email, tema preferido, foto).
- **`users/{uid}/family/{memberId}`**: Roster de familiares cadastrados pelo usuário para confirmação rápida em lote.
- **`events/{eventId}`**: Documento do evento (`createdBy`, `collaborators: []`, `title`, `date`, `location`, `pixKey`, `status`).
- **`events/{eventId}/guests/{guestId}`**: Sub-coleção de presenças confirmadas.
- **`events/{eventId}/items/{itemId}`**: Sub-coleção de itens de contribuição coletiva.
- **`guest_profiles/{phone}`**: Pre-cadastro leve de convidados por telefone.

---

## 7. Versionamento e SDD

- **Conventional Commits**: Obrigatório em todos os commits (`feat(...)`, `fix(...)`, `chore(...)`, etc.).
- **Spec-Driven Development (TLC SDD)**: O diretório `.specs/` é a fonte canônica da verdade para especificações, decisões arquiteturais (`STATE.md`) e rastreabilidade de requisitos.
