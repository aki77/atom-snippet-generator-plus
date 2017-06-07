'use babel';

import SelectListView from 'atom-select-list';

export default class ScopeView {
  constructor() {
    this.panel = null;
    this.selectListView = new SelectListView({
      items: [],
      elementForItem: (scope) => {
        const li = document.createElement('li');
        li.textContent = scope;
        return li;
      },
      didConfirmSelection: (scope) => {
        this.callback(scope);
        this.cancel();
      },
      didConfirmEmptySelection: () => {
        this.cancel();
      },
      didCancelSelection: () => {
        this.cancel();
      },
    });
    this.element = this.selectListView.element;
  }

  async toggle(editor, callback) {
    this.callback = callback;
    if (this.panel != null) {
      this.cancel();
    } else {
      this.selectListView.reset();
      await this.populate(editor);
      this.attach();
    }
  }

  cancel() {
    if (this.panel != null) {
      this.panel.destroy();
      this.panel = null;
    }

    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  populate(editor) {
    return this.selectListView.update({ items: editor.getCursorScope().getScopesArray() });
  }

  attach() {
    this.previouslyFocusedElement = document.activeElement;
    this.panel = atom.workspace.addModalPanel({ item: this });
    this.selectListView.focus();
  }
}
