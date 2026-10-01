export interface ModalHistoryEntry {
  id: string;
  onClose: () => void;
}

export class ModalHistoryManager {
  private activeModals: ModalHistoryEntry[] = [];
  private historyPushedCount = 0;
  private isProgrammaticBack = false;
  private pendingCleanupTimer: ReturnType<typeof setTimeout> | null = null;
  private listenerAttached = false;

  private isAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.history !== 'undefined' &&
      typeof window.history.pushState === 'function' &&
      typeof window.addEventListener === 'function'
    );
  }

  private handlePopState = (_event: PopStateEvent) => {
    if (this.isProgrammaticBack) {
      this.isProgrammaticBack = false;
      return;
    }

    if (this.pendingCleanupTimer !== null) {
      clearTimeout(this.pendingCleanupTimer);
      this.pendingCleanupTimer = null;
    }

    if (this.activeModals.length > 0) {
      // Browser back button or back gesture was activated by user.
      // The browser has already popped one history entry.
      if (this.historyPushedCount > 0) {
        this.historyPushedCount--;
      }

      const topModal = this.activeModals.pop();
      if (topModal) {
        topModal.onClose();
      }
    }
  };

  private ensureListener() {
    if (!this.listenerAttached && this.isAvailable()) {
      window.addEventListener('popstate', this.handlePopState);
      this.listenerAttached = true;
    }
  }

  public pushModal(id: string, onClose: () => void): () => void {
    if (!this.isAvailable()) {
      return () => {};
    }

    this.ensureListener();

    if (this.pendingCleanupTimer !== null) {
      clearTimeout(this.pendingCleanupTimer);
      this.pendingCleanupTimer = null;
    }

    const existingIndex = this.activeModals.findIndex((m) => m.id === id);
    if (existingIndex >= 0) {
      this.activeModals[existingIndex].onClose = onClose;
      return () => this.popModal(id);
    }

    // Push history entry only if we don't already have one holding this slot
    // (e.g. during a rapid modal-to-modal transition) or if this is stacked on top
    if (this.historyPushedCount <= this.activeModals.length) {
      try {
        const state = window.history.state || {};
        window.history.pushState(
          { ...state, spreadSpendsModal: id },
          '',
          window.location.href
        );
        this.historyPushedCount++;
      } catch {
        // Fallback for sandboxed iframes or restricted environments
      }
    }

    this.activeModals.push({ id, onClose });

    return () => this.popModal(id);
  }

  public popModal(id: string) {
    if (!this.isAvailable()) return;

    const index = this.activeModals.findIndex((m) => m.id === id);
    if (index >= 0) {
      this.activeModals.splice(index, 1);
    }

    // If activeModals count is less than historyPushedCount,
    // we have extra history entries that must be cleanly popped via history.back()
    if (this.activeModals.length < this.historyPushedCount) {
      if (this.pendingCleanupTimer !== null) {
        clearTimeout(this.pendingCleanupTimer);
      }

      this.pendingCleanupTimer = setTimeout(() => {
        this.pendingCleanupTimer = null;
        while (this.activeModals.length < this.historyPushedCount) {
          this.isProgrammaticBack = true;
          this.historyPushedCount--;
          try {
            window.history.back();
          } catch {
            this.isProgrammaticBack = false;
            break;
          }
        }
      }, 0);
    }
  }

  public getActiveCount(): number {
    return this.activeModals.length;
  }

  public getPushedCount(): number {
    return this.historyPushedCount;
  }

  public reset() {
    if (this.pendingCleanupTimer !== null) {
      clearTimeout(this.pendingCleanupTimer);
      this.pendingCleanupTimer = null;
    }
    this.activeModals = [];
    this.historyPushedCount = 0;
    this.isProgrammaticBack = false;
    if (this.listenerAttached && typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.handlePopState);
      this.listenerAttached = false;
    }
  }
}

export const modalHistory = new ModalHistoryManager();
export const pushModal = (id: string, onClose: () => void) => modalHistory.pushModal(id, onClose);
export const popModal = (id: string) => modalHistory.popModal(id);
