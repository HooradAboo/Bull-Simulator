import { useLayoutEffect, useState } from "react";
import "./tutorial.css";

export interface TutorialStep {
  key: string;
  title: string;
  description: string;
  // One selector, several (highlighted together, e.g. an action spread
  // across the ribbon and the reading pane), or null for a broad,
  // scene-setting step with no specific UI target - the whole screen just
  // dims and the caption centers itself.
  targetSelector: string | string[] | null;
}

interface Props {
  steps: TutorialStep[];
  onFinish: () => void;
}

function useTargetRects(selectors: string[], key: string): DOMRect[] {
  const [rects, setRects] = useState<DOMRect[]>([]);

  useLayoutEffect(() => {
    if (selectors.length === 0) {
      setRects([]);
      return;
    }
    const measure = () => {
      const found = selectors
        .map((s) => document.querySelector(s))
        .filter((el): el is Element => el !== null)
        .map((el) => el.getBoundingClientRect());
      setRects(found);
    };
    measure();
    window.addEventListener("resize", measure);
    // Practice email content and modals can shift layout after mount, so
    // re-measure on an interval rather than only once - cheap given there
    // are only ever a handful of tour steps active at a time.
    const intervalId = window.setInterval(measure, 250);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return rects;
}

const CAPTION_WIDTH = 320;
const CAPTION_MARGIN = 12;
const HIGHLIGHT_PAD = 8;

export function TutorialSpotlight({ steps, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const selectors = !step.targetSelector
    ? []
    : Array.isArray(step.targetSelector)
      ? step.targetSelector
      : [step.targetSelector];
  const rects = useTargetRects(selectors, selectors.join("|"));

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const goNext = () => (isLast ? onFinish() : setIndex((i) => i + 1));
  const goBack = () => setIndex((i) => Math.max(0, i - 1));

  const highlights = rects.map((r) => ({
    top: r.top - HIGHLIGHT_PAD,
    left: r.left - HIGHLIGHT_PAD,
    width: r.width + HIGHLIGHT_PAD * 2,
    height: r.height + HIGHLIGHT_PAD * 2,
  }));

  // Union of all highlighted rects, used only to place the caption sensibly
  // when a step lights up several scattered elements at once.
  const unionBox =
    highlights.length > 0
      ? {
          top: Math.min(...highlights.map((h) => h.top)),
          left: Math.min(...highlights.map((h) => h.left)),
          bottom: Math.max(...highlights.map((h) => h.top + h.height)),
          right: Math.max(...highlights.map((h) => h.left + h.width)),
        }
      : null;

  const captionBelow = unionBox ? unionBox.bottom + 160 < window.innerHeight : true;
  const captionLeft = unionBox
    ? Math.min(
        Math.max(unionBox.left, CAPTION_MARGIN),
        window.innerWidth - CAPTION_WIDTH - CAPTION_MARGIN
      )
    : window.innerWidth / 2 - CAPTION_WIDTH / 2;

  return (
    <div className="tutorial-overlay">
      {/* Invisible full-screen layer that absorbs every click during the
          tour - the real handlers are already gated on tourActive, this is
          just a belt-and-suspenders visual/interaction lock. */}
      <div className="tutorial-click-blocker" />

      <svg className="tutorial-mask-svg">
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlights.map((h, i) => (
              <rect key={i} x={h.left} y={h.top} width={h.width} height={h.height} rx="8" fill="black" />
            ))}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(10, 12, 16, 0.68)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {highlights.map((h, i) => (
        <div key={i} className="tutorial-highlight-ring" style={h} />
      ))}

      <div
        className="tutorial-caption"
        style={{
          left: captionLeft,
          width: CAPTION_WIDTH,
          ...(unionBox
            ? captionBelow
              ? { top: unionBox.bottom + CAPTION_MARGIN }
              : { top: unionBox.top - CAPTION_MARGIN, transform: "translateY(-100%)" }
            : { top: "40%" }),
        }}
      >
        <div className="tutorial-caption-step">
          Step {index + 1} of {steps.length}
        </div>
        <div className="tutorial-caption-title">{step.title}</div>
        <div className="tutorial-caption-desc">{step.description}</div>
        <div className="tutorial-caption-actions">
          <button type="button" className="tutorial-btn-secondary" onClick={onFinish}>
            Skip
          </button>
          <div className="tutorial-caption-nav">
            {!isFirst && (
              <button type="button" className="tutorial-btn-secondary" onClick={goBack}>
                Back
              </button>
            )}
            <button type="button" className="tutorial-btn-primary" onClick={goNext}>
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
