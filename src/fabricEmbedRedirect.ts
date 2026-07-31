import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

void broadcastResponseToMainFrame().catch((error: unknown) => {
  console.error('Microsoft authentication callback failed:', error);
  const status = document.getElementById('status');
  if (status) status.textContent = 'Sign in could not be completed. Close this window and try again.';
});