import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { subscribeToChannel } from '@/lib/supabase';

interface CollaborativeEditorProps {
  projectId: string;
  initialContent: string;
  language?: string;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  projectId,
  initialContent,
  language = 'javascript',
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: initialContent,
        language,
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: {
          enabled: false,
        },
      });

      // Subscribe to real-time updates
      const subscription = subscribeToChannel(`editor:${projectId}`, (payload) => {
        const { content, position } = payload;
        if (editorRef.current) {
          const currentPosition = editorRef.current.getPosition();
          editorRef.current.setValue(content);
          if (currentPosition) {
            editorRef.current.setPosition(currentPosition);
          }
        }
      });

      return () => {
        editorRef.current?.dispose();
        subscription.unsubscribe();
      };
    }
  }, [projectId, initialContent, language]);

  return (
    <div className="w-full h-[600px] border border-gray-300 rounded-lg">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default CollaborativeEditor;
