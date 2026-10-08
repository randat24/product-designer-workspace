"use client";

import { ArrowRight, Plus } from "lucide-react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Background, Controls, Handle, MarkerType, MiniMap, Position, ReactFlow, ReactFlowProvider,
  useEdgesState, useNodesState, useReactFlow,
  type Connection, type Edge, type Node, type NodeProps, type Viewport,
} from "@xyflow/react";
import { Button } from "@/shared/ui/button";
import { Input, Select } from "@/shared/ui/field";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import {
  addEdge, addNode, createScreenForNode, deleteElements, linkScreen, moveNodes, saveViewport, updateEdge, updateNode,
} from "./actions";
import { EdgeCasesPanel } from "./edge-cases";
import { BRANCHES, branchColor, NODE_KINDS, nodeKind, type Branch, type NodeKind } from "./schema";
import type { EdgeCase, FlowEdge, FlowNode } from "./queries";

const f = t.flows;

type Screen = { id: string; code: string; name: string };
type StepData = { kind: NodeKind; label: string; screen: Screen | null };
type StepNode = Node<StepData, "step">;
type LinkData = { branch: Branch; label: string | null; condition: string | null };
type LinkEdge = Edge<LinkData>;

// ---------------------------------------------------------------- mapping

const toNode = (n: FlowNode): StepNode => ({
  id: n.id, type: "step", position: { x: n.x, y: n.y },
  data: { kind: n.kind as NodeKind, label: n.label, screen: n.screen },
  ariaLabel: `${f.kinds[n.kind as NodeKind] ?? n.kind}: ${n.label}`,
});

function styleEdge(e: LinkEdge): LinkEdge {
  const d = e.data!;
  const color = branchColor(d.branch);
  const label = d.label ?? (d.branch === "default" ? undefined : f.branches[d.branch]);
  return {
    ...e, type: "smoothstep", label,
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    style: { stroke: color, strokeWidth: e.selected ? 2.5 : 1.5, strokeDasharray: d.branch === "back" ? "5 4" : undefined },
    labelStyle: { fill: "var(--fg)", fontWeight: 600, fontSize: 12 },
    labelBgStyle: { fill: "var(--surface)" },
    labelBgPadding: [6, 3], labelBgBorderRadius: 6,
  };
}
const toEdge = (e: FlowEdge): LinkEdge => styleEdge({
  id: e.id, source: e.source, target: e.target,
  data: { branch: e.branch as Branch, label: e.label, condition: e.condition },
});

// ---------------------------------------------------------------- nodes

const handleClass = "!size-2.5 !border !border-surface !bg-fg-secondary";

function StepNodeView({ data, selected }: NodeProps<StepNode>) {
  const k = nodeKind(data.kind);
  const kindLabel = f.kinds[data.kind];
  const label = data.label || kindLabel;
  const ring = selected ? "outline-2 outline-offset-2 outline-fg outline" : "";
  const handles = (
    <>
      <Handle type="target" position={Position.Left} className={handleClass} />
      <Handle type="source" position={Position.Right} className={handleClass} />
    </>
  );

  if (k.shape === "diamond") {
    return (
      <div className="relative grid size-[132px] place-items-center">
        <div aria-hidden className={cn("absolute inset-[18px] rotate-45 rounded-control border bg-surface", ring)} style={{ borderColor: k.color }} />
        <span className="relative max-w-[88px] text-center text-caption leading-tight font-bold">{label}</span>
        {handles}
      </div>
    );
  }
  if (k.shape === "pill") {
    return (
      <div className={cn("flex min-w-[150px] max-w-[220px] items-center gap-2 rounded-full border bg-surface px-4 py-2", ring)}
        style={{ borderColor: k.color }}>
        <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: k.color }} />
        <span className="text-meta leading-tight font-bold">{label}</span>
        {handles}
      </div>
    );
  }
  return (
    <div className={cn("flex w-[188px] flex-col gap-1 rounded-control border border-line bg-surface p-2.5 shadow-[0_1px_2px_rgba(0,0,0,.05)]", ring)}
      style={{ borderTop: `4px solid ${k.color}` }}>
      <span className="text-caption font-semibold text-fg-secondary">{kindLabel}</span>
      <span className="text-meta leading-snug font-bold">{label}</span>
      {data.kind === "screen" && (
        data.screen
          ? <span className="self-start rounded-chip border border-line px-1.5 text-caption font-semibold tabular-nums">{data.screen.code}</span>
          : <span className="text-caption text-warning">{f.noScreen}</span>
      )}
      {handles}
    </div>
  );
}
const nodeTypes = { step: StepNodeView };

