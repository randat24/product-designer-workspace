# design-sync notes

- This repo is a Next.js app with no `dist/`. `node .design-sync/build.mjs` (cfg.buildCmd) packages `src/shared/ui` into `.design-sync/.cache/pkg/`; always run it before the driver, also after editing any file in `previews/` (the Tailwind compile scans `previews/` for classes, so a new width or utility in a preview only gets CSS after this step).
- Driver command: `node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --entry .design-sync/.cache/pkg/index.js --out ./ds-bundle [--remote .design-sync/.cache/remote-sync.json]`.
- `next/link` and `next/navigation` are replaced by shims in `.design-sync/shims/` (plain `<a>`, no-op router).
- Previews import icons from `lucide-react` (the app's icon library); they are bundled into the preview, not into `_ds_bundle.js`.
- Interface copy in previews is Ukrainian, like the tool itself.
- First upload: 2026-10-10. Before it the project (pinned in config) was empty; an earlier run had stopped before uploading.

## Known render warns

- `[RENDER_THIN]` IconButton: icon-only buttons, no text by design.
- `[RENDER_THIN]` on components without an authored preview: CursorIcon, EntityLayout, FedoMark, FedoOutline.

## Preview coverage

- ConfirmDelete's `Armed` and DateField's `OpenCalendar` previews open those interactive states on mount.
- 14 components have no authored preview: ActionError, ActionForm, BackLink, CommandPalette, CursorIcon, EntityLayout, FedoMark, FedoOutline, FieldError, FieldSaveNote, NetworkBanner, NotFoundState, PageSkeleton, SaveToast.

## Re-sync risks

- `.design-sync/tailwind.css` holds a hand-written safelist of token utilities; a token renamed in `src/app/globals.css` must be renamed there and in `conventions.md`.
- `conventions.md` names tokens, classes and components by hand; re-validate against `ds-bundle/_ds_bundle.css` on every sync.
- ErrorState and other components read copy from `src/shared/i18n/uk.ts`; preview text changes with it.
- The staged converter ran on Node 24 while the repo pins Node 22.
