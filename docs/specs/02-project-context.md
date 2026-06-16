# Contexto do Projeto: Organiza AI

Este arquivo contém instruções de IA para agentes (Antigravity, Claude Code, Cursor, etc.) garantindo a consistência arquitetural na manutenção do projeto **Organiza AI**.

## 1. Visão Geral
**Organiza AI** é um Progressive Web App (PWA) focado na organização colaborativa de eventos (como festas juninas, churrascos, etc.). O organizador (Admin) cria eventos, e os convidados (Guests) confirmam presença (RSVP) e podem "assumir" a responsabilidade de levar itens da lista (bebidas, comidas, etc). 

## 2. Pilha de Tecnologia
- **Frontend**: Angular v21+ (exclusivamente com Standalone Components).
- **UI/UX**: Angular Material para a fundação de componentes. Tailwind CSS v4 para classes utilitárias de layout (flex, grid, margens) sem corromper o Material. SCSS puro com metodologia BEM para estilos encapsulados dos componentes.
- **Backend/BaaS**: Firebase Modular SDK (Firestore, Auth). **NÃO utilizar `@angular/fire`** devido a problemas de dependência; a injeção do Firebase é feita manualmente no `FirebaseService`.
- **PWA**: Instalável offline, suporte a QR Code para convites (`qrcode`) e compartilhamento via WhatsApp.

## 3. Arquitetura Angular
- **Signals**: O estado local, inputs e outputs **devem** ser construídos usando Signals (`signal`, `computed`, `effect`, `input()`, `output()`, `model()`).
- **Sem RxJS para UI Local**: Use RxJS apenas para fluxos de dados complexos ou integrações de serviços assíncronos que naturalmente lidam com Observables (ex: retornos do Firestore).
- **Control Flow**: Utilize exclusivamente o novo Control Flow do Angular (`@if`, `@for`, `@switch`).
- **OnPush**: O `ChangeDetectionStrategy.OnPush` é **obrigatório** em todos os componentes.

## 4. Padrão Smart / Dumb Components
Siga o padrão estrito de separação entre Container (Smart) e Presentational (Dumb):
- **Smart (Container)**: Exemplo: `DashboardContainer`. Concentram a injeção de serviços, buscam dados no Firebase e repassam as informações para os filhos. Normalmente têm o sufixo `Container`.
- **Dumb (Presentational)**: Exemplo: `EventInfoCard`, `SharePanelComponent`. Focados apenas em exibição e interatividade do usuário. **Não possuem lógica de negócio ou chamada a banco de dados.** Recebem dados via `input()` e emitem eventos via `output()`.
- **Arquivos Dedicados**: Todos os componentes devem obrigatoriamente possuir um arquivo `.html` dedicado (`templateUrl`) e `.scss` (`styleUrl`). Nunca usar `template:` ou `style:` inline.

## 5. Gerenciamento de Sessão e Acesso (RBAC)
- **Super Admins**: `luiz.gmr.dev@gmail.com` e `jessica.calm.dev@gmail.com` estão "hardcoded" como Super Admins no frontend e no `firestore.rules`. Apenas eles podem acessar a UI de convite de novos organizadores.
- **Admins (Organizadores)**: Utilizam a conta do Google (Firebase Authentication) para entrar no sistema. 
  - **Convites Passwordless**: O fluxo de criação de contas de Email/Senha foi **removido**. Para convidar um novo Admin, o Super Admin simplesmente digita o e-mail na UI. O e-mail é salvo na coleção `admins` (whitelist). Quando essa pessoa loga com sua própria conta Google, o acesso é liberado via `firestore.rules`.
- **Guest (Convidado)**: Possui um "pseudo-login" salvo no `localStorage` do browser por meio do `GuestSessionService`. O app checa `isPlatformBrowser` antes de usar a API nativa para evitar quebra no SSR.

## 6. Acessibilidade (MANDATÓRIO)
Todo HTML gerado precisa ser **WCAG 2.1 AA compliant**.
- Use tags semânticas da Web (ex: `<header>`, `<main>`, `<section>`, `<dialog>`, `<button>`).
- Nunca utilize `<div (click)="acao()">`.
- Certifique-se de que `aria-label` e focos de teclado (tabindex) estejam devidamente implementados.

## 7. Banco de Dados (Firestore)
- **Segurança Real via Rules**: O RBAC é implementado em `firestore.rules`. Admins não têm acesso de "Administrador Firebase/GCP", são apenas usuários finais (`request.auth.token.email`) filtrados na coleção `admins`.
- **Estrutura**:
  - `admins/{email}`: Whitelist de organizadores aprovados. Protegida para leitura e escrita apenas por Super Admins.
  - `events/{eventId}`: Documento principal do evento (acesso de leitura pública).
  - `events/{eventId}/guests/{guestId}`: Sub-coleção de convidados (escrita anônima restrita via Rules).
  - `events/{eventId}/items/{itemId}`: Sub-coleção de itens da lista de rachadinha (criação restrita a admin, porém com leitura e update de `claimedBy` público).
- Todas as operações devem passar pela validação rigorosa em `firestore.rules`.

## 8. Idioma e Versionamento
- **Interface e Comunicação**: A linguagem primária da UI e da comunicação no projeto é o **Português do Brasil (pt-BR)**.
- **Git Commits**: É MANDATÓRIO o uso do padrão **Conventional Commits** (ex: `feat(...)`, `fix(...)`, `chore(...)`) para todos os commits no repositório.