// ---------------------------------------------------------------- editor


type Props = {
  flowId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  edgeCases: EdgeCase[];
  screens: Screen[];
  viewport: Viewport | null;
  canEdit: boolean;
  /** Project path, for links to screen pages. */
  base: string;
};

export function FlowEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <Editor {...props} />
    </ReactFlowProvider>
  );
}

function Editor({ flowId, nodes: initialNodes, edges: initialEdges, edgeCases, screens: initialScreens, viewport, canEdit, base }: Props) {
  // Editing works on every width, phones included (owner decision, docs/QUALITY_REVIEW.md §4):
  // links can be made from the inspector as well as by dragging.
  const editable = canEdit;
  const rf = useReactFlow<StepNode, LinkEdge>();
  const wrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<StepNode>(initialNodes.map(toNode));
  const [edges, setEdges, onEdgesChange] = useEdgesState<LinkEdge>(initialEdges.map(toEdge));
  const [screens, setScreens] = useState(initialScreens);
  const [error, setError] = useState<string | null>(null);
  const viewportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const report = (res: { ok: boolean; error?: string }) => {
    setError(res.ok ? null : (res.error ?? t.autosave.failed));
    return res.ok;
  };

  const addStep = async (kind: NodeKind) => {
    const box = wrapper.current?.getBoundingClientRect();
    const center = box ? rf.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 }) : { x: 0, y: 0 };
    // Nudge so repeated adds do not stack exactly.
    const x = Math.round(center.x - 90 + (nodes.length % 5) * 16);
    const y = Math.round(center.y - 30 + (nodes.length % 5) * 16);
    const label = f.newLabel[kind];
    const res = await addNode({ flowId, kind, label, x, y });
    if (!report(res) || !res.ok || !res.id) return;
    const node = { ...toNode({ id: res.id, kind, label, x, y, screen: null }), selected: true };
    setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), node]);
    setEdges((es) => es.map((e) => (e.selected ? { ...e, selected: false } : e)));
  };

  const onConnect = useCallback(async (c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return;
    if (edges.some((e) => e.source === c.source && e.target === c.target)) return;
    // From a decision the first link is "yes", the next one "no".
    const src = nodes.find((n) => n.id === c.source);
    let branch: Branch = "default";
    if (src?.data.kind === "decision") {
      branch = edges.some((e) => e.source === c.source && e.data?.branch === "yes") ? "no" : "yes";
    }
    const res = await addEdge({ flowId, source: c.source, target: c.target, branch });
    if (!report(res) || !res.ok || !res.id) return;
    setEdges((es) => [...es, toEdge({ id: res.id!, source: c.source, target: c.target, branch, label: null, condition: null })]);
  }, [edges, nodes, flowId, setEdges]);

  const onDelete = useCallback(async ({ nodes: ns, edges: es }: { nodes: StepNode[]; edges: LinkEdge[] }) => {
    report(await deleteElements(ns.map((n) => n.id), es.map((e) => e.id)));
  }, []);

  const patchNode = (id: string, patch: Partial<StepData>) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch }, ariaLabel: `${f.kinds[patch.kind ?? n.data.kind]}: ${patch.label ?? n.data.label}` } : n)));
  const patchEdge = (id: string, patch: Partial<LinkData>) =>
    setEdges((es) => es.map((e) => (e.id === id ? styleEdge({ ...e, data: { ...e.data!, ...patch } }) : e)));

  const focusNode = (id: string) => {
    const n = rf.getNode(id);
    if (!n) return;
    setNodes((ns) => ns.map((x) => ({ ...x, selected: x.id === id })));
    setEdges((es) => es.map((e) => (e.selected ? { ...e, selected: false } : e)));
    void rf.setCenter(n.position.x + 90, n.position.y + 40, { zoom: 1, duration: 300 });
    wrapper.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Selection lives in the controlled nodes/edges, so the inspector never lags behind the canvas.
  const selNodes = nodes.filter((n) => n.selected);
  const selEdges = edges.filter((e) => e.selected);
  const node = selNodes.length === 1 && selEdges.length === 0 ? selNodes[0] : undefined;
  const edge = selEdges.length === 1 && selNodes.length === 0 ? selEdges[0] : undefined;
  const nodeOptions = useMemo(() => nodes.map((n) => ({ id: n.id, label: `${f.kinds[n.data.kind]}: ${n.data.label}` })), [nodes]);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="canvas-h" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="canvas-h" className="text-heading font-semibold">{f.canvas}</h2>
        </div>

        {editable && (
          <div role="toolbar" aria-label={f.palette} className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-meta font-semibold text-fg-secondary">{f.palette}:</span>
            {NODE_KINDS.map((k) => (
              <button key={k.value} type="button" onClick={() => addStep(k.value)}
                className="flex h-8 items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 text-meta font-semibold hover:border-fg">
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: k.color }} />
                {f.kinds[k.value]}
              </button>
            ))}
          </div>
        )}
        {editable && <p className="text-caption text-fg-secondary">{f.paletteHint}</p>}
        {error && <p role="alert" className="text-meta font-semibold text-danger">{error}</p>}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div ref={wrapper} className="flow-canvas h-[68vh] min-h-[460px] overflow-hidden rounded-panel border border-line bg-subtle">
            <ReactFlow<StepNode, LinkEdge>
              nodes={nodes} edges={edges} nodeTypes={nodeTypes}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              onConnect={editable ? onConnect : undefined}
              onDelete={editable ? onDelete : undefined}
              onNodeDragStop={(_, __, dragged) => {
                void moveNodes(dragged.map((n) => ({ id: n.id, x: Math.round(n.position.x), y: Math.round(n.position.y) }))).then(report);
              }}
              onMoveEnd={(_, vp) => {
                if (!editable) return;
                if (viewportTimer.current) clearTimeout(viewportTimer.current);
                viewportTimer.current = setTimeout(() => void saveViewport(flowId, vp), 800);
              }}
              nodesDraggable={editable} nodesConnectable={editable} edgesReconnectable={false}
              deleteKeyCode={editable ? ["Backspace", "Delete"] : null}
              defaultViewport={viewport ?? undefined}
              onInit={(inst) => {
                if (viewport || !wrapper.current) return;
                // Fit, but never below a readable zoom; a wide flow then starts from its left edge (Start).
                const box = wrapper.current.getBoundingClientRect();
                const b = inst.getNodesBounds(inst.getNodes());
                const zoom = Math.min(1, Math.max(0.6, Math.min(box.width / (b.width + 80), box.height / (b.height + 80))));
                const x = b.width * zoom + 80 > box.width ? 32 - b.x * zoom : (box.width - b.width * zoom) / 2 - b.x * zoom;
                void inst.setViewport({ x, y: (box.height - b.height * zoom) / 2 - b.y * zoom, zoom });
              }}
              minZoom={0.2} maxZoom={2} proOptions={{ hideAttribution: true }}
            >
              <Background gap={24} size={1.2} color="var(--line)" />
              <Controls showInteractive={false} />
              <MiniMap pannable zoomable className="!hidden xl:!block" nodeColor={(n) => nodeKind((n.data as StepData).kind).color} />
            </ReactFlow>
          </div>

          <aside aria-labelledby="inspector-h" className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-4 lg:max-h-[68vh] lg:overflow-y-auto">
            <h3 id="inspector-h" className="text-caption font-bold tracking-wide text-fg-secondary uppercase">{f.inspector}</h3>
            {node ? (
              <NodeInspector key={node.id} node={node} screens={screens} editable={editable} base={base}
                targets={nodeOptions.filter((o) => o.id !== node.id && !edges.some((e) => e.source === node.id && e.target === o.id))}
                onLinkTo={(target) => void onConnect({ source: node.id, target, sourceHandle: null, targetHandle: null })}
                onPatch={(patch) => patchNode(node.id, patch)}
                onScreenCreated={(s) => { setScreens((xs) => [...xs, s].sort((a, b) => a.code.localeCompare(b.code, "uk", { numeric: true }))); patchNode(node.id, { screen: s }); }}
                onDelete={async () => {
                  const connected = edges.filter((e) => e.source === node.id || e.target === node.id).map((e) => e.id);
                  if (!report(await deleteElements([node.id], connected))) return;
                  setNodes((ns) => ns.filter((n) => n.id !== node.id));
                  setEdges((es) => es.filter((e) => !connected.includes(e.id)));
                }}
                report={report} />
            ) : edge ? (
              <EdgeInspector key={edge.id} edge={edge} editable={editable}
                from={nodes.find((n) => n.id === edge.source)?.data.label ?? ""}
                to={nodes.find((n) => n.id === edge.target)?.data.label ?? ""}
                onPatch={(patch) => patchEdge(edge.id, patch)}
                onDelete={async () => {
                  if (!report(await deleteElements([], [edge.id]))) return;
                  setEdges((es) => es.filter((e) => e.id !== edge.id));
                }}
                report={report} />
            ) : (
              <p className="text-meta text-fg-secondary">{f.inspectorEmpty}</p>
            )}
          </aside>
        </div>
      </section>

      <EdgeCasesPanel flowId={flowId} initial={edgeCases} nodes={nodeOptions} canEdit={canEdit} onFocusNode={focusNode} />
    </div>
  );
}

