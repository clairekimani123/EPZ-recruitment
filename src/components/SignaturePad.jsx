import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// --------------------------------------------------------------------------
// A minimal signature pad built directly on the HTML5 Canvas API - no
// external library needed for something this simple. Works with mouse,
// touch, and stylus input via Pointer Events (one event model that covers
// all three input types, rather than writing separate mouse/touch handlers).
//
// Exposes two methods to the PARENT component via a ref, since the parent
// (the admission form) needs to grab the finished drawing at submit time:
//   - isEmpty(): has anything actually been drawn?
//   - toBlob(callback): converts the canvas drawing to a PNG image Blob,
//     which can then be uploaded through the exact same document-upload
//     system used for ID copies and photos (see TraineeApplyPage.jsx).
// --------------------------------------------------------------------------

const SignaturePad = forwardRef(function SignaturePad(props, ref) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);
  const [isEmptyState, setIsEmptyState] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Render at higher resolution than the CSS size for a crisp line,
    // then scale the drawing context to match - otherwise signatures
    // look blurry/pixelated on high-DPI screens.
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = '#0d3b66';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e) {
    isDrawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e) {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawn.current) {
      hasDrawn.current = true;
      setIsEmptyState(false);
    }
  }

  function handlePointerUp() {
    isDrawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    setIsEmptyState(true);
  }

  useImperativeHandle(ref, () => ({
    isEmpty: () => !hasDrawn.current,
    toBlob: (callback) => canvasRef.current.toBlob(callback, 'image/png'),
    clear,
  }));

  return (
    <div>
      <div className="signature-pad-wrap">
        <canvas
          ref={canvasRef}
          style={{ height: 160 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {isEmptyState ? 'Sign above using your mouse or finger' : 'Signature captured'}
        </span>
        <button type="button" className="button button-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={clear}>
          Clear
        </button>
      </div>
    </div>
  );
});

export default SignaturePad;