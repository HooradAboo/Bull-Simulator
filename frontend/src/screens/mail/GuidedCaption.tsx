import "./tutorial.css";
import { useTargetRects } from "./TutorialSpotlight";

const CAPTION_WIDTH = 320;
const CAPTION_MARGIN = 12;
const HIGHLIGHT_PAD = 8;

interface Props {
  stepLabel: string;
  title: string;
  description: string;
  targetSelector: string | string[] | null;
  onSkip: () => void;
  // Only the transition step between the two practice emails uses this -
  // it has no real interaction to auto-advance on, so it needs an explicit
  // button instead.
  onContinue?: () => void;
  continueLabel?: string;
  // Skips the dim/mask/highlight-ring treatment entirely and renders just
  // the instruction box, fixed at the bottom of the screen - used for the
  // second practice email so the repeat pass feels lighter than the first.
  noSpotlight?: boolean;
}

export function GuidedCaption({
  stepLabel,
  title,
  description,
  targetSelector,
  onSkip,
  onContinue,
  continueLabel,
  noSpotlight,
}: Props) {
  const selectors =
    noSpotlight || !targetSelector
      ? []
      : Array.isArray(targetSelector)
        ? targetSelector
        : [targetSelector];
  const rects = useTargetRects(selectors, selectors.join("|"));

  if (noSpotlight) {
    return (
      <div className="guided-instruction">
        <div className="tutorial-caption-step">{stepLabel}</div>
        <div className="tutorial-caption-title">{title}</div>
        <div className="tutorial-caption-desc">{description}</div>
        <div className="tutorial-caption-actions">
          <button type="button" className="guided-skip-link" onClick={onSkip}>
            Skip to Free Practice
          </button>
          {onContinue && (
            <button type="button" className="tutorial-btn-primary" onClick={onContinue}>
              {continueLabel ?? "Continue"}
            </button>
          )}
        </div>
      </div>
    );
  }

  const highlights = rects.map((r) => ({
    top: r.top - HIGHLIGHT_PAD,
    left: r.left - HIGHLIGHT_PAD,
    width: r.width + HIGHLIGHT_PAD * 2,
    height: r.height + HIGHLIGHT_PAD * 2,
  }));

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
    // No click-blocker here (unlike TutorialSpotlight) - the mask/highlight
    // are purely cosmetic, and every interaction restriction during guided
    // practice is enforced at the handler level in TutorialScreen instead,
    // so the highlighted element (and only it, per those handler checks)
    // stays genuinely clickable underneath.
    <div className="tutorial-overlay guided-overlay">
      <svg className="tutorial-mask-svg">
        <defs>
          <mask id="guided-spotlight-mask">
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
          mask="url(#guided-spotlight-mask)"
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
        <div className="tutorial-caption-step">{stepLabel}</div>
        <div className="tutorial-caption-title">{title}</div>
        <div className="tutorial-caption-desc">{description}</div>
        <div className="tutorial-caption-actions">
          <button type="button" className="guided-skip-link" onClick={onSkip}>
            Skip to Free Practice
          </button>
        </div>
      </div>
    </div>
  );
}