// ---------------------------------------------------------------- inspectors

const fieldLabel = "text-meta font-semibold text-fg-secondary";

function NodeInspector({ node, screens, editable, base, targets, onLinkTo, onPatch, onScreenCreated, onDelete, report }: {
  base: string;
  /** Steps this one can link to (not itself, not already linked). */
  targets: { id: string; label: string }[];
  onLinkTo: (target: string) => void;
  node: StepNode;
  screens: Screen[];
  editable: boolean;
  onPatch: (patch: Partial<StepData>) => void;
  onScreenCreated: (s: Screen) => void;
  onDelete: () => void;
  report: (res: { ok: boolean; error?: string }) => boolean;
}) {
  const [label, setLabel] = useState(node.data.label);
  const [busy, setBusy] = useState(false);
  const saveLabel = async () => {
    if (label === node.data.label) return;
    onPatch({ label });
    report(await updateNode(node.id, { label }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="node-kind" className={fieldLabel}>{f.kind}</label>
        <Select id="node-kind" disabled={!editable} value={node.data.kind}
          onChange={async (e) => {
            const kind = e.target.value as NodeKind;
            onPatch({ kind, ...(kind !== "screen" ? { screen: null } : {}) });
            report(await updateNode(node.id, { kind }));
          }}>
          {NODE_KINDS.map((k) => <option key={k.value} value={k.value}>{f.kinds[k.value]}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="node-label" className={fieldLabel}>{f.label}</label>
        <Input id="node-label" value={label} readOnly={!editable} maxLength={200}
          onChange={(e) => setLabel(e.target.value)} onBlur={saveLabel}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
      </div>

      {node.data.kind === "screen" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="node-screen" className={fieldLabel}>{f.screen}</label>
          <Select id="node-screen" disabled={!editable || busy} value={node.data.screen?.id ?? ""}
            onChange={async (e) => {
              const s = screens.find((x) => x.id === e.target.value) ?? null;
              setBusy(true);
              const ok = report(await linkScreen(node.id, s?.id ?? null));
              setBusy(false);
              if (ok) onPatch({ screen: s });
            }}>
            <option value="">{f.screenNone}</option>
            {screens.map((s) => <option key={s.id} value={s.id}>{s.code} {s.name}</option>)}
          </Select>
          {node.data.screen && (
            <a href={`${base}/screens/${node.data.screen.code}`} className="inline-flex items-center gap-1 self-start text-meta font-semibold underline underline-offset-2">
              {f.openScreen(node.data.screen.code)}<ArrowRight aria-hidden className="size-4" />
            </a>
          )}
          {editable && !node.data.screen && (
            <Button type="button" variant="secondary" disabled={busy} className="h-9 self-start"
              title={f.screenCreateHint(label || f.newLabel.screen)}
              onClick={async () => {
                setBusy(true);
                const res = await createScreenForNode(node.id);
                setBusy(false);
                if (report(res) && res.ok && res.id && res.code) onScreenCreated({ id: res.id, code: res.code, name: res.name ?? label });
              }}>
              <Plus aria-hidden className="size-4" />{f.screenCreate}
            </Button>
          )}
        </div>
      )}

      {editable && targets.length > 0 && (
        // Linking without dragging: for touch screens and the keyboard.
        <div className="flex flex-col gap-1.5">
          <label htmlFor="node-link" className={fieldLabel}>{f.linkTo}</label>
          <Select id="node-link" value=""
            onChange={(e) => { if (e.target.value) onLinkTo(e.target.value); }}>
            <option value="">{f.linkToPlaceholder}</option>
            {targets.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        </div>
      )}

      {editable && (
        <Button variant="danger" size="sm" className="self-start" onClick={onDelete}>
          {f.deleteNode}
        </Button>
      )}
    </div>
  );
}

function EdgeInspector({ edge, from, to, editable, onPatch, onDelete, report }: {
  edge: LinkEdge;
  from: string;
  to: string;
  editable: boolean;
  onPatch: (patch: Partial<LinkData>) => void;
  onDelete: () => void;
  report: (res: { ok: boolean; error?: string }) => boolean;
}) {
  const d = edge.data!;
  const [label, setLabel] = useState(d.label ?? "");
  const [condition, setCondition] = useState(d.condition ?? "");
  const saveText = async (key: "label" | "condition", value: string) => {
    if (value === (d[key] ?? "")) return;
    onPatch({ [key]: value || null });
    report(await updateEdge(edge.id, { [key]: value }));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-meta"><span className="font-semibold">{from}</span> → <span className="font-semibold">{to}</span></p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edge-branch" className={fieldLabel}>{f.branch}</label>
        <Select id="edge-branch" disabled={!editable} value={d.branch}
          onChange={async (e) => {
            const branch = e.target.value as Branch;
            onPatch({ branch });
            report(await updateEdge(edge.id, { branch }));
          }}>
          {BRANCHES.map((b) => <option key={b.value} value={b.value}>{f.branches[b.value]}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edge-label" className={fieldLabel}>{f.edgeLabel}</label>
        <Input id="edge-label" value={label} readOnly={!editable} maxLength={120}
          onChange={(e) => setLabel(e.target.value)} onBlur={() => saveText("label", label)}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edge-condition" className={fieldLabel}>{f.condition}</label>
        <Input id="edge-condition" value={condition} readOnly={!editable} maxLength={2000}
          onChange={(e) => setCondition(e.target.value)} onBlur={() => saveText("condition", condition)} />
      </div>
      {editable && (
        <Button variant="danger" size="sm" className="self-start" onClick={onDelete}>
          {f.deleteEdge}
        </Button>
      )}
    </div>
  );
}
