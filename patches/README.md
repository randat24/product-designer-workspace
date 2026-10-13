# Patches (applied by `patch-package` on `npm install` / `npm ci`)

## `next+15.5.27.patch` — React render-phase ping

Next 15.5.27 runs the App Router on its own vendored React (`19.2.0-canary-0bdb9206-20250818`), not on the
`react-dom` from package.json. In that build `pingSuspendedRoot` drops a ping that arrives *during* a render
once the render has already exited "suspended with delay". A Flight chunk in the `resolved_model` state does
exactly that: React attaches its ping listener, `then()` parses the row and calls the listener synchronously.
The transition lane then stays suspended with no listener left, so a server action result (`revalidatePath`)
or a `<Link>` navigation never commits: the submit button stays pending, `aria-current` never moves
(vercel/next.js#98303).

The patch is React's upstream fix, as shipped in `react-dom@19.3.0`: a render-phase ping is recorded in
`workInProgressRootPingedLanes` instead of being ignored. It touches the ten vendored React DOM builds.

Remove it when Next is upgraded to a release whose vendored React includes the fix (check `pingSuspendedRoot`
in `node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js`); `--error-on-fail` makes
`npm ci` fail loudly if the patch no longer applies.

## `next+15.5.27.patch` — hydration in one pass (`client/app-index.js`, `esm/client/app-index.js`)

Next starts hydration inside `React.startTransition`, so the vendored React hydrates the page in time slices and
yields to the browser between them. On the public site that broke at random: in roughly one load out of six under
load (any page, more often on long ones) React lost its place between slices — it compared the body's first
element with `<meta charset>` from the head, or `<main>` with the page inside it — threw #418 and re-rendered the
whole page on the client. The page text stayed the same, so it was visible only as a slower, flashing first paint
and as the random «page errors» failures in the e2e job. It happened with and without the ping fix above and only
in production builds (dev bundles load slower than the HTML parses).

The patch calls `hydrateRoot` directly. Hydration then runs in the default lane, which React renders in one
synchronous pass: no slices, no window for the mix-up. Measured on a local production build, 4 parallel loads:
15–17 errors out of 80 before, 0 out of 80 after; the site e2e suite (strict mode) 80 of 80 runs clean. The cost is
one longer task while the page hydrates, which is small for these pages.

Drop it together with the ping fix when Next is upgraded (16.x ships a newer React): run the site e2e with
`--repeat-each=5` on a production build first; random #418 failures mean the issue is back.
