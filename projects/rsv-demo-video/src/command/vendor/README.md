Copied from rsv-studio at commit 40d0d07 so the Command Centre film renders without the app:

- `signal-orb.ts` ← `src/components/command/signal-orb.ts` (its `@/lib/command-states` import made relative)
- `command-states.ts` ← `src/lib/command-states.ts`

If the app's orb or its states change, copy both files again so the film matches the product.
