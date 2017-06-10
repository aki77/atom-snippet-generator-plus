'use babel';

import { CompositeDisposable } from 'atom';
import ScopeView from './scope-view';

const SINGLE_LINE_SNIPPET = `
'\${1:Snippet Name}':
  'prefix': '\${2:Snippet Trigger}'
  'body': '\${3:BODY}'
`.trim();

const MULTI_LINE_SNIPPET = `
'\${1:Snippet Name}':
  'prefix': '\${2:Snippet Trigger}'
  'body': '''
    \${3:BODY}
  '''
`.trim();

const buildSnippet = (body) => {
  if (body.trim().length < 1) {
    return SINGLE_LINE_SNIPPET;
  }

  const name = body.trim().split('\n', 2)[0];
  const prefix = name.replace(/\W/g, '').toLowerCase();
  const snippet = body.trim().match(/\n/) ? MULTI_LINE_SNIPPET : SINGLE_LINE_SNIPPET;
  return snippet
    .replace('Snippet Name', name)
    .replace('Snippet Trigger', prefix)
    .replace('BODY', body);
};

export default {
  subscriptions: null,

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.commands.add('atom-text-editor', {
        'snippet-generator-plus:generate': ({ currentTarget }) =>
          this.generate(currentTarget.getModel()),
      }),
    );
  },

  deactivate() {
    this.subscriptions.dispose();
    this.subscriptions = null;
  },

  generate(editor) {
    if (!this.scopeView) {
      this.scopeView = new ScopeView();
    }
    this.scopeView.toggle(editor, async (scope) => {
      const snippetsEditor = await atom.workspace.open('atom://.atom/snippets');
      this.insert(snippetsEditor, scope, editor.getSelectedText());
    });
  },

  insert(editor, scope, body) {
    let match = false;
    editor.scan(new RegExp(`^'\\.${scope}'`), ({ range, stop }) => {
      stop();
      match = true;
      editor.transact(() => {
        editor.setCursorBufferPosition([range.start.row, 0]);
        editor.moveToEndOfLine();
        editor.insertNewline();
      });
    });

    if (!match) {
      editor.transact(() => {
        editor.setCursorBufferPosition([editor.getLastBufferRow() + 1, 0]);
        editor.moveToEndOfLine();
        editor.insertNewline();
        editor.insertText(`'.${scope}':\n  `);
      });
    }

    this.snippetsManager.insertSnippet(buildSnippet(body), editor);
    editor.scrollToCursorPosition();
  },

  consumeSnippets(snippetsManager) {
    this.snippetsManager = snippetsManager;
  },
};
