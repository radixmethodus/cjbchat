

## Plan: Message Action Drawers, Notification Cleanup, and Menu Visibility

### 1. Convert Message Context Menus to Bottom Drawers

Replace the current `MessageActionSlider` (an absolute-positioned panel that appears beside the message) with a **Drawer** (bottom sheet) using the existing `vaul` Drawer component. This is more natural on mobile and avoids clipping/overflow issues.

**Changes:**
- **`src/components/pictochat/MessageActionSlider.tsx`** — Rewrite to use `<Drawer>` from `@/components/ui/drawer`. It will be a controlled bottom sheet with Star, Reply, and Report buttons styled in the PictoChat pixel aesthetic. The drawer will show which message it applies to (nickname + preview).
- **`src/components/pictochat/MessageBubble.tsx`** — Remove the hover "⋯" button and the absolute-positioned slider. Instead, long-press / click opens the drawer. Pass the message content/nickname to the drawer for context.

### 2. Notification Text Cleanup

The push notification payload in `send-push/index.ts` currently uses:
- `title: "[${room}] ${nickname} says:"`
- `body: truncatedBody` (the message content)

There is no "from chat" text present, so this is already correct. However, the service worker's push handler doesn't pass `data.url` correctly — the edge function sets `url` at the top level of the payload but the SW reads `data.data?.url`. Will fix this inconsistency so notification clicks navigate properly.

### 3. Improve Alert and Participants Menu Visibility

- **Inline alerts**: Increase font size from 9px to 10px, add a subtle background highlight and left border (matching alert type color) so they stand out from the chat area.
- **Participants popover**: Increase contrast — use a solid `bg-pc-body` background (no transparency), bump font sizes, add a visible header divider, and increase the color dot size for better readability.

### Files to modify:
1. `src/components/pictochat/MessageActionSlider.tsx` — Full rewrite to Drawer
2. `src/components/pictochat/MessageBubble.tsx` — Remove hover button, simplify trigger logic
3. `src/pages/Room.tsx` — Update alert styling, participants popover styling
4. `public/sw.js` — Fix push data.url path

