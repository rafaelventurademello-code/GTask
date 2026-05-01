# GTask - Gestão de Manutenção

Este é um sistema de checklists e gestão de equipes técnicas integrado com Firebase.

## Pré-requisitos

- Node.js (v18 ou superior)
- NPM ou Yarn
- Um projeto no Firebase com Firestore e Authentication ativados.

## Instalação

1. Extraia o arquivo ZIP do projeto.
2. No terminal, dentro da pasta do projeto, instale as dependências:
   ```bash
   npm install
   ```

## Configuração

1. Renomeie o arquivo `.env.example` para `.env`.
2. O arquivo `firebase-applet-config.json` já contém as chaves do seu projeto atual. Se for usar um projeto novo, atualize este arquivo com as novas credenciais obtidas no Console do Firebase.

## Execução (Desenvolvimento)

Para rodar o servidor Express com Vite integrado:

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`.

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Compila o frontend para produção.
- `npm run start`: Inicia o servidor em modo de produção (após o build).
- `npm run lint`: Executa a verificação de tipos do TypeScript.
