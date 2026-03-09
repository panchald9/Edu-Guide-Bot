// storage.ts is handled by replit_integrations/auth/storage.ts and replit_integrations/chat/storage.ts
// We just need to ensure server/storage.ts exists if referenced elsewhere, 
// but in this structure, we import specific storages directly.
// However, the template expects a server/storage.ts. 
// We can re-export the storages here for convenience or keep it minimal.

import { authStorage } from "./replit_integrations/auth/storage";
import { chatStorage } from "./replit_integrations/chat/storage";

export const storage = {
    ...authStorage,
    ...chatStorage
};
