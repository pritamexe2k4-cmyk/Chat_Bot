# Azure deployment — V1

## Result

This app will be reachable at a private Azure URL:

```text
https://<app-name>.azurewebsites.net
```

The running Node.js process stays in Azure. The browser never receives the OpenAI key, login password, or session-signing secret.

## Azure resources we will create

Keep all four in one resource group, for example `rg-private-chatbot-prod`.

| Resource | Purpose | V1 setting |
| --- | --- | --- |
| App Service Plan | Keeps the web app running | Linux Basic B1 or higher |
| App Service | Runs this Node.js project | Node 20, HTTPS only, Always On |
| Key Vault | Stores the three private values | RBAC enabled |
| Application Insights | Logs runtime failures | enabled, no secrets logged |

There is no database in V1.

## Before creating Azure resources

1. Be able to sign in at [Azure Portal](https://portal.azure.com).
2. Make sure the subscription can create an App Service Plan and Key Vault.
3. Choose names that are globally unique where Azure requires it:

```text
Resource group: rg-private-chatbot-prod
App Service:    preetam-chatbot-<unique-suffix>
Key Vault:      kv-preetam-chatbot-<unique-suffix>
```

4. Set a small Azure cost budget and an OpenAI project usage/budget alert before making the URL public.

## Required Azure App Service settings

The App Service must have these settings. Add the first three as Key Vault references, not plaintext values.

| App setting | Value in App Service |
| --- | --- |
| `OPENAI_API_KEY` | `@Microsoft.KeyVault(SecretUri=<OpenAI-key-secret-URI>)` |
| `CHAT_ACCESS_PASSWORD` | `@Microsoft.KeyVault(SecretUri=<password-secret-URI>)` |
| `SESSION_SECRET` | `@Microsoft.KeyVault(SecretUri=<session-secret-URI>)` |
| `OPENAI_MODEL` | Your chosen available text model, for example `gpt-4.1-mini` |
| `NODE_ENV` | `production` |

`NODE_ENV=production` matters: it tells the app to mark the login cookie `Secure`, so the browser sends it only over HTTPS.

## Secret setup

Create three Key Vault secrets:

```text
openai-api-key
chat-access-password
session-secret
```

Enable the App Service's **system-assigned managed identity**. Give that identity the **Key Vault Secrets User** role scoped to this Key Vault. Then set the app settings using the Key Vault secret URIs without a version. This permits normal secret rotation.

The code still reads `process.env.OPENAI_API_KEY`, `process.env.CHAT_ACCESS_PASSWORD`, and `process.env.SESSION_SECRET`; Azure resolves each reference before the application starts. The managed identity and Key Vault reference pattern is supported directly by App Service. [Microsoft documentation](https://learn.microsoft.com/en-us/azure/app-service/app-service-key-vault-references?tabs=azure-cli)

## App Service configuration

In the Azure portal, create a **Web App** with:

```text
Publish:         Code
Runtime stack:   Node 20 LTS
Operating system: Linux
Pricing plan:    Basic B1 or higher
```

After creating it:

1. Turn on **HTTPS Only**.
2. Turn on **Always On** in Configuration → General settings.
3. Set **Health check** to `/health`.
4. Enable the system-assigned managed identity.
5. Add the app settings above and save; Azure restarts the app.

App Service health checks can remove unhealthy instances from load-balancer rotation. [Microsoft documentation](https://learn.microsoft.com/en-us/azure/app-service/monitor-instances-health-check)

## Code deployment

For the first deployment, use App Service's Deployment Center to connect this GitHub repository:

```text
https://github.com/pritamexe2k4-cmyk/Chat_Bot
branch: main
```

App Service detects `package.json`, runs `npm install`, and starts the project with the `npm start` command in this repository. Keep the repository free of `.env`; production secrets come only from Key Vault.

## Deployment verification

After deployment, open:

```text
https://<app-name>.azurewebsites.net/health
```

Expected output:

```json
{"status":"ok"}
```

Then open the root URL and verify, in this order:

1. You see the password screen.
2. A wrong password is rejected.
3. Your real password unlocks the chatbot.
4. One chat response arrives.
5. Log out, refresh, and confirm the chat is locked again.

## Owner controls

| You need to change | Where |
| --- | --- |
| OpenAI key | Rotate `openai-api-key` in Key Vault, then restart/reconfigure App Service |
| Chat password | Update `chat-access-password` in Key Vault |
| Session invalidation | Replace `session-secret` in Key Vault, then restart App Service |
| Model | App Service `OPENAI_MODEL` setting |
| Prompt/personality | `instructions` in `server.js`, then commit and redeploy |
| Costs | Azure Cost Management + OpenAI project limits |

## V1 operational rule

Do not put a production secret in GitHub, a deployment workflow, browser JavaScript, a screenshot, or a README. Key Vault is the one home for production secrets.
