"use client";

import {
  useReducer,
  useRef,
  useCallback,
  useState,
  useEffect,
  type PointerEvent,
} from "react";
import {
  Layers,
  SquareStack,
  RectangleHorizontal,
  Type,
  Trash2,
  Save,
  Lock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  BookmarkPlus,
  LayoutTemplate,
  ChevronRight,
  Minus,
  Plus,
  X,
  Star,
} from "lucide-react";
import {
  useEventSeatMapByCode,
  useInitEventSeatMap,
  useSaveCanvas,
  useAssignPrices,
  useCommitEventSeatMap,
  useSaveAsTemplate,
  useSeatMapTemplates,
} from "@/hooks/use-seat-map";
import type {
  SeatMapElement,
  SeatMapCanvas,
  SectionElement,
  ZoneElement,
  StageElement,
  LabelElement,
  SeatMapListItem,
} from "@/schemas/seat-map";

// ─── Types ────────────────────────────────────────────────────────────────────

type ElementPatch = {
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  text?: string;
  fontSize?: number;
  rows?: number;
  seatsPerRow?: number;
  capacity?: number;
  price?: string;
  currency?: string;
};

interface DesignerState {
  elements: SeatMapElement[];
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  selectedId: string | null;
  isDirty: boolean;
  isCommitted: boolean;
}

type DesignerAction =
  | { type: "LOAD"; canvas: SeatMapCanvas; isCommitted: boolean }
  | { type: "ADD"; element: SeatMapElement }
  | { type: "UPDATE"; id: string; patch: ElementPatch }
  | { type: "DELETE"; id: string }
  | { type: "SELECT"; id: string | null }
  | { type: "MOVE"; id: string; x: number; y: number }
  | { type: "MARK_CLEAN" };

type DragRef = {
  elementId: string;
  startPt: { x: number; y: number };
  origPos: { x: number; y: number };
} | null;

// ─── Constants ───────────────────────────────────────────────────────────────

const PALETTE = [
  "#6366f1",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#06b6d4",
];

const CURRENCIES = ["VND", "USD", "EUR"];

const snap = (v: number, g: number) => Math.round(v / g) * g;

// ─── Reducer ─────────────────────────────────────────────────────────────────

const INITIAL_STATE: DesignerState = {
  elements: [],
  canvasWidth: 900,
  canvasHeight: 600,
  gridSize: 20,
  selectedId: null,
  isDirty: false,
  isCommitted: false,
};

