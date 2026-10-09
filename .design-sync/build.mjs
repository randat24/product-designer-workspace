// Builds the small package design-sync converts (cfg.buildCmd): this repo is a Next.js app with no dist/,
// so the shared UI (src/shared/ui) is packaged here. Output: .design-sync/.cache/pkg/ (gitignored).
//   types/     .d.ts tree from tsc (component API contracts), "@/..." aliases rewritten to relative paths
//   index.js   entry re-exporting every src/shared/ui module (the converter bundles it with esbuild)
//   index.d.ts matching type entry
//   styles.css Tailwind 4 compile of .design-sync/tailwind.css
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const pkg = join(here, ".cache", "pkg");
const types = join(pkg, "types");
const ui = join(root, "src", "shared", "ui");

rmSync(pkg, { recursive: true, force: true });
mkdirSync(pkg, { recursive: true });

// 1. Declarations. tsc exits non-zero on type errors unrelated to emit; the .d.ts tree is checked below.
try {
  execFileSync(join(root, "node_modules", ".bin", "tsc"), ["-p", join(here, "tsconfig.types.json")], { cwd: root, stdio: "pipe" });
} catch (e) {
  console.error(String(e.stdout ?? e.message).split("\n").slice(0, 20).join("\n"));
}
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
for (const f of walk(types)) {
  const src = readFileSync(f, "utf8");
  const out = src.replace(/(from\s+|import\(\s*)(["'])@\/([^"']+)\2/g, (_, pre, q, p) => {
    let rel = relative(dirname(f), join(types, p)).split("\\").join("/");
    if (!rel.startsWith(".")) rel = "./" + rel;
    return `${pre}${q}${rel}${q}`;
  });
  if (out !== src) writeFileSync(f, out);
}

// 2. Entries.
const modules = readdirSync(ui).filter((n) => n.endsWith(".tsx") && !/\.(test|spec)\./.test(n)).sort();
writeFileSync(join(pkg, "index.js"), modules.map((n) => `export * from ${JSON.stringify(join(ui, n))};`).join("\n") + "\n");
writeFileSync(join(pkg, "index.d.ts"), modules.map((n) => `export * from "./types/shared/ui/${n.replace(/\.tsx$/, "")}";`).join("\n") + "\n");
writeFileSync(join(pkg, "package.json"), JSON.stringify({ name: "workspace-ui", version: "0.1.0", private: true, module: "index.js", types: "index.d.ts" }, null, 2) + "\n");

// 3. Stylesheet.
const cssIn = join(here, "tailwind.css");
const prev = process.cwd();
process.chdir(root);
const result = await postcss([tailwind()]).process(readFileSync(cssIn, "utf8"), { from: cssIn, to: join(pkg, "styles.css") });
process.chdir(prev);
writeFileSync(join(pkg, "styles.css"), result.css);

console.log(`built ${relative(root, pkg)}: ${modules.length} modules, ${walk(types).length} .d.ts, styles.css ${(result.css.length / 1024).toFixed(0)} KB`);
