import React, { useState, useMemo } from 'react';
import Button from '../common/Button';

const SLIDER_LABELS = [
  { val: 9, label: '9', desc: 'Extreme preference' },
  { val: 8, label: '8', desc: 'Very strong to extreme' },
  { val: 7, label: '7', desc: 'Very strong preference' },
  { val: 6, label: '6', desc: 'Strong to very strong' },
  { val: 5, label: '5', desc: 'Strong preference' },
  { val: 4, label: '4', desc: 'Moderate to strong' },
  { val: 3, label: '3', desc: 'Moderate preference' },
  { val: 2, label: '2', desc: 'Slight preference' },
  { val: 1, label: '1', desc: 'Equal importance' },
  { val: 1 / 2, label: '1/2', desc: 'Slight preference' },
  { val: 1 / 3, label: '1/3', desc: 'Moderate preference' },
  { val: 1 / 4, label: '1/4', desc: 'Moderate to strong' },
  { val: 1 / 5, label: '1/5', desc: 'Strong preference' },
  { val: 1 / 6, label: '1/6', desc: 'Strong to very strong' },
  { val: 1 / 7, label: '1/7', desc: 'Very strong preference' },
  { val: 1 / 8, label: '1/8', desc: 'Very strong to extreme' },
  { val: 1 / 9, label: '1/9', desc: 'Extreme preference' },
];

