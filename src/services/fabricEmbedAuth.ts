import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
} from '@azure/msal-browser';

const defaultScopes = ['https://api.fabric.microsoft.com/.default'];
const powerBIScopes = ['https://analysis.windows.net/powerbi/api/Report.Read.All'];

let msalInstance: PublicClientApplication | null = null;
let initialization: Promise<void> | null = null;

function getMsalInstance(): PublicClientApplication {
  const clientId = import.meta.env.VITE_RAYFIN_REALTIME_DASHBOARD_CLIENT_ID;
  const tenantId = import.meta.env.VITE_FABRIC_TENANT_ID;

  if (!clientId || !tenantId) {
    throw new Error('The Fabric Embed client ID and tenant ID are not configured.');
  }

  if (!msalInstance) {
    msalInstance = new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: `${window.location.origin}/fabric-embed-redirect.html`,
      },
      cache: {
        cacheLocation: 'sessionStorage',
      },
    });
  }

  return msalInstance;
}

async function initializeMsal(): Promise<PublicClientApplication> {
  const instance = getMsalInstance();
  initialization ??= instance.initialize();
  await initialization;
  return instance;
}

async function getAccount(
  instance: PublicClientApplication,
  scopes: string[]
): Promise<AccountInfo> {
  const existingAccount = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
  if (existingAccount) return existingAccount;

  const result = await instance.loginPopup({ scopes });
  instance.setActiveAccount(result.account);
  return result.account;
}

export async function getFabricEmbedAccessToken(requestedScopes?: string[]): Promise<string> {
  const instance = await initializeMsal();
  const scopes = requestedScopes?.length ? requestedScopes : defaultScopes;
  const account = await getAccount(instance, scopes);

  let result: AuthenticationResult;
  try {
    result = await instance.acquireTokenSilent({ account, scopes });
  } catch (error) {
    if (!(error instanceof InteractionRequiredAuthError)) throw error;
    result = await instance.acquireTokenPopup({ account, scopes });
  }

  instance.setActiveAccount(result.account);
  return result.accessToken;
}

export async function getPowerBIAccessToken(): Promise<string> {
  return getFabricEmbedAccessToken(powerBIScopes);
}