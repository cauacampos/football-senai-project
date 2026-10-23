# Backend — Football Market

A API é desenvolvida com NestJS, TypeScript, Prisma ORM 7 e PostgreSQL 16. Para instalação, variáveis de ambiente, migrations, execução e endpoints disponíveis, consulte o [README principal](../README.md).

## Comandos

```bash
npm install
npx prisma validate
npx prisma generate
npm run start:dev
```

## Qualidade

```bash
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run lint
```

Configure `DATABASE_URL`, `FRONTEND_ORIGIN` e `PORT` usando `.env.example`. Não versione arquivos `.env` com credenciais locais.
