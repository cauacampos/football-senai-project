# Football Market — estudo de caso Full Stack

Aplicação para administrar jogadores e clubes de uma liga fictícia de futebol, consultar valores de mercado, realizar transferências e acompanhar o histórico financeiro dos clubes.

## Stack

- **Frontend:** Next.js, React, TypeScript e Tailwind CSS.
- **Backend:** NestJS, TypeScript, Prisma ORM 7.
- **Banco:** PostgreSQL 16.
- **Qualidade:** testes automatizados com Jest, validação de DTOs e lint.

## Requisitos

- Node.js compatível com as versões indicadas nos `package.json`.
- npm.
- Docker Desktop e Docker Compose (ou PostgreSQL 16 instalado localmente).

## Como executar localmente

### 1. Subir o PostgreSQL

Na raiz do repositório:

```bash
docker compose up -d db
```

O Compose publica o PostgreSQL na porta `5433` da máquina e usa internamente a porta `5432`.

### 2. Configurar e iniciar o backend

```bash
cd backend
npm install
```

Copie o arquivo de exemplo e ajuste os valores, se necessário:

```bash
# PowerShell
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

O `DATABASE_URL` padrão do exemplo corresponde ao serviço `db` do Docker Compose quando a aplicação NestJS roda diretamente na máquina host.

Crie/aplique as migrations e gere o cliente Prisma:

```bash
npx prisma migrate dev
npx prisma generate
```

O repositório já inclui migrations; esse comando aplica as pendentes e cria uma nova apenas se o schema exigir. Não use `prisma migrate reset` em um banco com dados que queira preservar.

Inicie a API:

```bash
npm run start:dev
```

A API fica disponível em `http://localhost:3001/api/v1` por padrão. O prefixo é `/api/v1`.

### 3. Iniciar o frontend

Em outro terminal:

```bash
cd frontend
npm install
```

Copie `.env.example` para `.env.local` (se ainda não existir) e configure `NEXT_PUBLIC_API_BASE_URL`:

```bash
# PowerShell
Copy-Item .env.example .env.local

# macOS/Linux
cp .env.example .env.local
```

Inicie o Next.js:

```bash
npm run dev
```

A interface fica disponível em `http://localhost:3000`.

## Endpoints já implementados

Todos os endpoints usam o prefixo `/api/v1`.

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/players` | Cadastra jogador e calcula atributos derivados/valor base |
| `GET` | `/players` | Lista jogadores com paginação, filtros e ordenação |
| `GET` | `/players/:id` | Consulta jogador |
| `PUT` | `/players/:id` | Atualiza dados básicos do jogador |
| `PATCH` | `/players/:id/condition` | Atualiza condição física |
| `DELETE` | `/players/:id` | Exclusão lógica, sujeita às regras do domínio |
| `POST` | `/clubs` | Cria clube |
| `GET` | `/clubs` | Lista clubes |
| `GET` | `/clubs/:id` | Consulta clube e elenco |
| `POST` | `/players/:id/buy` | Compra/contrata jogador para um clube |
| `POST` | `/players/:id/sell` | Vende jogador |
| `GET` | `/clubs/:id/transactions` | Consulta histórico de transações |
| `GET` | `/clubs/:id/transactions/export` | Exporta histórico CSV |

### Exemplos rápidos

Criar um clube:

```http
POST /api/v1/clubs
Content-Type: application/json

{
  "name": "Sport Club Recife",
  "acronym": "SCR"
}
```

Cadastrar um jogador:

```http
POST /api/v1/players
Content-Type: application/json

{
  "name": "Joao Silva",
  "position": "ATA",
  "agility": 80,
  "age": 24,
  "pace": 85,
  "shooting": 88,
  "passing": 72,
  "dribbling": 81,
  "defending": 40,
  "physical": 77,
  "potential": 90
}
```

A API valida regras de domínio, portanto os exemplos precisam respeitar os limites definidos nos DTOs. Os valores derivados, como `overall` e `market_value`, são calculados pelo backend e não devem ser enviados pelo cliente.

## Comandos de qualidade

Backend:

```bash
cd backend
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run lint
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Estrutura do repositório

```text
.
├── backend/
│   ├── prisma/          # Schema e migrations
│   ├── src/
│   │   ├── jogadores/   # CRUD e regras dos jogadores
│   │   ├── clubes/      # Clubes e elenco
│   │   ├── mercado/     # Compras, vendas e histórico
│   │   ├── contratos/   # Cálculos de contratos
│   │   ├── comum/       # Validações e utilitários compartilhados
│   │   └── prisma/      # Cliente Prisma
│   └── .env.example
├── frontend/
│   └── app/             # Interface Next.js
├── docker-compose.yml
└── README.md
```

## Estado de implementação

O backend já contém jogadores, clubes, mercado/transferências e histórico de transações. A interface web e os fluxos de escalação, simulação de partidas e classificação devem ser avaliados e completados conforme os requisitos do estudo de caso. O README documenta o estado presente do repositório, não substitui a validação final dos critérios de aceite.
