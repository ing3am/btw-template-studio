import Editor from '@monaco-editor/react'
import styles from './CodeEditor.module.css'

type CodeEditorProps = {
  label: string
  language: 'html' | 'css' | 'json'
  value: string
  onChange: (value: string) => void
}

export function CodeEditor({ label, language, value, onChange }: CodeEditorProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{label}</div>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(next) => onChange(next ?? '')}
        theme="light"
        options={{
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
  )
}
