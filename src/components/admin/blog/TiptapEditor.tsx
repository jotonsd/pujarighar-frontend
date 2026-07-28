"use client";

import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold, Italic, Link as LinkIcon, List, ListOrdered, Heading2, Heading3, Undo, Redo,
} from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  active, onClick, children, title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
        active ? "bg-amber-100 text-amber-700" : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function TiptapEditor({ label, value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-amber-600 underline" } }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[200px] px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const setLink = () => {
    if (!editor) return;
    const url = window.prompt("URL");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {editor && (
          <div className="flex items-center gap-0.5 border-b border-gray-100 px-1.5 py-1 bg-gray-50 flex-wrap">
            <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Numbered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
