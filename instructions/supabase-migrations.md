# Supabase Migrations
to create a new migration, run the following command:

```bash
supabase migration new <migration_name>
```
Usage:
  supabase migration up [flags]

Flags:
      --db-url string   Applies migrations to the database specified by the connection string (must be percent-encoded).
  -h, --help            help for up
      --include-all     Include all migrations not found on remote history table.
      --linked          Applies pending migrations to the linked project.
      --local           Applies pending migrations to the local database. (default true)

To apply a migration locally, run the following command:

```bash
supabase migration up --local
```

To apply a migration to the remote database, run the following command:

```bash
supabase migration up --linked
```

To apply a migration to a specific database, run the following command:

```bash
supabase migration up --db-url <database_url>
```
