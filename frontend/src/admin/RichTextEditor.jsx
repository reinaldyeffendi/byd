import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo, Link2, Code,
} from "lucide-react";

const Btn = ({ active, onClick, label, children, testId }) => (
  <button type="button" onClick={onClick} title={label} aria-label={label} data-testid={testId}
          className={`flex h-9 w-9 items-center justify-center border transition-colors duration-200 ${
            active ? "border-[#d92d20] text-white" : "border-white/15 text-white/60 hover:text-white"
          }`}>
    {children}
  </button>
);

export const RichTextEditor = ({ value, onChange, testId = "rich-editor" }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose-byd min-h-[260px] max-w-none border border-white/15 border-t-0 bg-[#0d0d0d] p-4 text-sm text-white focus:outline-none",
        "data-testid": `${testId}-content`,
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return <div className="h-64 animate-pulse border border-white/15 bg-[#0d0d0d]" />;

  const addLink = () => {
    const url = window.prompt("URL tautan (https://…)", editor.getAttributes("link").href || "https://");
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div data-testid={testId}>
      <div className="flex flex-wrap gap-1 border border-white/15 bg-[#111111] p-2">
        <Btn testId={`${testId}-bold`} label="Bold" active={editor.isActive("bold")}
             onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </Btn>
        <Btn testId={`${testId}-italic`} label="Italic" active={editor.isActive("italic")}
             onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </Btn>
        <Btn testId={`${testId}-h2`} label="Judul 2" active={editor.isActive("heading", { level: 2 })}
             onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-3.5 w-3.5" />
        </Btn>
        <Btn testId={`${testId}-h3`} label="Judul 3" active={editor.isActive("heading", { level: 3 })}
             onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-3.5 w-3.5" />
        </Btn>
        <Btn testId={`${testId}-bullet`} label="Daftar" active={editor.isActive("bulletList")}
             onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </Btn>
        <Btn testId={`${testId}-ordered`} label="Daftar bernomor" active={editor.isActive("orderedList")}
             onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </Btn>
        <Btn testId={`${testId}-quote`} label="Kutipan" active={editor.isActive("blockquote")}
             onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-3.5 w-3.5" />
        </Btn>
        <Btn testId={`${testId}-link`} label="Tautan" active={editor.isActive("link")} onClick={addLink}>
          <Link2 className="h-3.5 w-3.5" />
        </Btn>
        <Btn testId={`${testId}-code`} label="Kode" active={editor.isActive("codeBlock")}
             onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-3.5 w-3.5" />
        </Btn>
        <span className="mx-1 w-px bg-white/10" />
        <Btn testId={`${testId}-undo`} label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-3.5 w-3.5" />
        </Btn>
        <Btn testId={`${testId}-redo`} label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-3.5 w-3.5" />
        </Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
