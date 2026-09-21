import { X } from 'lucide-react';

/**
 * A status bar shown after schedule actions (cancel, day-off, time change).
 * Displays a message with an optional Undo action and a Dismiss button.
 *
 * @param {{
 *   message: string,
 *   onUndo?: () => void,
 *   onDismiss: () => void,
 *   undoing?: boolean,
 * }} props
 */
export default function UndoBar({ message, onUndo, onDismiss, undoing }) {
  return (
    <div className="sch2-undo" role="status">
      <span className="sch2-undo__msg">{message}</span>

      <div className="sch2-undo__actions">
        {onUndo && (
          <button
            type="button"
            className="sch2-undo__btn"
            onClick={onUndo}
            disabled={undoing}
          >
            {undoing ? 'Undoing…' : 'Undo'}
          </button>
        )}
        <button
          type="button"
          className="sch2-undo__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