function valToSlider(v) {
  let best = 0;
  let bestDist = Infinity;
  SLIDER_LABELS.forEach((s, i) => {
    const d = Math.abs(s.val - v);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

function sliderToVal(i) {
  return SLIDER_LABELS[i].val;
}

function formatValue(v) {
  if (v >= 1) return String(Math.round(v));
  return '1/' + String(Math.round(1 / v));
}

/**
 * ComparisonWizard – presents one pairwise comparison at a time.
 *
 * Props:
 *   items        – array of item names
 *   matrix       – current comparison matrix
 *   onCellChange – (i, j, value) => void
 *   onComplete   – () => void   (called when user finishes all pairs)
 *   contextLabel – optional heading label (e.g. "Which criteria matter most?")
 *   contextDescription – optional sentence explaining why this step matters
 */
const ComparisonWizard = ({ items, matrix, onCellChange, onComplete, contextLabel, contextDescription }) => {
  // Build list of unique pairs (i < j)
  const pairs = useMemo(() => {
    const p = [];
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++)
        p.push({ i, j, left: items[i], right: items[j] });
    return p;
  }, [items]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  if (items.length < 2) {
    return <p className="text-nyu-text-secondary italic">Add at least 2 items to begin comparisons.</p>;
  }

  const pair = pairs[currentIdx];
  const val = matrix?.[pair.i]?.[pair.j] || 1;
  const sliderIdx = valToSlider(val);
  const sliderInfo = SLIDER_LABELS[sliderIdx];

  const isFirst = currentIdx === 0;
  const isLast = currentIdx === pairs.length - 1;

  const handleSlider = (e) => {
    const newVal = sliderToVal(Number(e.target.value));
    onCellChange(pair.i, pair.j, newVal);
  };

  const goPrev = () => setCurrentIdx(Math.max(0, currentIdx - 1));
  const goNext = () => {
    if (isLast) {
      onComplete?.();
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  // Determine which side is favoured
  const favoursLeft = sliderIdx < 8;
  const favoursRight = sliderIdx > 8;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header & progress */}
      {contextLabel && (
        <h4 className="text-lg font-semibold text-nyu-text-primary mb-1">{contextLabel}</h4>
      )}
      {contextDescription && (
        <p className="text-sm text-nyu-text-secondary mb-3">{contextDescription}</p>
      )}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-nyu-text-secondary">
          Comparison {currentIdx + 1} of {pairs.length}
        </span>
        <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-nyu-violet transition-all"
            style={{ width: `${((currentIdx + 1) / pairs.length) * 100}%` }}
          />
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-1 text-xs text-nyu-violet hover:text-nyu-violet-dark font-medium px-2 py-1 rounded border border-nyu-violet/30 hover:bg-nyu-violet-ultra transition-colors"
          title="How to compare"
        >
          <span className="text-sm">?</span> Help
        </button>
      </div>

      {/* Help panel */}
      {showHelp && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <h5 className="font-semibold mb-2">How Pairwise Comparisons Work</h5>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>You are comparing two items at a time. Drag the slider toward the item you consider <strong>more important</strong>.</li>
            <li>The further you drag, the stronger your preference. The center means <strong>equal importance</strong>.</li>
            <li><strong>1</strong> = Equal &nbsp;|&nbsp; <strong>3</strong> = Moderate &nbsp;|&nbsp; <strong>5</strong> = Strong &nbsp;|&nbsp; <strong>7</strong> = Very Strong &nbsp;|&nbsp; <strong>9</strong> = Extreme</li>
            <li>Try to be consistent: if A &gt; B and B &gt; C, then A should also &gt; C.</li>
            <li>There are no right or wrong answers — this captures <em>your</em> judgment.</li>
          </ul>
          <button onClick={() => setShowHelp(false)} className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline">Close</button>
        </div>
      )}

      {/* Comparison card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <p className="text-center text-sm text-nyu-text-secondary mb-6">
          How important is <strong>{pair.left}</strong> compared to <strong>{pair.right}</strong>?
        </p>

        {/* The two options */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex-1 text-center p-4 rounded-lg border-2 transition-colors ${favoursLeft ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
            <span className={`text-lg font-bold ${favoursLeft ? 'text-blue-700' : 'text-nyu-text-primary'}`}>{pair.left}</span>
          </div>
          <div className="px-4 text-gray-400 text-2xl font-light">vs</div>
          <div className={`flex-1 text-center p-4 rounded-lg border-2 transition-colors ${favoursRight ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
            <span className={`text-lg font-bold ${favoursRight ? 'text-orange-700' : 'text-nyu-text-primary'}`}>{pair.right}</span>
          </div>
        </div>

        {/* Intensity description */}
        <div className="text-center mb-4">
          <span className={`text-base font-semibold ${favoursLeft ? 'text-blue-700' : favoursRight ? 'text-orange-700' : 'text-gray-600'}`}>
            {favoursLeft
              ? `${sliderInfo.desc} for ${pair.left}`
              : favoursRight
                ? `${sliderInfo.desc} for ${pair.right}`
                : sliderInfo.desc}
          </span>
          <span className="ml-2 text-sm text-gray-400">({formatValue(val)})</span>
        </div>

        {/* Slider */}
        <div className="px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-medium whitespace-nowrap">◀ {pair.left}</span>
            <input
              type="range"
              min={0}
              max={16}
              value={sliderIdx}
              onChange={handleSlider}
              className="flex-1 h-3 accent-nyu-violet cursor-pointer"
            />
            <span className="text-xs text-orange-600 font-medium whitespace-nowrap">{pair.right} ▶</span>
          </div>
          {/* Scale ticks */}
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[9px] text-gray-400">9</span>
            <span className="text-[9px] text-gray-400">7</span>
            <span className="text-[9px] text-gray-400">5</span>
            <span className="text-[9px] text-gray-400">3</span>
            <span className="text-[9px] text-gray-400 font-bold">1</span>
            <span className="text-[9px] text-gray-400">3</span>
            <span className="text-[9px] text-gray-400">5</span>
            <span className="text-[9px] text-gray-400">7</span>
            <span className="text-[9px] text-gray-400">9</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={goPrev} disabled={isFirst}>
          ← Previous
        </Button>
        <div className="flex gap-1">
          {pairs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentIdx ? 'bg-nyu-violet' : 'bg-gray-300 hover:bg-gray-400'}`}
              title={`Go to pair ${idx + 1}`}
            />
          ))}
        </div>
        <Button onClick={goNext}>
          {isLast ? 'Done ✓' : 'Next →'}
        </Button>
      </div>
    </div>
  );
};

export default ComparisonWizard;
