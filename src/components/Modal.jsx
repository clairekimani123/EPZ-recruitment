// --------------------------------------------------------------------------
// A generic popup dialog. Any page can use this the same way: keep an
// `isOpen` boolean in state, render <Modal isOpen={...} onClose={...}>,
// and put whatever form/content inside as children. Nothing in here knows
// about companies or batches specifically - that's what makes it reusable.
// --------------------------------------------------------------------------

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    // Clicking the dark backdrop closes the modal...
    <div className="modal-backdrop" onClick={onClose}>
      {/* ...but clicking inside the panel itself must NOT close it, so we
          stop the click from "bubbling up" to the backdrop's onClick. */}
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
