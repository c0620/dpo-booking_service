interface Props {
  show: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onHide: () => void;
  showReason?: boolean;
  reason?: string;
  onReasonChange?: (value: string) => void;
}

export function ConfirmModal({
  show,
  title,
  body,
  confirmLabel = "Подтвердить",
  onConfirm,
  onHide,
  showReason,
  reason,
  onReasonChange,
}: Props) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onHide} role="presentation">
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="modal-header">
          <h2 id="confirm-modal-title" className="modal-title h1">
            {title}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onHide}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className="modal-body h2">
          <p>{body}</p>
          {showReason && (
            <textarea
              className="modal-textarea"
              rows={3}
              placeholder="Комментарий для пользователя (необязательно)"
              value={reason ?? ""}
              onChange={(e) => onReasonChange?.(e.target.value)}
            />
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn-outline-custom admin-btn-dark b1"
            onClick={onHide}
          >
            Отмена
          </button>
          <button
            type="button"
            className="btn-danger-custom b1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
