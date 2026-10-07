import { describe, expect, it } from "vitest";
import { readTrace, traceChain, type CaseTrace } from "./case-trace";

const trace: CaseTrace = {
  nodes: [
    { code: "OBS-001", stage: "observations" }, { code: "OBS-002", stage: "observations" },
    { code: "INS-001", stage: "insights", title: "Оплата має повертати до дії" },
    { code: "PP-001", stage: "pains", title: "Бракує кредитів" },
    { code: "OPP-001", stage: "opportunities", title: "Купівля з поверненням" },
    { code: "FL-01", stage: "flows", title: "Доступ" },
    { code: "SCR-001", stage: "screens", title: "Купівля кредитів" },
    { code: "DEC-001", stage: "decisions", title: "Основний синій" },
  ],
  links: [["OBS-001", "INS-001"], ["INS-001", "PP-001"], ["PP-001", "OPP-001"], ["OPP-001", "FL-01"], ["FL-01", "SCR-001"], ["DEC-001", "SCR-001"]],
};

describe("case trace", () => {
  it("keeps links between known records and drops the rest", () => {
    const t = readTrace({ ...trace, links: [...trace.links, ["INS-001", "GONE-1"], ["OBS-001", "OBS-001"]] });
    expect(t?.links).toEqual(trace.links);
    expect(readTrace({ nodes: trace.nodes, links: [] })).toBeUndefined();
    expect(readTrace({ nodes: [{ code: "X", stage: "wrong" }], links: [] })).toBeUndefined();
    expect(readTrace(null)).toBeUndefined();
  });

  it("follows a record back to its evidence and forward to what it became", () => {
    const { up, down } = traceChain(trace, "OPP-001");
    expect([...up].sort()).toEqual(["INS-001", "OBS-001", "PP-001"]);
    expect([...down].sort()).toEqual(["DEC-001", "FL-01", "SCR-001"]);
    expect(traceChain(trace, "OBS-002")).toEqual({ up: new Set(), down: new Set() });
  });
});
