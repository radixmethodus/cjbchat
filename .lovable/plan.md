

## Plan: Fix Message Count, Scroll-to-Bottom, and Send-Push Parity

### Issues

1. **Message count in Room header** (line 446): Shows `messages.length` which is only the loaded page (50 max). Should use the same `count: "exact"` approach as the lobby's `useRoomStats`.

2. **Chat not starting at bottom**: The scroll logic at lines 122-144 uses `el.scrollTop = el.scrollHeight` but this fires inside a `useEffect` on `messages.length`. The issue is timing — when messages first load, the DOM may not have rendered all bubbles yet. Need a `requestAnimationFrame` or `setTimeout(0)` wrapper to ensure layout is complete before scrolling.

3. **send-push format differs from expected**: Title should be `${nickname} in Room ${room}`, obscure messages should show `🔒 Secret message`, data should nest URL inside `data: { room, url }`, and sends should use `Promise.allSettled` for parallelism.

4. **`optimizeDeps.force: true` in vite.config.ts**: This forces re-prebundling on every reload, which can cause stale chunk issues. Should be removed — `resolve.dedupe` is sufficient.

### Changes

#### 1. Room.tsx — Fix message count display
Replace `messages.length` on line 446 with a real DB count query. Add a simple `useQuery` inline or reuse `useRoomStats` for the current room's count.

#### 2. Room.tsx — Fix scroll-to-bottom timing
Wrap the initial `el.scrollTop = el.scrollHeight` (line 128) in `requestAnimationFrame` to ensure DOM layout is complete before scrolling. This guarantees chat opens at the bottom.

#### 3. send-push/index.ts — Match expected notification format
- Title: `${nickname} in Room ${room}`
- If content starts with `[OBSCURE]`, body becomes `🔒 Secret message`  
- Nest URL: `data: { room, url: \`/room/${room}\` }`
- Use `Promise.allSettled` for parallel delivery instead of sequential `for...of`

#### 4. vite.config.ts — Remove `force: true`
Remove `optimizeDeps.force` to stop constant re-prebundling. Keep `resolve.dedupe` and `optimizeDeps.include`.

### Files to modify
| File | Change |
|------|--------|
| `src/pages/Room.tsx` | Fix msg count (use DB query), fix scroll timing (rAF) |
| `supabase/functions/send-push/index.ts` | Title format, obscure handling, parallel sends |
| `vite.config.ts` | Remove `optimizeDeps.force: true` |

