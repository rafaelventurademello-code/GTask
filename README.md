# GTask - Sistema de Gestão de Manutenção e Checklists

## 🎯 Objetivo do Projeto
O GTask é uma aplicação web desenvolvida para otimizar e padronizar o controle de manutenções, inspeções e tarefas técnicas (checklists). O objetivo principal é fornecer uma plataforma centralizada onde gestores podem criar modelos de checklists, atribuir tarefas a técnicos, monitorar o progresso em tempo real e gerenciar a equipe, substituindo processos manuais por um fluxo digital e auditável.

## ⚙️ O que a aplicação faz?
- **Gestão de Usuários e Perfis de Acesso**: Sistema de autenticação local com papéis definidos (Administrador, Coordenador, Supervisor e Técnico). Cada perfil tem permissões específicas de visualização e ação.
- **Modelos de Checklists**: Permite a criação de modelos padronizados de tarefas/inspeções agrupados por categoria (ex: Veículos, Oficina).
- **Atribuição de Tarefas (Assignments)**: Gestores podem delegar checklists específicos para técnicos, definindo datas de vencimento ou se são tarefas recorrentes (diárias).
- **Execução e Acompanhamento**: Técnicos podem visualizar suas tarefas pendentes, executar os checklists marcando os itens concluídos e registrar o status. Gestores acompanham em tempo real através de um painel de controle (Dashboard).
- **Dashboard e Relatórios**: Visão geral das atividades recentes, total de tarefas pendentes, finalizadas e técnicos ativos.

## 🛠️ Como funciona (Arquitetura e Manutenção)

### Stack Tecnológica
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS (v4), Framer Motion (para animações) e Lucide React (ícones). React Router para navegação (Single Page Application).
- **Backend**: Servidor local construído com Node.js e Express.
- **Banco de Dados**: Armazenamento local em arquivo JSON (`data/db.json`).

### Estrutura do Projeto para Manutenção
A aplicação funciona de forma híbrida no ambiente de desenvolvimento: o `server.ts` atua como servidor Express fornecendo as rotas de API (ex: `/api/users`, `/api/checklists`) e, simultaneamente, utiliza o Vite como middleware para servir o frontend React.

- `server.ts`: Arquivo central do backend. Contém todas as rotas da API RESTful (GET, POST, PUT, DELETE) e a lógica de leitura/escrita no banco de dados local.
- `data/db.json`: O banco de dados do sistema. Contém as coleções de `users`, `checklists` e `assignments`. Modificações diretas na estrutura dos dados devem ser refletidas aqui e nos tipos do TypeScript.
- `src/App.tsx`: Contém a interface do usuário (UI), roteamento e os componentes principais (Dashboard, Gestão de Usuários, Checklists, Execução). É um arquivo extenso que concentra grande parte da lógica de visualização.
- `src/types.ts`: Define as interfaces TypeScript para as entidades do sistema (UserRole, AssignmentStatus, Checklist, etc.), garantindo a tipagem forte.
- `src/lib/utils.ts`: Utilitários gerais e o contexto global da aplicação (`GlobalContext`), responsável por gerenciar o estado global (Auth, Theme, Data) comunicando-se com a API do backend.

### Fluxo de Dados
1. O componente React (ex: `Users` em `App.tsx`) solicita dados através dos hooks do `useData()` (definido no GlobalContext em `utils.ts`).
2. O `GlobalContext` faz uma requisição HTTP (`fetch`) para a rota correspondente na API Express (ex: `/api/users`).
3. O `server.ts` intercepta a requisição, lê o arquivo `data/db.json`, processa a requisição e retorna o JSON atualizado.
4. Para operações de escrita (POST/PUT/DELETE), o `server.ts` atualiza a estrutura em memória e reescreve o arquivo `data/db.json` usando `fs.writeFileSync`.

### Como rodar o projeto
**Pré-requisitos**: Node.js instalado (recomendado v18 ou superior).

1. Instale as dependências do projeto:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento (Backend API + Frontend Vite):
   ```bash
   npm run dev
   ```
3. Acesse a aplicação em `http://localhost:3000`. O login pode ser feito utilizando as credenciais de administrador presentes no arquivo `data/db.json` (ex: admin@gtask.com).

*Nota de Manutenção: O sistema foi recentemente migrado do Firebase para um backend local (JSON/Express) para funcionar localmente de forma independente.*