function reducer(state: DesignerState, action: DesignerAction): DesignerState {
  switch (action.type) {
    case "LOAD":
      return {
        ...state,
        elements: action.canvas.elements,
        canvasWidth: action.canvas.width,
        canvasHeight: action.canvas.height,
        gridSize: action.canvas.gridSize ?? 20,
        isDirty: false,
        isCommitted: action.isCommitted,
      };
    case "ADD":
      return {
        ...state,
        elements: [...state.elements, action.element],
        selectedId: action.element.id,
        isDirty: true,
      };
    case "UPDATE": {
      const elements = state.elements.map((el) =>
        el.id !== action.id
          ? el
          : ({ ...el, ...action.patch } as SeatMapElement),
      );
      return { ...state, elements, isDirty: true };
    }
    case "DELETE":
      return {
        ...state,
        elements: state.elements.filter((el) => el.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        isDirty: true,
      };
    case "SELECT":
      return { ...state, selectedId: action.id };
    case "MOVE": {
      const elements = state.elements.map((el) =>
        el.id !== action.id
          ? el
          : ({ ...el, x: action.x, y: action.y } as SeatMapElement),
      );
      return { ...state, elements, isDirty: true };
    }
    case "MARK_CLEAN":
      return { ...state, isDirty: false };
    default:
      return state;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SeatMapDesigner({ eventCode }: { eventCode: string }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragRef>(null);

  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const [priceInputs, setPriceInputs] = useState<
    Record<string, { price: string; currency: string }>
  >({});

  const {
    data: seatMapData,
    isLoading,
    error: loadError,
  } = useEventSeatMapByCode(eventCode);
  const initMutation = useInitEventSeatMap(eventCode);
  const saveMutation = useSaveCanvas(eventCode);
  const priceMutation = useAssignPrices(eventCode);
  const commitMutation = useCommitEventSeatMap(eventCode);
  const saveAsTemplateMutation = useSaveAsTemplate(eventCode);

  // Load canvas when data arrives
  useEffect(() => {
    if (seatMapData?.data) {
      dispatch({
        type: "LOAD",
        canvas: seatMapData.data.canvas,
        isCommitted: seatMapData.data.isCommitted,
      });
      // Seed price inputs from existing elements
      const prices: Record<string, { price: string; currency: string }> = {};
      for (const el of seatMapData.data.canvas.elements) {
        if ((el.type === "section" || el.type === "zone") && el.price) {
          prices[el.id] = { price: el.price, currency: el.currency ?? "VND" };
        }
      }
      setPriceInputs(prices);
    }
  }, [seatMapData]);

  // SVG coordinate conversion
  const getSVGCoords = useCallback((e: PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = new DOMPoint(e.clientX, e.clientY);
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }, []);

  // Drag handlers
  const handleElementPointerDown = useCallback(
    (e: PointerEvent<SVGGElement>, id: string) => {
      if (state.isCommitted) return;
      e.stopPropagation();
      const coords = getSVGCoords(e);
      const el = state.elements.find((x) => x.id === id);
      if (!el) return;
      dragRef.current = {
        elementId: id,
        startPt: coords,
        origPos: { x: el.x, y: el.y },
      };
      dispatch({ type: "SELECT", id });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [state.isCommitted, state.elements, getSVGCoords],
  );

  const handleSVGPointerMove = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (!dragRef.current) return;
      const { elementId, startPt, origPos } = dragRef.current;
      const { x, y } = getSVGCoords(e);
      const newX = snap(origPos.x + (x - startPt.x), state.gridSize);
      const newY = snap(origPos.y + (y - startPt.y), state.gridSize);
      dispatch({ type: "MOVE", id: elementId, x: newX, y: newY });
    },
    [getSVGCoords, state.gridSize],
  );

  const handleSVGPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (
        document.activeElement as HTMLElement
      )?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        state.selectedId &&
        !state.isCommitted
      ) {
        dispatch({ type: "DELETE", id: state.selectedId });
      }
      if (e.key === "Escape") dispatch({ type: "SELECT", id: null });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.selectedId, state.isCommitted]);

  // Element factories
  const addSection = useCallback(() => {
    const count = state.elements.filter((el) => el.type === "section").length;
    const el: SectionElement = {
      id: crypto.randomUUID(),
      type: "section",
      name: `Section ${String.fromCharCode(65 + count)}`,
      x: snap(80 + (count % 3) * 180, state.gridSize),
      y: snap(120 + Math.floor(count / 3) * 140, state.gridSize),
      width: 160,
      height: 120,
      color: PALETTE[count % PALETTE.length],
      rows: 8,
      seatsPerRow: 10,
    };
    dispatch({ type: "ADD", element: el });
  }, [state.elements, state.gridSize]);

  const addZone = useCallback(() => {
    const count = state.elements.filter((el) => el.type === "zone").length;
    const el: ZoneElement = {
      id: crypto.randomUUID(),
      type: "zone",
      name: `Zone ${count + 1}`,
      capacity: 100,
      x: snap(200 + (count % 2) * 160, state.gridSize),
      y: snap(380 + Math.floor(count / 2) * 100, state.gridSize),
      width: 140,
      height: 80,
      color: PALETTE[(count + 5) % PALETTE.length],
    };
    dispatch({ type: "ADD", element: el });
  }, [state.elements, state.gridSize]);

  const addStage = useCallback(() => {
    const el: StageElement = {
      id: crypto.randomUUID(),
      type: "stage",
      label: "STAGE",
      x: snap(250, state.gridSize),
      y: snap(20, state.gridSize),
      width: 400,
      height: 60,
    };
    dispatch({ type: "ADD", element: el });
  }, [state.gridSize]);

  const addLabel = useCallback(() => {
    const count = state.elements.filter((el) => el.type === "label").length;
    const el: LabelElement = {
      id: crypto.randomUUID(),
      type: "label",
      text: "Label",
      x: snap(100 + count * 20, state.gridSize),
      y: snap(50 + count * 20, state.gridSize),
      fontSize: 14,
      color: "#94a3b8",
    };
    dispatch({ type: "ADD", element: el });
  }, [state.elements, state.gridSize]);

  // Save canvas
  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    const canvas: SeatMapCanvas = {
      width: state.canvasWidth,
      height: state.canvasHeight,
      gridSize: state.gridSize,
      elements: state.elements,
    };
    try {
      await saveMutation.mutateAsync(canvas);
      dispatch({ type: "MARK_CLEAN" });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [state, saveMutation]);

  // Assign prices for a single element
  const handleAssignPrice = useCallback(
    async (elementId: string) => {
      const input = priceInputs[elementId];
      if (!input?.price) return;
      await priceMutation.mutateAsync([
        { elementId, price: input.price, currency: input.currency },
      ]);
    },
    [priceMutation, priceInputs],
  );

  const handleCommit = useCallback(async () => {
    await commitMutation.mutateAsync();
    setShowCommitDialog(false);
  }, [commitMutation]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!templateName.trim()) return;
    await saveAsTemplateMutation.mutateAsync(templateName.trim());
    setShowSaveAsTemplate(false);
    setTemplateName("");
  }, [saveAsTemplateMutation, templateName]);

  const handleInitFromTemplate = useCallback(
    async (templateId: string) => {
      await initMutation.mutateAsync(templateId);
      setShowTemplatePicker(false);
    },
    [initMutation],
  );

  const selectedEl =
    state.elements.find((el) => el.id === state.selectedId) ?? null;
  const hasNoSeatMap = !isLoading && loadError;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-screen flex-col"
      style={{
        background: "#07080f",
        color: "#cbd5e1",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Top Bar */}
      <header
        className="flex h-12 shrink-0 items-center gap-3 border-b px-4"
        style={{ borderColor: "#1a1f2e", background: "#0a0c16" }}
      >
        <div className="flex items-center gap-1.5 text-sm">
          <span style={{ color: "#475569" }}>Organizer</span>
          <ChevronRight className="size-3.5" style={{ color: "#334155" }} />
          <span style={{ color: "#475569" }}>Events</span>
          <ChevronRight className="size-3.5" style={{ color: "#334155" }} />
          <span style={{ color: "#94a3b8" }} className="font-mono">
            {eventCode}
          </span>
          <ChevronRight className="size-3.5" style={{ color: "#334155" }} />
          <span style={{ color: "#e2e8f0" }} className="font-semibold">
            Seat Map
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Status indicator */}
          {state.isCommitted ? (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                background: "#78350f22",
                color: "#f59e0b",
                border: "1px solid #78350f",
              }}
            >
              <Lock className="size-3" />
              Committed
            </span>
          ) : state.isDirty ? (
            <span
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "#64748b" }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: "#f59e0b" }}
              />
              Unsaved
            </span>
          ) : saveStatus === "saved" ? (
            <span
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "#10b981" }}
            >
              <CheckCircle2 className="size-3.5" />
              Saved
            </span>
          ) : null}

          {/* Template picker */}
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: "#1e2030",
              color: "#94a3b8",
              border: "1px solid #2a2f42",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "#252840")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "#1e2030")
            }
          >
            <LayoutTemplate className="size-3.5" />
            {hasNoSeatMap ? "Init from Template" : "Templates"}
          </button>

          {/* Save */}
          {!state.isCommitted && (
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending || !state.isDirty}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40"
              style={{
                background: "#1e40af",
                color: "#bfdbfe",
                border: "1px solid #1d4ed8",
              }}
              onMouseEnter={(e) => {
                if (!saveMutation.isPending && state.isDirty)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#1d4ed8";
              }}
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "#1e40af")
              }
            >
              {saveStatus === "saving" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save
            </button>
          )}

          {/* Commit */}
          {!state.isCommitted && (
            <button
              onClick={() => setShowCommitDialog(true)}
              disabled={state.isDirty || state.elements.length === 0}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40"
              style={{
                background: "#78350f",
                color: "#fde68a",
                border: "1px solid #92400e",
              }}
              onMouseEnter={(e) => {
                if (!state.isDirty && state.elements.length > 0)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#92400e";
              }}
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "#78350f")
              }
            >
              <Lock className="size-3.5" />
              Commit
            </button>
          )}

          {/* Save as template */}
          {state.isCommitted && (
            <button
              onClick={() => setShowSaveAsTemplate(true)}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: "#1e2030",
                color: "#94a3b8",
                border: "1px solid #2a2f42",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "#252840")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "#1e2030")
              }
            >
              <BookmarkPlus className="size-3.5" />
              Save as Template
            </button>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <aside
          className="flex w-56 shrink-0 flex-col border-r"
          style={{ background: "#090b15", borderColor: "#1a1f2e" }}
        >
          <div
            className="border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ borderColor: "#1a1f2e", color: "#475569" }}
          >
            Elements
          </div>

          {!state.isCommitted && (
            <div className="flex flex-col gap-1 p-2">
              <ToolbarButton
                icon={<SquareStack className="size-3.5" />}
                label="Section"
                sublabel="Individual seats"
                onClick={addSection}
                color="#6366f1"
              />
              <ToolbarButton
                icon={<RectangleHorizontal className="size-3.5" />}
                label="Zone"
                sublabel="GA / capacity"
                onClick={addZone}
                color="#10b981"
              />
              <ToolbarButton
                icon={<Layers className="size-3.5" />}
                label="Stage"
                sublabel="Non-interactive"
                onClick={addStage}
                color="#334155"
              />
              <ToolbarButton
                icon={<Type className="size-3.5" />}
                label="Label"
                sublabel="Text annotation"
                onClick={addLabel}
                color="#64748b"
              />
            </div>
          )}

          <div
            className="border-t px-3 py-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ borderColor: "#1a1f2e", color: "#475569" }}
          >
            Layers ({state.elements.length})
          </div>

          <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
            {state.elements.length === 0 ? (
              <p
                className="px-2 py-3 text-center text-xs"
                style={{ color: "#334155" }}
              >
                No elements yet
              </p>
            ) : (
              [...state.elements]
                .reverse()
                .map((el) => (
                  <LayerRow
                    key={el.id}
                    element={el}
                    isSelected={state.selectedId === el.id}
                    isCommitted={state.isCommitted}
                    onSelect={() => dispatch({ type: "SELECT", id: el.id })}
                    onDelete={() => dispatch({ type: "DELETE", id: el.id })}
                  />
                ))
            )}
          </div>
        </aside>

        {/* Canvas Area */}
        <main
          className="relative flex flex-1 flex-col overflow-auto"
          style={{ background: "#07080f" }}
          onClick={() => dispatch({ type: "SELECT", id: null })}
        >
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2
                className="size-6 animate-spin"
                style={{ color: "#334155" }}
              />
            </div>
          ) : hasNoSeatMap ? (
            <EmptyCanvasState
              onInitFromTemplate={() => setShowTemplatePicker(true)}
            />
          ) : (
            <div className="p-8">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${state.canvasWidth} ${state.canvasHeight}`}
                width={state.canvasWidth}
                height={state.canvasHeight}
                className="block rounded-lg"
                style={{
                  background: "#090c18",
                  outline: "1px solid #1e2235",
                  filter: "drop-shadow(0 0 40px rgba(0,0,0,0.6))",
                  cursor: state.isCommitted ? "default" : "crosshair",
                }}
                onPointerMove={handleSVGPointerMove}
                onPointerUp={handleSVGPointerUp}
                onClick={(e) => e.stopPropagation()}
              >
                <defs>
                  <pattern
                    id="grid-dots"
                    x="0"
                    y="0"
                    width={state.gridSize}
                    height={state.gridSize}
                    patternUnits="userSpaceOnUse"
                  >
                    <circle
                      cx={state.gridSize / 2}
                      cy={state.gridSize / 2}
                      r="0.8"
                      fill="rgba(148,163,184,0.18)"
                    />
                  </pattern>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width={state.canvasWidth}
                  height={state.canvasHeight}
                  fill="url(#grid-dots)"
                />

                {state.elements.map((el) => (
                  <CanvasElement
                    key={el.id}
                    element={el}
                    isSelected={state.selectedId === el.id}
                    isCommitted={state.isCommitted}
                    onPointerDown={(e) => handleElementPointerDown(e, el.id)}
                  />
                ))}
              </svg>

              <p
                className="mt-3 text-center text-xs"
                style={{ color: "#1e2a3a" }}
              >
                {state.isCommitted
                  ? "Canvas is locked — committed"
                  : "Drag to move  ·  Delete key to remove  ·  Click to select"}
              </p>
            </div>
          )}
        </main>

        {/* Right Properties Panel */}
        <aside
          className="flex w-72 shrink-0 flex-col border-l"
          style={{ background: "#090b15", borderColor: "#1a1f2e" }}
        >
          {selectedEl ? (
            <PropertiesPanel
              element={selectedEl}
              isCommitted={state.isCommitted}
              priceInput={
                priceInputs[selectedEl.id] ?? { price: "", currency: "VND" }
              }
              onPriceChange={(price, currency) =>
                setPriceInputs((prev) => ({
                  ...prev,
                  [selectedEl.id]: { price, currency },
                }))
              }
              onAssignPrice={() => handleAssignPrice(selectedEl.id)}
              isPriceAssigning={priceMutation.isPending}
              onChange={(patch) =>
                dispatch({ type: "UPDATE", id: selectedEl.id, patch })
              }
              onDelete={() => dispatch({ type: "DELETE", id: selectedEl.id })}
            />
          ) : (
            <EmptyPropertiesPanel elementCount={state.elements.length} />
          )}
        </aside>
      </div>

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleInitFromTemplate}
          onClose={() => setShowTemplatePicker(false)}
          isLoading={initMutation.isPending}
        />
      )}

      {/* Commit Dialog */}
      {showCommitDialog && (
        <ConfirmDialog
          title="Commit seat map?"
          description="This will lock the canvas and generate seats + ticket types. This action cannot be undone."
          confirmLabel="Commit"
          confirmStyle={{ background: "#78350f", color: "#fde68a" }}
          isLoading={commitMutation.isPending}
          onConfirm={handleCommit}
          onCancel={() => setShowCommitDialog(false)}
        />
      )}

      {/* Save as Template Dialog */}
      {showSaveAsTemplate && (
        <OverlayPanel onClose={() => setShowSaveAsTemplate(false)}>
          <h2
            className="mb-4 text-base font-semibold"
            style={{ color: "#e2e8f0" }}
          >
            Save as Template
          </h2>
          <label className="mb-1.5 block text-xs" style={{ color: "#64748b" }}>
            Template name
          </label>
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Small Theater Layout"
            className="mb-4 w-full rounded px-3 py-2 text-sm outline-none"
            style={{
              background: "#111525",
              border: "1px solid #1e2235",
              color: "#e2e8f0",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSaveAsTemplate()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowSaveAsTemplate(false)}
              className="rounded px-3 py-1.5 text-sm"
              style={{ color: "#64748b" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAsTemplate}
              disabled={
                !templateName.trim() || saveAsTemplateMutation.isPending
              }
              className="flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-semibold disabled:opacity-40"
              style={{ background: "#1e40af", color: "#bfdbfe" }}
            >
              {saveAsTemplateMutation.isPending && (
                <Loader2 className="size-3.5 animate-spin" />
              )}
              Save
            </button>
          </div>
        </OverlayPanel>
      )}
    </div>
  );
}

// ─── Canvas Element ───────────────────────────────────────────────────────────

function CanvasElement({
  element,
  isSelected,
  isCommitted,
  onPointerDown,
}: {
  element: SeatMapElement;
  isSelected: boolean;
  isCommitted: boolean;
  onPointerDown: (e: PointerEvent<SVGGElement>) => void;
}) {
  const selStroke = "#f59e0b";
  const selWidth = 2;

  if (element.type === "stage") {
    return (
      <g
        onPointerDown={onPointerDown}
        style={{ cursor: isCommitted ? "default" : "move" }}
      >
        <rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          rx={6}
          fill="#1a2040"
          stroke={isSelected ? selStroke : "#2d3a5c"}
          strokeWidth={isSelected ? selWidth : 1}
        />
        <text
          x={element.x + element.width / 2}
          y={element.y + element.height / 2 + 5}
          textAnchor="middle"
          fontSize={Math.min(16, element.height * 0.38)}
          fontWeight="700"
          letterSpacing="4"
          fill="#3d5a8a"
        >
          {(element.label ?? "STAGE").toUpperCase()}
        </text>
        {isSelected && <SelectionHandles element={element} />}
      </g>
    );
  }

  if (element.type === "section") {
    const fill = element.color ?? "#6366f1";
    const totalSeats = (element.rows ?? 0) * (element.seatsPerRow ?? 0);
    return (
      <g
        onPointerDown={onPointerDown}
        style={{ cursor: isCommitted ? "default" : "move" }}
      >
        <rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          rx={4}
          fill={fill}
          fillOpacity={isSelected ? 0.95 : 0.8}
          stroke={isSelected ? selStroke : "transparent"}
          strokeWidth={isSelected ? selWidth : 0}
        />
        {/* Subtle row lines */}
        {Array.from({ length: Math.min((element.rows ?? 0) - 1, 8) }).map(
          (_, i) => {
            const y =
              element.y + (element.height / (element.rows ?? 1)) * (i + 1);
            return (
              <line
                key={i}
                x1={element.x + 4}
                y1={y}
                x2={element.x + element.width - 4}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.5}
              />
            );
          },
        )}
        <text
          x={element.x + element.width / 2}
          y={element.y + element.height / 2 - (totalSeats > 0 ? 6 : 0)}
          textAnchor="middle"
          fontSize={Math.min(12, element.height * 0.22)}
          fontWeight="700"
          fill="#fff"
        >
          {element.name}
        </text>
        {totalSeats > 0 && (
          <text
            x={element.x + element.width / 2}
            y={element.y + element.height / 2 + 10}
            textAnchor="middle"
            fontSize={Math.min(9, element.height * 0.16)}
            fill="rgba(255,255,255,0.65)"
          >
            {totalSeats} seats
          </text>
        )}
        {element.price && (
          <text
            x={element.x + element.width - 6}
            y={element.y + 13}
            textAnchor="end"
            fontSize={8}
            fill="rgba(255,255,255,0.5)"
            fontFamily="var(--font-mono)"
          >
            {Number(element.price).toLocaleString()} {element.currency}
          </text>
        )}
        {isSelected && <SelectionHandles element={element} />}
      </g>
    );
  }

  if (element.type === "zone") {
    const fill = element.color ?? "#10b981";
    return (
      <g
        onPointerDown={onPointerDown}
        style={{ cursor: isCommitted ? "default" : "move" }}
      >
        <rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          rx={4}
          fill={fill}
          fillOpacity={isSelected ? 0.9 : 0.7}
          stroke={isSelected ? selStroke : "transparent"}
          strokeWidth={isSelected ? selWidth : 0}
          strokeDasharray={isSelected ? "0" : "0"}
        />
        {/* Diagonal pattern for GA */}
        <rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          rx={4}
          fill="url(#ga-diagonal)"
          fillOpacity={0.15}
        />
        <text
          x={element.x + element.width / 2}
          y={element.y + element.height / 2 - 5}
          textAnchor="middle"
          fontSize={Math.min(11, element.height * 0.2)}
          fontWeight="700"
          fill="#fff"
        >
          {element.name}
        </text>
        <text
          x={element.x + element.width / 2}
          y={element.y + element.height / 2 + 9}
          textAnchor="middle"
          fontSize={Math.min(8, element.height * 0.15)}
          fill="rgba(255,255,255,0.6)"
        >
          GA · {element.capacity} cap
        </text>
        {isSelected && <SelectionHandles element={element} />}
      </g>
    );
  }

  if (element.type === "label") {
    return (
      <g
        onPointerDown={onPointerDown}
        style={{ cursor: isCommitted ? "default" : "move" }}
      >
        {isSelected && (
          <rect
            x={element.x - 4}
            y={element.y - (element.fontSize ?? 14) - 2}
            width={
              (element.text?.length ?? 5) * ((element.fontSize ?? 14) * 0.6) + 8
            }
            height={(element.fontSize ?? 14) + 8}
            rx={2}
            fill="none"
            stroke={selStroke}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
        )}
        <text
          x={element.x}
          y={element.y}
          fontSize={element.fontSize ?? 12}
          fill={element.color ?? "#94a3b8"}
          fontWeight="500"
        >
          {element.text}
        </text>
      </g>
    );
  }

  return null;
}

function SelectionHandles({
  element,
}: {
  element: { x: number; y: number; width: number; height: number };
}) {
  const hw = 6;
  const corners = [
    { cx: element.x, cy: element.y },
    { cx: element.x + element.width, cy: element.y },
    { cx: element.x, cy: element.y + element.height },
    { cx: element.x + element.width, cy: element.y + element.height },
  ];
  return (
    <>
      {corners.map((c, i) => (
        <rect
          key={i}
          x={c.cx - hw / 2}
          y={c.cy - hw / 2}
          width={hw}
          height={hw}
          fill="#f59e0b"
          rx={1}
          style={{ pointerEvents: "none" }}
        />
      ))}
    </>
  );
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolbarButton({
  icon,
  label,
  sublabel,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: () => void;
  color: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors"
      style={{
        background: hovered ? "#111525" : "transparent",
      }}
    >
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded"
        style={{ background: `${color}22`, color }}
      >
        {icon}
      </span>
      <span>
        <span
          className="block text-xs font-semibold"
          style={{ color: "#cbd5e1" }}
        >
          {label}
        </span>
        <span className="block text-[10px]" style={{ color: "#475569" }}>
          {sublabel}
        </span>
      </span>
    </button>
  );
}

// ─── Layer Row ────────────────────────────────────────────────────────────────

const ELEMENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  section: <SquareStack className="size-3" />,
  zone: <RectangleHorizontal className="size-3" />,
  stage: <Layers className="size-3" />,
  label: <Type className="size-3" />,
};

function LayerRow({
  element,
  isSelected,
  isCommitted,
  onSelect,
  onDelete,
}: {
  element: SeatMapElement;
  isSelected: boolean;
  isCommitted: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const color =
    element.type === "section" || element.type === "zone"
      ? (element.color ?? "#6366f1")
      : element.type === "stage"
        ? "#334155"
        : "#475569";

  const label =
    element.type === "label"
      ? element.text
      : element.type === "stage"
        ? (element.label ?? "Stage")
        : element.name;

  return (
    <div
      onClick={onSelect}
      className="group flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors"
      style={{
        background: isSelected ? "#111828" : "transparent",
        border: isSelected ? "1px solid #1e2a3c" : "1px solid transparent",
      }}
    >
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-sm"
        style={{ background: `${color}33`, color }}
      >
        {ELEMENT_TYPE_ICONS[element.type]}
      </span>
      <span
        className="flex-1 truncate text-xs"
        style={{ color: isSelected ? "#e2e8f0" : "#94a3b8" }}
      >
        {label}
      </span>
      {!isCommitted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="hidden size-5 items-center justify-center rounded transition-colors group-hover:flex"
          style={{ color: "#ef4444" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "#ef444422")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "transparent")
          }
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  );
}

// ─── Properties Panel ─────────────────────────────────────────────────────────

function PropertiesPanel({
  element,
  isCommitted,
  priceInput,
  onPriceChange,
  onAssignPrice,
  isPriceAssigning,
  onChange,
  onDelete,
}: {
  element: SeatMapElement;
  isCommitted: boolean;
  priceInput: { price: string; currency: string };
  onPriceChange: (price: string, currency: string) => void;
  onAssignPrice: () => void;
  isPriceAssigning: boolean;
  onChange: (patch: ElementPatch) => void;
  onDelete: () => void;
}) {
  const isEditable = !isCommitted;

  const color =
    element.type === "section" || element.type === "zone"
      ? (element.color ?? "#6366f1")
      : element.type === "stage"
        ? "#3d5a8a"
        : "#64748b";

  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Header */}
      <div
        className="flex items-center gap-2 border-b px-3 py-2.5"
        style={{ borderColor: "#1a1f2e" }}
      >
        <span className="size-2 rounded-full" style={{ background: color }} />
        <span
          className="flex-1 text-sm font-semibold capitalize"
          style={{ color: "#e2e8f0" }}
        >
          {element.type}
        </span>
        {isEditable && (
          <button
            onClick={onDelete}
            className="flex size-6 items-center justify-center rounded transition-colors"
            style={{ color: "#ef4444" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "#ef444420")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "transparent")
            }
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5 p-3">
        {/* Name / Label / Text */}
        {element.type === "section" && (
          <PanelField label="Name">
            <PanelInput
              value={element.name}
              disabled={!isEditable}
              onChange={(v) => onChange({ name: v })}
            />
          </PanelField>
        )}
        {element.type === "zone" && (
          <PanelField label="Name">
            <PanelInput
              value={element.name}
              disabled={!isEditable}
              onChange={(v) => onChange({ name: v })}
            />
          </PanelField>
        )}
        {element.type === "stage" && (
          <PanelField label="Label">
            <PanelInput
              value={element.label ?? ""}
              disabled={!isEditable}
              onChange={(v) => onChange({ label: v })}
            />
          </PanelField>
        )}
        {element.type === "label" && (
          <PanelField label="Text">
            <PanelInput
              value={element.text}
              disabled={!isEditable}
              onChange={(v) => onChange({ text: v })}
            />
          </PanelField>
        )}

        {/* Position */}
        {element.type !== "label" && (
          <div>
            <SectionLabel>Position & Size</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <PanelField label="X">
                <PanelNumberInput
                  value={element.x}
                  disabled={!isEditable}
                  onChange={(v) => onChange({ x: v })}
                />
              </PanelField>
              <PanelField label="Y">
                <PanelNumberInput
                  value={element.y}
                  disabled={!isEditable}
                  onChange={(v) => onChange({ y: v })}
                />
              </PanelField>
              <PanelField label="W">
                <PanelNumberInput
                  value={element.width}
                  disabled={!isEditable}
                  onChange={(v) => onChange({ width: v })}
                />
              </PanelField>
              <PanelField label="H">
                <PanelNumberInput
                  value={element.height}
                  disabled={!isEditable}
                  onChange={(v) => onChange({ height: v })}
                />
              </PanelField>
            </div>
          </div>
        )}

        {/* Label position */}
        {element.type === "label" && (
          <div>
            <SectionLabel>Position</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <PanelField label="X">
                <PanelNumberInput
                  value={element.x}
                  disabled={!isEditable}
                  onChange={(v) => onChange({ x: v })}
                />
              </PanelField>
              <PanelField label="Y">
                <PanelNumberInput
                  value={element.y}
                  disabled={!isEditable}
                  onChange={(v) => onChange({ y: v })}
                />
              </PanelField>
              <PanelField label="Size">
                <PanelNumberInput
                  value={element.fontSize ?? 12}
                  disabled={!isEditable}
                  onChange={(v) => onChange({ fontSize: v })}
                />
              </PanelField>
            </div>
          </div>
        )}

        {/* Color */}
        {(element.type === "section" ||
          element.type === "zone" ||
          element.type === "label") && (
          <div>
            <SectionLabel>Color</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => isEditable && onChange({ color: c })}
                  disabled={!isEditable}
                  className="size-5 rounded-sm transition-transform disabled:cursor-not-allowed"
                  style={{
                    background: c,
                    outline:
                      (element.type === "section" || element.type === "zone"
                        ? element.color
                        : element.color) === c
                        ? "2px solid #f59e0b"
                        : "2px solid transparent",
                    outlineOffset: "1px",
                    transform:
                      (element.type === "section" || element.type === "zone"
                        ? element.color
                        : element.color) === c
                        ? "scale(1.15)"
                        : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Section-specific: rows & seats */}
        {element.type === "section" && (
          <div>
            <SectionLabel>Seating Config</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <PanelField label="Rows">
                <PanelNumberInput
                  value={element.rows ?? 0}
                  disabled={!isEditable}
                  onChange={(v) => onChange({ rows: v })}
                />
              </PanelField>
              <PanelField label="Per Row">
                <PanelNumberInput
                  value={element.seatsPerRow ?? 0}
                  disabled={!isEditable}
                  onChange={(v) => onChange({ seatsPerRow: v })}
                />
              </PanelField>
            </div>
            {(element.rows ?? 0) > 0 && (element.seatsPerRow ?? 0) > 0 && (
              <p className="mt-1.5 text-[10px]" style={{ color: "#475569" }}>
                {(element.rows ?? 0) * (element.seatsPerRow ?? 0)} total seats
              </p>
            )}
          </div>
        )}

        {/* Zone-specific: capacity */}
        {element.type === "zone" && (
          <div>
            <SectionLabel>Capacity</SectionLabel>
            <PanelNumberInput
              value={element.capacity}
              disabled={!isEditable}
              onChange={(v) => onChange({ capacity: v })}
            />
          </div>
        )}

        {/* Pricing (section + zone only) */}
        {(element.type === "section" || element.type === "zone") && (
          <div>
            <SectionLabel>Pricing</SectionLabel>
            <div className="flex gap-2">
              <input
                type="number"
                value={priceInput.price}
                disabled={isCommitted}
                onChange={(e) =>
                  onPriceChange(e.target.value, priceInput.currency)
                }
                placeholder="e.g. 200000"
                className="min-w-0 flex-1 rounded px-2 py-1.5 text-xs font-mono outline-none disabled:opacity-40"
                style={{
                  background: "#0f1222",
                  border: "1px solid #1e2235",
                  color: "#e2e8f0",
                }}
              />
              <select
                value={priceInput.currency}
                disabled={isCommitted}
                onChange={(e) =>
                  onPriceChange(priceInput.price, e.target.value)
                }
                className="rounded px-1.5 py-1.5 text-xs outline-none disabled:opacity-40"
                style={{
                  background: "#0f1222",
                  border: "1px solid #1e2235",
                  color: "#94a3b8",
                }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {!isCommitted && (
              <button
                onClick={onAssignPrice}
                disabled={!priceInput.price || isPriceAssigning}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded py-1.5 text-xs font-semibold disabled:opacity-40"
                style={{
                  background: "#1a2f1a",
                  color: "#4ade80",
                  border: "1px solid #14532d",
                }}
              >
                {isPriceAssigning && (
                  <Loader2 className="size-3 animate-spin" />
                )}
                Apply Price
              </button>
            )}
            {element.price && (
              <p className="mt-1.5 text-[10px]" style={{ color: "#10b981" }}>
                ✓ {Number(element.price).toLocaleString()} {element.currency}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared Panel Primitives ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: "#334155" }}
    >
      {children}
    </p>
  );
}

function PanelField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-0.5 text-[10px]" style={{ color: "#475569" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function PanelInput({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded px-2 py-1.5 text-xs outline-none disabled:opacity-40"
      style={{
        background: "#0f1222",
        border: "1px solid #1e2235",
        color: "#e2e8f0",
      }}
    />
  );
}

function PanelNumberInput({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded px-2 py-1.5 text-xs font-mono outline-none disabled:opacity-40"
      style={{
        background: "#0f1222",
        border: "1px solid #1e2235",
        color: "#e2e8f0",
      }}
    />
  );
}

function EmptyPropertiesPanel({ elementCount }: { elementCount: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <div
        className="flex size-12 items-center justify-center rounded-xl"
        style={{ background: "#111525" }}
      >
        <Layers className="size-5" style={{ color: "#334155" }} />
      </div>
      <p className="text-sm font-medium" style={{ color: "#475569" }}>
        {elementCount === 0 ? "Add elements to start" : "Select an element"}
      </p>
      <p className="text-xs" style={{ color: "#334155" }}>
        {elementCount === 0
          ? "Use the left toolbar to add sections, zones, stages, and labels"
          : "Click any element on the canvas to edit its properties"}
      </p>
    </div>
  );
}

// ─── Empty Canvas State ───────────────────────────────────────────────────────

function EmptyCanvasState({
  onInitFromTemplate,
}: {
  onInitFromTemplate: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div
        className="flex flex-col items-center gap-4 rounded-2xl p-10"
        style={{ border: "1px dashed #1e2a3c", background: "#0a0c18" }}
      >
        <div
          className="flex size-16 items-center justify-center rounded-2xl"
          style={{ background: "#111828" }}
        >
          <LayoutTemplate className="size-8" style={{ color: "#334155" }} />
        </div>
        <div className="text-center">
          <h3
            className="mb-1 text-base font-semibold"
            style={{ color: "#e2e8f0" }}
          >
            No seat map yet
          </h3>
          <p className="max-w-xs text-sm" style={{ color: "#475569" }}>
            Initialize from a reusable template, or start with a blank canvas
            and add elements from the toolbar.
          </p>
        </div>
        <button
          onClick={onInitFromTemplate}
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
          style={{
            background: "#1e2a50",
            color: "#93c5fd",
            border: "1px solid #1e3a7a",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "#1e3a70")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "#1e2a50")
          }
        >
          <LayoutTemplate className="size-4" />
          Choose a Template
        </button>
      </div>
    </div>
  );
}

// ─── Template Picker ──────────────────────────────────────────────────────────

function TemplatePicker({
  onSelect,
  onClose,
  isLoading,
}: {
  onSelect: (id: string) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [search, setSearch] = useState("");
  const { data, isLoading: templatesLoading } = useSeatMapTemplates({
    search: search || undefined,
    limit: 20,
  });
  const templates = data?.data ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col rounded-2xl shadow-2xl"
        style={{
          background: "#0d0f1c",
          border: "1px solid #1e2235",
          maxHeight: "80vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "#1e2235" }}
        >
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "#e2e8f0" }}
            >
              Choose a Template
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: "#475569" }}>
              Initialize the seat map from an existing template
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg transition-colors"
            style={{ color: "#475569" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "#1e2235")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "transparent")
            }
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b px-5 py-3" style={{ borderColor: "#1e2235" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: "#111525",
              border: "1px solid #1e2235",
              color: "#e2e8f0",
            }}
            autoFocus
          />
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto p-4">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2
                className="size-5 animate-spin"
                style={{ color: "#334155" }}
              />
            </div>
          ) : templates.length === 0 ? (
            <p
              className="py-12 text-center text-sm"
              style={{ color: "#334155" }}
            >
              No templates found
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  isLoading={isLoading}
                  onSelect={() => onSelect(t.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  isLoading,
  onSelect,
}: {
  template: SeatMapListItem;
  isLoading: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onSelect}
      disabled={isLoading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col overflow-hidden rounded-xl text-left transition-all disabled:opacity-50"
      style={{
        background: hovered ? "#111828" : "#0f1120",
        border: `1px solid ${hovered ? "#2a3452" : "#1e2235"}`,
        transform: hovered ? "translateY(-1px)" : "none",
      }}
    >
      {/* Preview area */}
      <div
        className="flex h-24 items-center justify-center"
        style={{ background: "#0a0c16", borderBottom: "1px solid #1e2235" }}
      >
        {template.previewImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.previewImageUrl}
            alt={template.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <LayoutTemplate className="size-8" style={{ color: "#1e2a3c" }} />
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2">
          <p
            className="flex-1 truncate text-sm font-semibold"
            style={{ color: "#e2e8f0" }}
          >
            {template.name}
          </p>
          {template.isSystem && (
            <Star className="size-3 shrink-0" style={{ color: "#f59e0b" }} />
          )}
        </div>
        {template.description && (
          <p className="mt-0.5 truncate text-xs" style={{ color: "#475569" }}>
            {template.description}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Shared Overlay Helpers ───────────────────────────────────────────────────

function OverlayPanel({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: "#0d0f1c", border: "1px solid #1e2235" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmStyle,
  isLoading,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmStyle: React.CSSProperties;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <OverlayPanel onClose={onCancel}>
      <div className="mb-4 flex items-start gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "#78350f22" }}
        >
          <AlertTriangle className="size-4" style={{ color: "#f59e0b" }} />
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: "#e2e8f0" }}>
            {title}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
            {description}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm transition-colors"
          style={{ color: "#64748b" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "#111525")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "transparent")
          }
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={confirmStyle}
        >
          {isLoading && <Loader2 className="size-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </OverlayPanel>
  );
}
