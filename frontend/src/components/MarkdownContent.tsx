import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = "" }: Props) {
  return (
    <div
      className={`
        prose
        prose-gray
        max-w-none

        prose-headings:text-gray-900
        prose-a:text-violet-600
        prose-a:no-underline
        hover:prose-a:underline

        prose-code:text-violet-700
        prose-code:before:content-none
        prose-code:after:content-none

        prose-pre:bg-gray-900
        prose-pre:text-gray-100

        prose-table:w-full

        ${className}
      `}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
