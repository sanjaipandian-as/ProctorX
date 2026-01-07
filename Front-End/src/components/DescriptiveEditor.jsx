import React, { useState, useEffect, useRef } from 'react';
import {
    Link as LinkIcon,
    List,
    ListOrdered
} from 'lucide-react';

const DescriptiveEditor = ({ value, onChange = () => { }, placeholder = "Write your answer here...", maxWords = 1000 }) => {
    const [wordCount, setWordCount] = useState(0);
    const textareaRef = useRef(null);

    useEffect(() => {
        const text = (value || "");
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        setWordCount(words);
    }, [value]);

    const insertText = (before, after = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentVal = value || "";
        const selectedText = currentVal.substring(start, end);
        const newText = currentVal.substring(0, start) + before + selectedText + after + currentVal.substring(end);

        onChange(newText);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(start + before.length, start + before.length + selectedText.length);
            }
        }, 0);
    };

    const handleFormat = (type) => {
        switch (type) {
            case 'bold': insertText('**', '**'); break;
            case 'italic': insertText('~~', '~~'); break;
            case 'link': insertText('[', '](url)'); break;
            case 'ul': {
                const textBefore = (value || "").substring(0, textareaRef.current?.selectionStart || 0);
                const needsNewline = textBefore.length > 0 && !textBefore.endsWith('\n');
                insertText(needsNewline ? '\n- ' : '- ');
                break;
            }
            case 'ol': {
                const textBefore = (value || "").substring(0, textareaRef.current?.selectionStart || 0);
                const needsNewline = textBefore.length > 0 && !textBefore.endsWith('\n');
                insertText(needsNewline ? '\n1. ' : '1. ');
                break;
            }
            default: break;
        }
    };

    return (
        <div className="flex flex-col w-full border border-gray-300 rounded bg-white overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#F3F4F6] border-b border-gray-300">
                <div className="flex items-center gap-1">
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('bold')}
                        className="w-8 h-8 flex items-center justify-center text-gray-800 hover:bg-gray-200 rounded font-bold transition-colors"
                        title="Bold"
                    >
                        B
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('italic')}
                        className="w-8 h-8 flex items-center justify-center text-gray-800 hover:bg-gray-200 rounded italic transition-colors font-serif"
                        title="Sliding/Slanted"
                    >
                        I
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('link')}
                        className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded transition-colors"
                        title="Insert Link"
                    >
                        <LinkIcon size={16} />
                    </button>
                    <div className="w-[1px] h-4 bg-gray-300 mx-1" />
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('ul')}
                        className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded transition-colors"
                        title="Bullet List"
                    >
                        <List size={18} />
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('ol')}
                        className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded transition-colors"
                        title="Numbered List"
                    >
                        <ListOrdered size={18} />
                    </button>
                </div>

                <div className="text-sm font-medium text-gray-500">
                    {wordCount}/{maxWords} words
                </div>
            </div>

            <textarea
                ref={textareaRef}
                rows={12}
                className="w-full p-4 text-gray-800 text-lg leading-relaxed focus:outline-none resize-none bg-white font-sans placeholder-gray-400"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export default DescriptiveEditor;
