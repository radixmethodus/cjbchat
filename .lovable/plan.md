

## Remove iOS Keyboard Accessory Bar via Capacitor Native Shell

### Why this is needed
The iOS form assistant bar (prev/next/done) **cannot be hidden** from a web app running in Safari or a PWA. This is an iOS platform limitation with no web API workaround. The only guaranteed solution is wrapping the app in a native shell (Capacitor) which gives access to native keyboard APIs that can suppress it.

### Plan

#### 1. Add Capacitor dependencies
Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, and `@capacitor/keyboard`.

#### 2. Configure Capacitor
Initialize with:
- `appId`: `app.lovable.82a942b92f8a443eade2428badf67432`
- `appName`: `cjr`
- `server.url`: sandbox preview URL for hot-reload during dev
- `server.cleartext`: true

#### 3. Use `@capacitor/keyboard` to hide accessory bar
In `src/main.tsx`, add:
```typescript
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  Keyboard.setAccessoryBarVisible({ isVisible: false });
}
```
This is the native API that **guarantees** the accessory bar is hidden.

#### 4. No other code changes needed
The existing `contentEditable` div, PWA config, and layout all remain as-is. The Capacitor wrapper is additive.

### What the user needs to do after
1. Export project to GitHub via Settings
2. `git pull` and `npm install`
3. `npx cap init` (if not auto-created)
4. `npx cap add ios`
5. `npx cap update ios`
6. `npm run build && npx cap sync`
7. `npx cap run ios` (requires Mac + Xcode)

### Files changed
| Action | File |
|--------|------|
| Edit | `src/main.tsx` (add Keyboard import + hide accessory bar) |
| Install | `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/keyboard` |
| Create | `capacitor.config.ts` (auto via `npx cap init`) |

