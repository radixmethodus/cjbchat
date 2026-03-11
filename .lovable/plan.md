

## Plan: Inline Action Links Next to Message Bubble

Based on the mockup, the message context menu should be **simple inline text links** ("Star", "Reply", "Report") that appear **horizontally next to the message bubble** on the same row — not a drawer, not a panel.

### Changes

#### 1. Rewrite `MessageActionSlider.tsx` — Simple inline link row

Remove the `vaul` Drawer entirely. Replace with a plain `div` containing three underlined text links ("Star", "Reply", "Report") styled with the pixel font. This component renders inline, not as an overlay.

- Underlined text, ~11px, `font-pixel`
- "Star" shows count if > 0, highlighted if starred
- "Report" in a muted/destructive color
- No icons, no backgrounds — just text links like the mockup

#### 2. Update `MessageBubble.tsx` — Place actions beside the bubble

Change the bubble layout so the bubble and action links sit in a **horizontal flex row**:

```text
[ bubble ] [ Star  Reply  Report ]
```

- Actions appear on click/tap (toggle `activeSlider`) — or always visible on hover (desktop)
- Remove the long-press timer complexity; a simple click on the bubble toggles the actions
- Keep obscure tap-to-reveal behavior (only toggle actions if not obscure or already revealed)
- The `max-w-[80%]` moves to the outer container so bubble + actions fit together

#### Files
| File | Change |
|------|--------|
| `src/components/pictochat/MessageActionSlider.tsx` | Full rewrite — inline text links |
| `src/components/pictochat/MessageBubble.tsx` | Layout change — horizontal row with bubble + actions |

