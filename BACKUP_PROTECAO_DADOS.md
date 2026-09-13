# Protecao de dados do app

Esta branch adiciona controles de seguranca operacional ao app Igrejas Batistas do Ceara.

## O que foi preparado

- Botao `Backup completo` para baixar os dados atuais do Supabase em JSON.
- Botao `Salvar snapshot` para criar backup protegido no banco.
- Botao `Historico` para baixar as alteracoes registradas.

## Banco Supabase

Ja foram criadas as tabelas:

- `church_backup_snapshots`
- `church_change_log`

Tambem foi criado um trigger automatico na tabela `churches`, registrando insert, update e delete.

## Validacao feita

- Banco confirmado com 100 igrejas.
- Snapshot inicial criado com 100 igrejas.
- Alteracao do app restrita ao `index.html`.
