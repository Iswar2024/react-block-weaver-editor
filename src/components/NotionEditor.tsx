import React, { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image,
  Table,
  Calendar,
  CheckSquare,
  Palette,
  Type,
  MoreHorizontal,
  Plus,
  X
} from 'lucide-react';
import CalendarView, { CalendarEvent } from './CalendarView';

interface Block {
  id: string;
  type: 'text' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'quote' | 'code' | 'image' | 'table' | 'calendar' | 'todo';
  content: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    color?: string;
    backgroundColor?: string;
    align?: 'left' | 'center' | 'right';
  };
  data?: any;
}

const NotionEditor = () => {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: '1', type: 'text', content: '' }
  ]);
  const [activeBlockId, setActiveBlockId] = useState<string>('1');
  const [showToolbar, setShowToolbar] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const activeBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        setSelectedText(selection.toString());
        setShowToolbar(true);
        
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        const editorRect = editorRef.current?.getBoundingClientRect();

        if (editorRect) {
          const toolbarX = rect.left - editorRect.left;
          const toolbarY = rect.top - editorRect.top - 50;
          
          // Basic positioning, needs more sophisticated logic
          const toolbar = document.querySelector('.fixed');
          if (toolbar) {
            toolbar.setAttribute('style', `left: ${toolbarX}px; top: ${toolbarY}px;`);
          }
        }
      } else {
        setShowToolbar(false);
        setSelectedText('');
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('mousedown', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('mousedown', handleSelection);
    };
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (showSlashMenu) {
        setShowSlashMenu(false);
        return;
      }

      const newBlock: Block = {
        id: Date.now().toString(),
        type: 'text',
        content: ''
      };
      
      const blockIndex = blocks.findIndex(b => b.id === blockId);
      const newBlocks = [...blocks];
      newBlocks.splice(blockIndex + 1, 0, newBlock);
      
      setBlocks(newBlocks);
      setActiveBlockId(newBlock.id);
      
      setTimeout(() => {
        const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
        if (newBlockElement) {
          newBlockElement.focus();
        }
      }, 0);
    } else if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      const blockIndex = blocks.findIndex(b => b.id === blockId);
      const newBlocks = blocks.filter(b => b.id !== blockId);
      setBlocks(newBlocks);
      
      if (blockIndex > 0) {
        setActiveBlockId(newBlocks[blockIndex - 1].id);
        setTimeout(() => {
          const prevBlockElement = document.querySelector(`[data-block-id="${newBlocks[blockIndex - 1].id}"]`) as HTMLElement;
          if (prevBlockElement) {
            prevBlockElement.focus();
          }
        }, 0);
      }
    } else if (e.key === '/' && block.content === '') {
      const rect = activeBlockRef.current?.getBoundingClientRect();
      if (rect) {
        setSlashMenuPosition({ x: rect.left, y: rect.bottom });
        setShowSlashMenu(true);
      }
    }
  }, [blocks, showSlashMenu]);

  const handleContentChange = useCallback((blockId: string, content: string) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId ? { ...block, content } : block
      )
    );
  }, []);

  const addBlock = (type: Block['type'], content: string = '') => {
    const activeBlockIndex = blocks.findIndex(b => b.id === activeBlockId);
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content,
      data: type === 'calendar' ? { selectedDate: new Date() } : undefined
    };
    
    const newBlocks = [...blocks];
    newBlocks.splice(activeBlockIndex + 1, 0, newBlock);
    
    setBlocks(newBlocks);
    setActiveBlockId(newBlock.id);
    setShowSlashMenu(false);
  };

  const deleteBlock = (blockId: string) => {
    if (blocks.length === 1) return;
    
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    
    if (activeBlockId === blockId) {
      setActiveBlockId(newBlocks[0].id);
    }
  };

  const formatText = (format: string) => {
    const activeBlock = blocks.find(b => b.id === activeBlockId);
    if (!activeBlock) return;

    setBlocks(prevBlocks => 
      prevBlocks.map(block => {
        if (block.id === activeBlockId) {
          const currentStyle = block.style || {};
          return {
            ...block,
            style: {
              ...currentStyle,
              [format]: !currentStyle[format as keyof typeof currentStyle]
            }
          };
        }
        return block;
      })
    );
  };

  const handleEventCreate = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: Date.now().toString()
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const handleEventUpdate = (eventId: string, updatedEvent: Partial<CalendarEvent>) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === eventId ? { ...event, ...updatedEvent } : event
      )
    );
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const handleDateSelect = (blockId: string, date: Date) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId 
          ? { ...block, data: { ...block.data, selectedDate: date } }
          : block
      )
    );
  };

  const renderBlock = (block: Block) => {
    const isActive = block.id === activeBlockId;
    const style = block.style || {};
    
    const blockStyle = {
      fontWeight: style.bold ? 'bold' : 'normal',
      fontStyle: style.italic ? 'italic' : 'normal',
      textDecoration: [
        style.underline && 'underline',
        style.strikethrough && 'line-through'
      ].filter(Boolean).join(' ') || 'none',
      color: style.color || 'inherit',
      backgroundColor: style.backgroundColor || 'transparent',
      textAlign: style.align || 'left' as const
    };

    switch (block.type) {
      case 'heading1':
        return (
          <div key={block.id} className="relative group">
            <h1
              data-block-id={block.id}
              ref={isActive ? activeBlockRef : null}
              className={`text-3xl font-bold py-2 outline-none ${isActive ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}`}
              style={blockStyle}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => handleContentChange(block.id, e.currentTarget.textContent || '')}
              onFocus={() => setActiveBlockId(block.id)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
            <button
              onClick={() => deleteBlock(block.id)}
              className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'heading2':
        return (
          <div key={block.id} className="relative group">
            <h2
              data-block-id={block.id}
              ref={isActive ? activeBlockRef : null}
              className={`text-2xl font-semibold py-2 outline-none ${isActive ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}`}
              style={blockStyle}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => handleContentChange(block.id, e.currentTarget.textContent || '')}
              onFocus={() => setActiveBlockId(block.id)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
            <button
              onClick={() => deleteBlock(block.id)}
              className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'heading3':
        return (
          <div key={block.id} className="relative group">
            <h3
              data-block-id={block.id}
              ref={isActive ? activeBlockRef : null}
              className={`text-xl font-medium py-2 outline-none ${isActive ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}`}
              style={blockStyle}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => handleContentChange(block.id, e.currentTarget.textContent || '')}
              onFocus={() => setActiveBlockId(block.id)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
            <button
              onClick={() => deleteBlock(block.id)}
              className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'calendar':
        return (
          <div key={block.id} className="relative group my-4">
            <div className="border rounded-lg overflow-hidden">
              <CalendarView
                selectedDate={block.data?.selectedDate || new Date()}
                events={events}
                onDateSelect={(date) => handleDateSelect(block.id, date)}
                onEventCreate={handleEventCreate}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
              />
            </div>
            <button
              onClick={() => deleteBlock(block.id)}
              className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'bullet':
        return (
          <div key={block.id} className="relative group">
            <div className="flex items-start">
              <span className="mr-2 mt-2">•</span>
              <div
                data-block-id={block.id}
                ref={isActive ? activeBlockRef : null}
                className={`flex-1 py-1 outline-none ${isActive ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}`}
                style={blockStyle}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => handleContentChange(block.id, e.currentTarget.textContent || '')}
                onFocus={() => setActiveBlockId(block.id)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
            <button
              onClick={() => deleteBlock(block.id)}
              className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'numbered':
        const blockIndex = blocks.filter(b => b.type === 'numbered').indexOf(block) + 1;
        return (
          <div key={block.id} className="relative group">
            <div className="flex items-start">
              <span className="mr-2 mt-1">{blockIndex}.</span>
              <div
                data-block-id={block.id}
                ref={isActive ? activeBlockRef : null}
                className={`flex-1 py-1 outline-none ${isActive ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}`}
                style={blockStyle}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => handleContentChange(block.id, e.currentTarget.textContent || '')}
                onFocus={() => setActiveBlockId(block.id)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
            <button
              onClick={() => deleteBlock(block.id)}
              className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'quote':
        return (
          <div key={block.id} className="relative group">
            <div className="border-l-4 border-gray-300 pl-4">
              <div
                data-block-id={block.id}
                ref={isActive ? activeBlockRef : null}
                className={`py-2 italic text-gray-600 outline-none ${isActive ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}`}
                style={blockStyle}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => handleContentChange(block.id, e.currentTarget.textContent || '')}
                onFocus={() => setActiveBlockId(block.id)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
            <button
              onClick={() => deleteBlock(block.id)}
              className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'code':
        return (
          <div key={block.id} className="relative group">
            <pre className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
              <code
                data-block-id={block.id}
                ref={isActive ? activeBlockRef : null}
                className={`outline-none ${isActive ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}`}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => handleContentChange(block.id, e.currentTarget.textContent || '')}
                onFocus={() => setActiveBlockId(block.id)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </pre>
            <button
              onClick={() => deleteBlock(block.id)}
              className="absolute -left-8 top-4 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'todo':
        return (
          <div key={block.id} className="relative group">
            <div className="flex items-start">
              <input
                type="checkbox"
                className="mr-2 mt-2"
                onChange={(e) => {
                  setBlocks(prevBlocks =>
                    prevBlocks.map(b =>
                      b.id === block.id
                        ? { ...b, data: { ...b.data, checked: e.target.checked } }
                        : b
                    )
                  );
                }}
                checked={block.data?.checked || false}
              />
              <div
                data-block-id={block.id}
                ref={isActive ? activeBlockRef : null}
                className={`flex-1 py-1 outline-none ${isActive ? 'ring-2 ring-blue-500 ring-opacity-20' : ''} ${block.data?.checked ? 'line-through text-gray-500' : ''}`}
                style={blockStyle}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => handleContentChange(block.id, e.currentTarget.textContent || '')}
                onFocus={() => setActiveBlockId(block.id)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
            <button
              onClick={() => deleteBlock(block.id)}
              className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      default:
        return (
          <div key={block.id} className="relative group">
            <div
              data-block-id={block.id}
              ref={isActive ? activeBlockRef : null}
              className={`py-2 outline-none min-h-[1.5rem] ${isActive ? 'ring-2 ring-blue-500 ring-opacity-20' : ''} ${block.content === '' ? 'text-gray-400' : ''}`}
              style={blockStyle}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => handleContentChange(block.id, e.currentTarget.textContent || '')}
              onFocus={() => setActiveBlockId(block.id)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              dangerouslySetInnerHTML={{ __html: block.content || "Type '/' for commands" }}
            />
            <button
              onClick={() => deleteBlock(block.id)}
              className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
    }
  };

  const slashMenuItems = [
    { icon: Type, label: 'Text', action: () => addBlock('text') },
    { icon: Heading1, label: 'Heading 1', action: () => addBlock('heading1') },
    { icon: Heading2, label: 'Heading 2', action: () => addBlock('heading2') },
    { icon: Heading3, label: 'Heading 3', action: () => addBlock('heading3') },
    { icon: List, label: 'Bullet List', action: () => addBlock('bullet') },
    { icon: ListOrdered, label: 'Numbered List', action: () => addBlock('numbered') },
    { icon: Quote, label: 'Quote', action: () => addBlock('quote') },
    { icon: Code, label: 'Code', action: () => addBlock('code') },
    { icon: CheckSquare, label: 'To-do', action: () => addBlock('todo') },
    { icon: Calendar, label: 'Calendar', action: () => addBlock('calendar') },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8 min-h-screen bg-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Untitled</h1>
        <p className="text-gray-600">Start writing...</p>
      </div>

      {/* Floating Toolbar */}
      {showToolbar && (
        <div className="fixed bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <button onClick={() => formatText('bold')} className="p-1 hover:bg-gray-700 rounded">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => formatText('italic')} className="p-1 hover:bg-gray-700 rounded">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => formatText('underline')} className="p-1 hover:bg-gray-700 rounded">
            <Underline className="w-4 h-4" />
          </button>
          <button onClick={() => formatText('strikethrough')} className="p-1 hover:bg-gray-700 rounded">
            <Strikethrough className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-600"></div>
          <button className="p-1 hover:bg-gray-700 rounded">
            <Link className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Slash Menu */}
      {showSlashMenu && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2 w-64"
          style={{ left: slashMenuPosition.x, top: slashMenuPosition.y }}
        >
          {slashMenuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
            >
              <item.icon className="w-4 h-4 text-gray-500" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Editor Content */}
      <div ref={editorRef} className="space-y-1">
        {blocks.map(renderBlock)}
      </div>

      {/* Click outside to close slash menu */}
      {showSlashMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSlashMenu(false)}
        />
      )}
    </div>
  );
};

export default NotionEditor;
