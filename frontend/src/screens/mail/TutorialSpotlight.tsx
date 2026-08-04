import { useLayoutEffect, useState } from "react";
import "./tutorial.css";

export interface TutorialStep {
  key: string;
  title: string;
  description: string;
  targetSelector: string;
}

interface Props {
  steps: TutorialStep[];
  onFinish: () => void;
}

function useTargetRect(selector: string): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector(selector);
      setRect(el ? el.getBoundingClientRect() : null);
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
  }, [selector]);

  return rect;
}

const CAPTION_WIDTH = 320;
const CAPTION_MARGIN = 12;
const HIGHLIGHT_PAD = 8;

export function TutorialSpotlight({ steps, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const rect = useTargetRect(step.targetSelector);

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const goNext = () => (isLast ? onFinish() : setIndex((i) => i + 1));
  const goBack = () => setIndex((i) => Math.max(0, i - 1));

  const highlight = rect
    ? {
        top: rect.top - HIGHLIGHT_PAD,
        left: rect.left - HIGHLIGHT_PAD,
        width: rect.width + HIGHLIGHT_PAD * 2,
        height: rect.height + HIGHLIGHT_PAD * 2,
      }
    : null;

  const captionBelow = highlight ? highlight.top + highlight.height + 160 < window.innerHeight : true;
  const captionLeft = highlight
    ? Math.min(Math.max(highlight.left, CAPTION_MARGIN), window.innerWidth - CAPTION_WIDTH - CAPTION_MARGIN)
    : window.innerWidth / 2 - CAPTION_WIDTH / 2;

  return (
    <div className="tutorial-overlay">
      {highlight && (
        <>
          <div
            className="tutorial-mask"
            style={{ top: 0, left: 0, right: 0, height: highlight.top }}
          />
          <div
            className="tutorial-mask"
            style={{ top: highlight.top + highlight.height, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="tutorial-mask"
            style={{ top: highlight.top, left: 0, width: highlight.left, height: highlight.height }}
          />
          <div
            className="tutorial-mask"
            style={{
              top: highlight.top,
              left: highlight.left + highlight.width,
              right: 0,
              height: highlight.height,
            }}
          />
          <div className="tutorial-highlight-ring" style={highlight} />
        </>
      )}

      <div
        className="tutorial-caption"
        style={{
          left: captionLeft,
          width: CAPTION_WIDTH,
          ...(highlight
            ? captionBelow
              ? { top: highlight.top + highlight.height + CAPTION_MARGIN }
              : { top: highlight.top - CAPTION_MARGIN, transform: "translateY(-100%)" }
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
