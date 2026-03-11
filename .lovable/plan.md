

## Comprehensive Fix: Scroll-to-Bottom, Action Menu Styling, Message Count

### Three issues to fix in one pass

---

### 1. Chat doesn't start at bottom — `animate-slide-up` on bubbles

**Root cause**: Every `MessageBubble` has `animate-slide-up` which animates `opacity: 0→1` and `translateY(8px)→0` over ~200ms. When the initial batch loads, `requestAnimationFrame` fires before these animations complete, so `scrollHeight` isn't final yet. The chat visibly starts partway up.

**Fix in `src/components/pictochat/MessageBubble.tsx`**: Accept a new `animate` prop (default `true`). On initial load, Room.tsx passes `animate={false}` so bubbles render instantly. Only new messages arriving after initial load get the animation.

**Fix in `src/pages/Room.tsx`**:
- Track whether initial load is done via `initialScrollDone` ref (already exists)
- Pass `animate={!initialScrollDone.current}` inverted — i.e., `animate={initialScrollDone.current}` so initial messages don't animate but subsequent ones do
- Use double-rAF (`requestAnimationFrame(() => requestAnimationFrame(...))`) for the initial scroll to ensure layout is fully settled
- Also remove `scroll-smooth` from the container class (line 470) — while the custom CSS overrides it to just `-webkit-overflow-scrolling: touch`, removing it avoids confusion

### 2. Action menu needs bordered box styling (per mockup)

**Current**: `MessageActionSlider` renders bare text links with no container styling.
**Mockup**: Shows Star/Reply/Report inside a bordered container matching the bubble aesthetic (`border: 2px solid`, matching background).

**Fix in `src/components/pictochat/MessageActionSlider.tsx`**: Add `pc-bubble` border and background styling to the wrapper div, with padding. The links inside stay as underlined pixel-font text but now sit inside a visible bordered box that matches the chat bubble look.

### 3. Message count accuracy

**Current state**: The `useQuery` with `count: "exact"` is already in place (lines 99-110). The fallback `totalCount ?? messages.length` shows 50 briefly during load. 

**Fix in `src/pages/Room.tsx`**: Show a loading placeholder (`"…"`) while `totalCount` is undefined instead of falling back to `messages.length`. Also invalidate the count query when messages array length changes so it stays current without waiting 30s.

---

### Files to modify

| File | Changes |
|------|---------|
| `src/components/pictochat/MessageActionSlider.tsx` | Add `pc-bubble` border/background styling to container div |
| `src/components/pictochat/MessageBubble.tsx` | Add `animate` prop, conditionally apply `animate-slide-up` |
| `src/pages/Room.tsx` | (1) Pass `animate` prop based on initial load state, (2) double-rAF for initial scroll, (3) remove `scroll-smooth` from container, (4) show `"…"` while count loads, (5) invalidate count on new messages |
| `src/index.css` | Remove the `.scroll-smooth` override (lines 145-148) — no longer needed |

