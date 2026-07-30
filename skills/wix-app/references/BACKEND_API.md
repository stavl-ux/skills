
# Wix Backend API Builder

Creates HTTP endpoints for Wix CLI applications — server-side routes that handle HTTP requests, process data, and return responses. HTTP endpoints are powered by Astro endpoints and are automatically discovered from the file system.

**Key facts:**

- Files live in `src/pages/api/` with `.ts` extension
- Cannot be added via `npm run generate` — create files directly
- Don't appear on the Extensions page in the app dashboard
- No extension registration needed (auto-discovered)
- Replace the legacy "HTTP functions" from the previous Wix CLI for Apps

## Use Cases

Use HTTP endpoints when you need to:

- Build REST APIs with multiple HTTP methods
- Integrate with external APIs or services
- Handle complex form submissions or file uploads
- Serve dynamic content (images, RSS feeds, personalized data)
- Access runtime data or server-side databases

## API Compatibility And Permissions

Before implementing an endpoint that calls a Wix API:

1. Verify the exact method explicitly supports the backend execution host. Do not use a backend route to call a frontend-only method.
2. Record every required scope ID and verify it is granted to the app, not merely listed in documentation or inferred from an installed package.
3. Set permission verification only after the app configuration and completed update/reinstall are confirmed, or after a successful authenticated runtime request.
4. Add the scope and complete any required app update/reinstall when tooling supports it. Otherwise stop with the exact setup action.
5. Use `auth.elevate()` only after access is verified. Elevation changes execution identity; it does not grant missing scopes.
6. Treat `401` and `403` as permission/setup failures. Log the original server error, but return a stable public error shape such as `{ code: "MISSING_PERMISSION", message: "...", requiredScopes: [...] }`. Use `UNSUPPORTED_CAPABILITY`, `SITE_UNPUBLISHED`, or `TRANSIENT_FAILURE` for those cases; only the transient state may offer Retry.

Do not invent an undocumented Wix API or scrape a public representation to simulate a missing platform capability. In particular, a published site URL does not provide a supported inventory of regular Wix site pages. Sitemap parsing is an explicit external-data fallback, not a substitute for a verified page-list API.

## File Structure and Naming

### Basic Endpoint

File path determines the endpoint URL:

```
src/pages/api/<your-endpoint-name>.ts
```

### Dynamic Routes

Use square brackets for dynamic parameters:

```
src/pages/api/users/[id].ts → /api/users/:id
src/pages/api/posts/[slug].ts → /api/posts/:slug
src/pages/api/users/[userId]/posts/[postId].ts → /api/users/:userId/posts/:postId
```

## HTTP Methods

Export named functions for each HTTP method. Type with `APIRoute` from `astro`. Each handler receives a `request` object and returns a `Response`:

```typescript
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  console.log("Log from GET."); // This message logs to your CLI.
  return new Response("Response from GET."); // This response is visible in the browser console
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  console.log("Log POST with body: ", data); // This message logs to your CLI.
  return new Response(JSON.stringify(data)); // This response is visible in the browser console.
};
```

## Request Handling

### Path Parameters

```typescript
export const GET: APIRoute = async ({ params }) => {
  const { id } = params; // From /api/users/[id]

  if (!id) {
    return new Response(JSON.stringify({ error: "ID required" }), {
      status: 400,
      statusText: "Bad Request",
      headers: { "Content-Type": "application/json" },
    });
  }

  // Use id to fetch data
};
```

### Query Parameters

Use `new URL(request.url).searchParams`:

```typescript
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  // Use query parameters
};
```

### Request Body

Parse JSON body from POST/PUT/PATCH requests:

```typescript
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Title and content required" }),
        {
          status: 400,
          statusText: "Bad Request",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process data
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      statusText: "Bad Request",
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Headers

```typescript
const authHeader = request.headers.get("Authorization");
const contentType = request.headers.get("Content-Type");
```

## Response Patterns

Always return a `Response` object with proper status codes and headers:

```typescript
// 200 OK
return new Response(JSON.stringify({ data: result }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

// 201 Created
return new Response(JSON.stringify({ id: newId, ...data }), {
  status: 201,
  headers: { "Content-Type": "application/json" },
});

// 204 No Content (for DELETE)
return new Response(null, { status: 204 });

// 400 Bad Request
return new Response(JSON.stringify({ error: "Invalid input" }), {
  status: 400,
  statusText: "Bad Request",
  headers: { "Content-Type": "application/json" },
});

// 404 Not Found
return new Response(JSON.stringify({ error: "Not found" }), {
  status: 404,
  statusText: "Not Found",
  headers: { "Content-Type": "application/json" },
});

// 500 Internal Server Error
return new Response(JSON.stringify({ error: "Internal server error" }), {
  status: 500,
  statusText: "Internal Server Error",
  headers: { "Content-Type": "application/json" },
});
```

## Frontend Integration

Call HTTP endpoints from frontend components using Wix's built-in HTTP client (`httpClient.fetchWithAuth()`):

```typescript
import { httpClient } from "@wix/essentials";

// GET request
const baseApiUrl = new URL(import.meta.url).origin;
const res = await httpClient.fetchWithAuth(
  `${baseApiUrl}/api/<your-endpoint-name>`,
);
const data = await res.text();

// POST request
const res = await httpClient.fetchWithAuth(
  `${baseApiUrl}/api/<your-endpoint-name>`,
  {
    method: "POST",
    body: JSON.stringify({ message: "Hello from frontend" }),
  },
);
const data = await res.json();
```

Handle non-success responses before reading feature data. Show a concise recovery state; do not place `error.message`, an SDK response object, or serialized diagnostic JSON directly in the interface. A permission response should identify the missing access and next action, while the full exception remains in server or console diagnostics.

## Build, Deploy, and Delete

To take HTTP endpoints to production, build and release your project:

1. Build the project assets using the [`build`](https://dev.wix.com/docs/wix-cli/command-reference/project-commands/build) command.
2. Optionally create preview URLs using the [`preview`](https://dev.wix.com/docs/wix-cli/command-reference/project-commands/preview) command to share with team members for testing.
3. Release your project using the [`release`](https://dev.wix.com/docs/wix-cli/command-reference/project-commands/release) command.

Once released, endpoints are accessible at production URLs and handle live traffic.

To delete an HTTP endpoint, remove the file under `src/pages/api/` and release again.

## Output Structure

```
src/pages/api/
├── users.ts              # /api/users endpoint
├── users/
│   └── [id].ts           # /api/users/:id endpoint
└── posts.ts              # /api/posts endpoint
```

## Backend-API-specific Conventions

- Type all handlers with `APIRoute` from `astro`.
- Always return `Response` objects with `JSON.stringify()` for JSON.
- Use proper HTTP status codes (200, 201, 204, 400, 404, 500).
- Include `Content-Type: application/json` header on JSON responses.
- Include `statusText` in error responses.
- Validate input parameters and request bodies.
- Verify required Wix app scopes are granted before calling elevated SDK methods.
- Return stable, user-safe error codes for permission, unavailable capability, unpublished site, and upstream failures.
- Audit the dashboard source and every backend endpoint it calls in the same blocking audit command.
