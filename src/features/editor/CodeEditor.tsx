import Editor from '@monaco-editor/react'
import styles from './CodeEditor.module.css'

type CodeEditorProps = {
  label: string
  language: 'html' | 'css' | 'json'
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function CodeEditor({
  label,
  language,
  value,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  return (
    <div className={readOnly ? `${styles.wrap} ${styles.wrapReadOnly}` : styles.wrap}>
      <div className={styles.label}>
        <span>{label}</span>
        {readOnly ? <span className={styles.readOnlyTag}>Solo lectura</span> : null}
      </div>
      <div className={styles.monaco}>
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={(next) => {
            if (!readOnly) onChange(next ?? '')
          }}
          theme="light"
          options={{
            readOnly,
            domReadOnly: readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
