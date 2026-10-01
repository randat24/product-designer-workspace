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
