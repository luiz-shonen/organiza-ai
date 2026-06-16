# Organiza AI — Product Requirements Document (PRD)

Este documento consolida a visão de produto, os papéis de usuários, as funcionalidades atuais e as premissas de UX/UI do **Organiza AI**. Ele serve como fonte da verdade para Product Managers, Designers e Engenheiros.

---

## 1. Visão do Produto
O **Organiza AI** é uma plataforma web para gestão simplificada de eventos colaborativos (como Festas Juninas, churrascos e encontros). Seu diferencial é remover o atrito do convidado: sem necessidade de baixar apps ou criar contas complexas. O organizador cria o evento e compartilha o link; o convidado acessa, confirma presença, escolhe o que vai levar e pode até contribuir via Pix em poucos cliques.

---

## 2. Perfis de Usuário (Personas / Roles)

### 2.1. Super Administradores (Donos do Produto)
*Atualmente definidos via regras fixas (Hardcoded RBAC).*
- Têm acesso total ao sistema.
- São os únicos com permissão para promover novos e-mails ao status de Administrador (Organizador).

### 2.2. Administradores (Organizadores)
- Fazem login via Google ou E-mail/Senha.
- Podem criar, editar e excluir eventos.
- Gerenciam a lista de itens que precisam ser levados ao evento.
- Visualizam a lista de convidados confirmados.

### 2.3. Convidados (Público Geral)
- Acessam o sistema via Link Público sem fricção (o Firebase gera um `UID` de Sessão Anônima nos bastidores).
- Podem visualizar os dados do evento (Data, Local, Descrição).
- Podem confirmar presença (RSVP) informando Nome, Telefone e número de acompanhantes.
- Podem "assumir" um item da lista (ex: "Vou levar o bolo").
- Podem visualizar e copiar a Chave Pix do evento para contribuir financeiramente (Rachadinha).

---

## 3. Funcionalidades Core (Features)

### Módulo de Gestão (Painel do Administrador)
- **Autenticação Segura:** Login social (Google) e E-mail/Senha com Firebase Auth.
- **Dashboard de Eventos:** Visão geral em lista/cards de todos os eventos gerenciados.
- **Criação/Edição de Eventos:** Formulário para título, descrição, data/hora, endereço e chave Pix opcional.
- **Gestão de Itens:** Adicionar itens (ex: "Refrigerante 2L") e quantidades necessárias. 
- **Share Panel:** Painel fácil para copiar o link público do evento para enviar via WhatsApp.

### Módulo do Convidado (Página do Evento)
- **Visualização Otimizada:** Interface focada em conversão mobile-first.
- **RSVP (Confirmação de Presença):** Dialog limpo perguntando Nome e Telefone.
- **Pré-cadastro Transparente (Perfil Global):** Ao confirmar presença, o sistema gera automaticamente um pré-cadastro (User Profile) na raiz do banco de dados atrelado ao dispositivo do usuário, preparando-o para o futuro.
- **Lista de Contribuição de Itens:** O usuário clica para assumir a responsabilidade de levar um item (seu nome fica atrelado ao item na visão pública).
- **Cartão Pix:** Botão de um clique para copiar a chave Pix do organizador.

### Cross-Features (Transversais)
- **Dark Mode Dinâmico em Nuvem:** A aplicação possui suporte a Tema Claro, Tema Escuro ou Sincronização Automática com o Celular/PC. A escolha do usuário é salva no seu "Pré-cadastro" na nuvem. Se ele abrir o app amanhã, o tema já virá na sua cor favorita.
- **Performance de Interface (Zero Layout Shift):** Telas com carregamento em etapas usam *Skeleton Loaders* perfeitamente desenhados para que a interface não "pule" bruscamente quando a internet do celular carrega os dados.

---

## 4. Requisitos Não-Funcionais e UX
- **Acessibilidade (WCAG 2.1 AA):** HTML Semântico, leitura de tela garantida e foco via teclado. Todos os esqueletos (*skeletons*) são ocultados para leitores de tela (`aria-hidden="true"`).
- **Design System:** Baseado inteiramente no Angular Material 3 com CSS Custom Properties (Tokens) injetados via TailwindCSS. Nunca utilizar cores fixas (hexadecimal), utilizar apenas variáveis como `var(--mat-sys-surface)`.
- **Arquitetura Front-end:** Angular v21+, Standalone Components obrigatórios, uso massivo de *Signals* nativos para reatividade e `ChangeDetectionStrategy.OnPush` para altíssima performance de renderização.

---

## 5. Próximos Passos (Roadmap & Backlog)
> *Esta seção deve ser alimentada em conversas futuras.*
- [ ] Construir funcionalidade visual de gerenciamento de Admins (onde os Super Admins poderão ver a lista e revogar acessos).
- [ ] Funcionalidade de foto de perfil (Avatar) sincronizada com a conta do Google na header do Painel.
- [ ] Opção de "Desfazer/Sair" da confirmação de presença (RSVP) do lado do convidado.
- [ ] Exportação de lista de convidados para Excel/PDF para impressão no dia do evento.
