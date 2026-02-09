Organizing your Edge Functions#
We recommend developing “fat functions”. This means that you should develop few large functions, rather than many small functions. One common pattern when developing Functions is that you need to share code between two or more Functions. To do this, you can store any shared code in a folder prefixed with an underscore (_). We also recommend a separate folder for Unit Tests including the name of the function followed by a -test suffix.
We recommend this folder structure:

└── supabase
├── functions
│   ├── import_map.json # A top-level import map to use across functions.
│   ├── _shared
│   │   ├── supabaseAdmin.ts # Supabase client with SERVICE_ROLE key.
│   │   └── supabaseClient.ts # Supabase client with ANON key.
│   │   └── cors.ts # Reusable CORS headers.
│   ├── function-one # Use hyphens to name functions.
│   │   └── index.ts
│   └── function-two
│   │   └── index.ts
├── migrations
└── config.toml

└── src
├── __tests__
│   └── edge-functions
│      └── tests
│          └── function-one # Use hyphens to name functions.
│              └── function-one-test.ts
│          └── function-two
│              └── function-two-test.ts


to deploy the functions locally, run the following command:

```bash
supabase functions serve
```

to deploy the functions to the cloud, run the following command:

```bash
supabase functions deploy
```

to create a new function, run the following command:

```bash
supabase functions new function-name
```

Manage Supabase Edge functions

Usage:
  supabase functions [command]

Available Commands:
  delete      Delete a Function from Supabase
  deploy      Deploy a Function to Supabase
  download    Download a Function from Supabase
  list        List all Functions in Supabase
  new         Create a new Function locally
  serve       Serve all Functions locally