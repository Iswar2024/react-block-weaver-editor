import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Code,
  Quote,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Link,
  Plus,
  Grip,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  UploadCloud,
  X,
  Trash2,
  Check,
  Minus,
  Hash,
  Strikethrough,
  MoreHorizontal,
  ChevronDown,
  Table,
  BarChart3,
  PieChart,
  Calendar as CalendarIcon,
  FileText,
  Video,
  Music,
  Bookmark,
  MapPin,
  Clock,
  ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

// Block Interface
interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'quote' | 'code' | 'list' | 'numbered-list' | 'todo' | 'toggle' | 'image' | 'divider' | 'callout' | 'table' | 'chart-bar' | 'chart-pie' | 'calendar' | 'file' | 'video' | 'audio' | 'bookmark';
  content: string;
  alignment?: 'left' | 'center' | 'right';
  checked?: boolean;
  collapsed?: boolean;
  children?: Block[];
  color?: string;
  backgroundColor?: string;
  tableData?: { headers: string[]; rows: string[][] };
  chartData?: { labels: string[]; values: number[] };
  toggleTitle?: string;
  toggleContent?: string;
  selectedDate?: Date;
}

const NotionEditor = () => {
  const [content, setContent] = useState<Block[]>([
    { id: 'block-1', type: 'paragraph', content: 'Welcome to your editor! Type `/` for commands.', alignment: 'left' }
  ]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState<{ blockId: string; position: { x: number; y: number } } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState<string | null>(null);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [formatMenuPosition, setFormatMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [showTypeMenu, setShowTypeMenu] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const formatMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Mock media library
  const mockMediaLibrary = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80',
    'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80'
  ];

  // Block type definitions with new options
  const blockTypes = [
    { type: 'paragraph', label: 'Text', icon: Type, description: 'Just start writing with plain text.' },
    { type: 'heading1', label: 'Heading 1', icon: Heading1, description: 'Big section heading.' },
    { type: 'heading2', label: 'Heading 2', icon: Heading2, description: 'Medium section heading.' },
    { type: 'heading3', label: 'Heading 3', icon: Heading3, description: 'Small section heading.' },
    { type: 'list', label: 'Bulleted list', icon: List, description: 'Create a simple bulleted list.' },
    { type: 'numbered-list', label: 'Numbered list', icon: ListOrdered, description: 'Create a list with numbering.' },
    { type: 'todo', label: 'To-do list', icon: Check, description: 'Track tasks with a to-do list.' },
    { type: 'toggle', label: 'Toggle list', icon: MoreHorizontal, description: 'Toggles can hide and show content inside.' },
    { type: 'code', label: 'Code', icon: Code, description: 'Capture a code snippet.' },
    { type: 'quote', label: 'Quote', icon: Quote, description: 'Capture a quote.' },
    { type: 'divider', label: 'Divider', icon: Minus, description: 'Visually divide blocks.' },
    { type: 'callout', label: 'Callout', icon: Hash, description: 'Make writing stand out.' },
    { type: 'image', label: 'Image', icon: Image, description: 'Upload or embed with a link.' },
    { type: 'table', label: 'Table', icon: Table, description: 'Create a table with data.' },
    { type: 'chart-bar', label: 'Bar Chart', icon: BarChart3, description: 'Display data as bar chart.' },
    { type: 'chart-pie', label: 'Pie Chart', icon: PieChart, description: 'Display data as pie chart.' },
    { type: 'calendar', label: 'Calendar', icon: CalendarIcon, description: 'Add a calendar view.' },
    { type: 'file', label: 'File', icon: FileText, description: 'Upload and embed files.' },
    { type: 'video', label: 'Video', icon: Video, description: 'Embed video content.' },
    { type: 'audio', label: 'Audio', icon: Music, description: 'Embed audio content.' },
    { type: 'bookmark', label: 'Bookmark', icon: Bookmark, description: 'Save a link with preview.' },
  ];

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowBlockMenu(null);
      }
      if (slashMenuRef.current && !slashMenuRef.current.contains(event.target as Node)) {
        setShowSlashMenu(null);
      }
      if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) {
        setShowFormatMenu(false);
      }
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Block manipulation functions
  const addBlock = useCallback((type: string, afterId?: string) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: type as Block['type'],
      content: '',
      alignment: 'left',
      checked: type === 'todo' ? false : undefined,
      collapsed: type === 'toggle' ? false : undefined,
      children: type === 'toggle' ? [] : undefined,
      tableData: type === 'table' ? { headers: ['Column 1', 'Column 2'], rows: [['', ''], ['', '']] } : undefined,
      chartData: (type === 'chart-bar' || type === 'chart-pie') ? { labels: ['A', 'B', 'C'], values: [10, 20, 30] } : undefined,
      toggleTitle: type === 'toggle' ? '' : undefined,
      toggleContent: type === 'toggle' ? '' : undefined,
      selectedDate: type === 'calendar' ? new Date() : undefined
    };

    setContent(currentContent => {
        if (afterId) {
            const index = currentContent.findIndex(block => block.id === afterId);
            const newContent = [...currentContent];
            newContent.splice(index + 1, 0, newBlock);
            return newContent;
        }
        return [...currentContent, newBlock];
    });

    setShowBlockMenu(null);
    setShowSlashMenu(null);
    
    // Focus the new block after it's created
    setTimeout(() => {
      const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"] [contenteditable="true"]`);
      if (newBlockElement) {
        (newBlockElement as HTMLElement).focus();
      }
    }, 0);
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setContent(currentContent =>
      currentContent.map(block =>
        block.id === id ? { ...block, ...updates } : block
      )
    );
  }, []);

  const changeBlockType = useCallback((id: string, newType: Block['type']) => {
    const block = content.find(b => b.id === id);
    if (!block) return;

    const updates: Partial<Block> = {
      type: newType,
      checked: newType === 'todo' ? false : undefined,
      collapsed: newType === 'toggle' ? false : undefined,
      children: newType === 'toggle' ? [] : undefined,
      tableData: newType === 'table' ? { headers: ['Column 1', 'Column 2'], rows: [['', ''], ['', '']] } : undefined,
      chartData: (newType === 'chart-bar' || newType === 'chart-pie') ? { labels: ['A', 'B', 'C'], values: [10, 20, 30] } : undefined,
      toggleTitle: newType === 'toggle' ? block.content : undefined,
      toggleContent: newType === 'toggle' ? '' : undefined
    };

    // Preserve content for compatible types
    if (newType !== 'toggle') {
      updates.content = block.content;
    } else {
      updates.content = '';
    }

    updateBlock(id, updates);
    setShowTypeMenu(null);
  }, [content, updateBlock]);

  // Handle slash command
  const handleSlashCommand = useCallback((e: React.KeyboardEvent, blockId: string) => {
    const block = content.find(b => b.id === blockId);
    if (!block) return;

    if (e.key === '/') {
        if (block.content === '' || block.content === '/') {
            e.preventDefault();
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            setShowSlashMenu({
                blockId,
                position: { x: rect.left, y: rect.bottom }
            });
        }
    } else if (e.key === 'Escape') {
      setShowSlashMenu(null);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Handle Enter key based on block type
      if (block.type === 'list' || block.type === 'numbered-list') {
        // For list items, create a new list item of the same type
        if (block.content.trim() === '') {
          // If current list item is empty, convert to paragraph
          e.preventDefault();
          updateBlock(blockId, { type: 'paragraph' });
        } else {
          // Create new list item
          e.preventDefault();
          addBlock(block.type, blockId);
        }
      } else if (block.content.trim() === '') {
        // Only create new block if the current block is empty
        e.preventDefault();
        addBlock('paragraph', blockId);
      }
      // For blocks with content (non-list types), let the default behavior create a new line
    }
  }, [content, addBlock, updateBlock]);

  // Handle text selection for formatting
  const handleTextSelection = (event: React.MouseEvent, blockId: string) => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setShowFormatMenu(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width > 0) {
        setSelectedBlockId(blockId);
        
        setFormatMenuPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        setShowFormatMenu(true);
      } else {
        setShowFormatMenu(false);
      }
    }, 10);
  };

  // Apply formatting to selected text
  const applyFormatting = (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link') => {
    if (!selectedBlockId) return;
    
    document.execCommand(format === 'link' ? 'createLink' : format, false, format === 'link' ? prompt('Enter URL:', 'https://') || undefined : undefined);
    
    const blockElement = document.querySelector(`[data-block-id="${selectedBlockId}"] [contenteditable="true"]`);
    if(blockElement){
        updateBlock(selectedBlockId, { content: blockElement.innerHTML });
    }

    setShowFormatMenu(false);
  };

  const deleteBlock = (id: string) => {
    if (content.length > 1) {
      setContent(content.filter(block => block.id !== id));
    }
    setShowBlockMenu(null);
  };

  const toggleTodo = (id: string) => {
    const block = content.find(b => b.id === id);
    if (block) {
      updateBlock(id, { checked: !block.checked });
    }
  };

  const toggleCollapse = (id: string) => {
    const block = content.find(b => b.id === id);
    if (block) {
      updateBlock(id, { collapsed: !block.collapsed });
    }
  };

  // Drag and drop
  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    let _content = [...content];
    const draggedItem = _content.splice(dragItem.current, 1)[0];
    _content.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null;
    dragOverItem.current = null;
    setContent(_content);
  };

  // Image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && isImageModalOpen) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBlock(isImageModalOpen, { content: reader.result as string });
        setIsImageModalOpen(null);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleEmbedImage = () => {
      if(isImageModalOpen && imageUrl) {
          updateBlock(isImageModalOpen, { content: imageUrl});
          setIsImageModalOpen(null);
          setImageUrl('');
      }
  }

  const handleSelectFromLibrary = (url: string) => {
    if (isImageModalOpen) {
      updateBlock(isImageModalOpen, { content: url });
      setIsImageModalOpen(null);
    }
  };

  // Chart data management functions
  const addChartDataPoint = (blockId: string) => {
    const block = content.find(b => b.id === blockId);
    if (block && block.chartData) {
      const newChartData = {
        labels: [...block.chartData.labels, `Item ${block.chartData.labels.length + 1}`],
        values: [...block.chartData.values, 0]
      };
      updateBlock(blockId, { chartData: newChartData });
    }
  };

  const removeChartDataPoint = (blockId: string, index: number) => {
    const block = content.find(b => b.id === blockId);
    if (block && block.chartData && block.chartData.labels.length > 1) {
      const newChartData = {
        labels: block.chartData.labels.filter((_, i) => i !== index),
        values: block.chartData.values.filter((_, i) => i !== index)
      };
      updateBlock(blockId, { chartData: newChartData });
    }
  };

  // Table management functions
  const addTableRow = (blockId: string) => {
    const block = content.find(b => b.id === blockId);
    if (block && block.tableData) {
      const newRow = new Array(block.tableData.headers.length).fill('');
      const newTableData = {
        ...block.tableData,
        rows: [...block.tableData.rows, newRow]
      };
      updateBlock(blockId, { tableData: newTableData });
    }
  };

  const addTableColumn = (blockId: string) => {
    const block = content.find(b => b.id === blockId);
    if (block && block.tableData) {
      const newHeaders = [...block.tableData.headers, `Column ${block.tableData.headers.length + 1}`];
      const newRows = block.tableData.rows.map(row => [...row, '']);
      const newTableData = {
        headers: newHeaders,
        rows: newRows
      };
      updateBlock(blockId, { tableData: newTableData });
    }
  };

  const removeTableRow = (blockId: string, rowIndex: number) => {
    const block = content.find(b => b.id === blockId);
    if (block && block.tableData && block.tableData.rows.length > 1) {
      const newRows = block.tableData.rows.filter((_, index) => index !== rowIndex);
      const newTableData = {
        ...block.tableData,
        rows: newRows
      };
      updateBlock(blockId, { tableData: newTableData });
    }
  };

  const removeTableColumn = (blockId: string, colIndex: number) => {
    const block = content.find(b => b.id === blockId);
    if (block && block.tableData && block.tableData.headers.length > 1) {
      const newHeaders = block.tableData.headers.filter((_, index) => index !== colIndex);
      const newRows = block.tableData.rows.map(row => row.filter((_, index) => index !== colIndex));
      const newTableData = {
        headers: newHeaders,
        rows: newRows
      };
      updateBlock(blockId, { tableData: newTableData });
    }
  };

  // Block styling
  const getBlockClassName = (block: Block) => {
    const baseClasses = "w-full border-none outline-none bg-transparent resize-none overflow-hidden focus:outline-none";
    const alignmentClasses = { left: 'text-left', center: 'text-center', right: 'text-right' };

    const typeClasses: Record<Block['type'], string> = {
      paragraph: 'text-gray-800 dark:text-gray-200 leading-relaxed min-h-[1.5rem] text-base',
      heading1: 'text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight min-h-[2.5rem]',
      heading2: 'text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight min-h-[2rem]',
      heading3: 'text-xl font-medium text-gray-900 dark:text-gray-100 leading-tight min-h-[1.75rem]',
      quote: 'text-gray-700 dark:text-gray-300 italic text-lg leading-relaxed border-l-4 border-gray-300 dark:border-gray-600 pl-4 min-h-[1.5rem]',
      code: 'font-mono bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md p-4 text-sm whitespace-pre-wrap min-h-[3rem]',
      list: 'text-gray-800 dark:text-gray-200 leading-relaxed min-h-[1.5rem]',
      'numbered-list': 'text-gray-800 dark:text-gray-200 leading-relaxed min-h-[1.5rem]',
      todo: 'text-gray-800 dark:text-gray-200 leading-relaxed min-h-[1.5rem]',
      toggle: 'text-gray-800 dark:text-gray-200 leading-relaxed min-h-[1.5rem]',
      callout: 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-900/50 rounded-md p-4 flex items-start gap-3',
      divider: '',
      image: 'w-full h-auto',
      table: 'w-full',
      'chart-bar': 'w-full h-64 bg-gray-50 dark:bg-gray-800 rounded-lg',
      'chart-pie': 'w-full h-64 bg-gray-50 dark:bg-gray-800 rounded-lg',
      calendar: 'w-full h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center',
      file: 'w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg',
      video: 'w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center',
      audio: 'w-full h-16 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center',
      bookmark: 'w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg'
    };

    return `${baseClasses} ${alignmentClasses[block.alignment || 'left']} ${typeClasses[block.type]}`;
  };

  const getBlockTypeIcon = (type: Block['type']) => {
    const blockType = blockTypes.find(bt => bt.type === type);
    return blockType ? blockType.icon : Type;
  };

  const getPlaceholderText = (block: Block) => {
    if (block.content) return '';
    
    switch (block.type) {
      case 'paragraph': return "Type '/' for commands";
      case 'heading1': return 'Heading 1';
      case 'heading2': return 'Heading 2';
      case 'heading3': return 'Heading 3';
      case 'quote': return 'Quote';
      case 'code': return 'Type your code...';
      case 'list': return 'List item';
      case 'numbered-list': return 'Numbered list item';
      case 'todo': return 'To-do';
      case 'toggle': return 'Toggle title';
      case 'callout': return 'Type your callout...';
      default: return `Type your ${block.type}...`;
    }
  };

  const renderSpecialBlock = (block: Block) => {
    switch (block.type) {
      case 'table':
        return (
          <div className="w-full overflow-x-auto">
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => addTableRow(block.id)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
              >
                Add Row
              </button>
              <button
                onClick={() => addTableColumn(block.id)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
              >
                Add Column
              </button>
            </div>
            <table className="min-w-full border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {block.tableData?.headers.map((header, index) => (
                    <th key={index} className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-left font-medium relative group">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => {
                          const newTableData = { ...block.tableData! };
                          newTableData.headers[index] = e.target.value;
                          updateBlock(block.id, { tableData: newTableData });
                        }}
                        className="w-full bg-transparent border-none outline-none"
                        placeholder={`Header ${index + 1}`}
                      />
                      {block.tableData!.headers.length > 1 && (
                        <button
                          onClick={() => removeTableColumn(block.id, index)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 rounded p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.tableData?.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="group">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 relative">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => {
                            const newTableData = { ...block.tableData! };
                            newTableData.rows[rowIndex][cellIndex] = e.target.value;
                            updateBlock(block.id, { tableData: newTableData });
                          }}
                          className="w-full bg-transparent border-none outline-none"
                          placeholder="Enter data"
                        />
                        {cellIndex === 0 && block.tableData!.rows.length > 1 && (
                          <button
                            onClick={() => removeTableRow(block.id, rowIndex)}
                            className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 rounded p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'chart-bar':
        const barData = block.chartData?.labels.map((label, index) => ({
          name: label,
          value: block.chartData?.values[index] || 0
        })) || [];
        
        return (
          <div className={getBlockClassName(block)}>
            <div className="p-4">
              <h4 className="text-sm font-medium mb-4">Bar Chart</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => addChartDataPoint(block.id)}
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded"
                  >
                    Add Data Point
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Edit chart data:</p>
                  {block.chartData?.labels.map((label, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => {
                          const newChartData = { ...block.chartData! };
                          newChartData.labels[index] = e.target.value;
                          updateBlock(block.id, { chartData: newChartData });
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Label"
                      />
                      <input
                        type="number"
                        value={block.chartData?.values[index] || 0}
                        onChange={(e) => {
                          const newChartData = { ...block.chartData! };
                          newChartData.values[index] = Number(e.target.value);
                          updateBlock(block.id, { chartData: newChartData });
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Value"
                      />
                      {block.chartData!.labels.length > 1 && (
                        <button
                          onClick={() => removeChartDataPoint(block.id, index)}
                          className="text-red-500 hover:bg-red-100 rounded p-1"
                          title="Remove data point"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'chart-pie':
        const pieData = block.chartData?.labels.map((label, index) => ({
          name: label,
          value: block.chartData?.values[index] || 0
        })) || [];
        
        const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
        
        return (
          <div className={getBlockClassName(block)}>
            <div className="p-4">
              <h4 className="text-sm font-medium mb-4">Pie Chart</h4>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => addChartDataPoint(block.id)}
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded"
                  >
                    Add Data Point
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Edit chart data:</p>
                  {block.chartData?.labels.map((label, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => {
                          const newChartData = { ...block.chartData! };
                          newChartData.labels[index] = e.target.value;
                          updateBlock(block.id, { chartData: newChartData });
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Label"
                      />
                      <input
                        type="number"
                        value={block.chartData?.values[index] || 0}
                        onChange={(e) => {
                          const newChartData = { ...block.chartData! };
                          newChartData.values[index] = Number(e.target.value);
                          updateBlock(block.id, { chartData: newChartData });
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Value"
                      />
                      {block.chartData!.labels.length > 1 && (
                        <button
                          onClick={() => removeChartDataPoint(block.id, index)}
                          className="text-red-500 hover:bg-red-100 rounded p-1"
                          title="Remove data point"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'calendar':
        return (
          <div className={getBlockClassName(block)}>
            <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Calendar</h4>
                {block.selectedDate && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Selected: {format(block.selectedDate, 'PPP')}
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={block.selectedDate}
                  onSelect={(date) => updateBlock(block.id, { selectedDate: date })}
                  className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
              {block.selectedDate && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    📅 {format(block.selectedDate, 'EEEE, MMMM do, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'file':
        return (
          <div className={getBlockClassName(block)}>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">File Attachment</p>
                <p className="text-xs text-gray-500">Click to upload file</p>
              </div>
            </div>
          </div>
        );
      
      case 'video':
        return (
          <div className={getBlockClassName(block)}>
            <Video className="w-16 h-16 text-gray-400 mx-auto" />
            <p className="text-gray-500 mt-2">Video Content</p>
            <p className="text-xs text-gray-400">Video embedding coming soon</p>
          </div>
        );
      
      case 'audio':
        return (
          <div className={getBlockClassName(block)}>
            <Music className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-gray-500">Audio Player</p>
          </div>
        );
      
      case 'bookmark':
        return (
          <div className={getBlockClassName(block)}>
            <div className="flex items-center gap-3">
              <Bookmark className="w-6 h-6 text-gray-400" />
              <div className="flex-1">
                <input
                  type="url"
                  placeholder="Paste a link to create a bookmark"
                  className="w-full bg-transparent border-none outline-none text-sm"
                  onBlur={(e) => updateBlock(block.id, { content: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderBlock = (block: Block, index: number) => {
    const isSelected = selectedBlock === block.id;
    const BlockIcon = getBlockTypeIcon(block.type);
    const placeholderText = getPlaceholderText(block);

    return (
      <div key={block.id} className="group" data-block-id={block.id}>
        <div
          draggable={block.type !== 'divider'}
          onDragStart={() => (dragItem.current = index)}
          onDragEnter={() => (dragOverItem.current = index)}
          onDragEnd={handleDragSort}
          onDragOver={(e) => e.preventDefault()}
          className="flex items-start gap-2 py-1"
          onMouseEnter={() => setSelectedBlock(block.id)}
          onMouseLeave={() => setSelectedBlock(null)}
        >
          {/* Drag handle and block controls */}
          <div className={`flex items-center transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {block.type !== 'divider' && (
              <>
                <button
                  className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-grab active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <Grip className="w-4 h-4" />
                </button>
                <div className="relative" ref={typeMenuRef}>
                  <button
                    onClick={() => setShowTypeMenu(showTypeMenu === block.id ? null : block.id)}
                    className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-1"
                    title="Change block type"
                  >
                    <BlockIcon className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showTypeMenu === block.id && (
                    <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-2 w-64 max-h-80 overflow-y-auto">
                      <p className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Turn into</p>
                      {blockTypes.map(({ type, label, icon: Icon }) => (
                        <button
                          key={type}
                          onClick={() => changeBlockType(block.id, type as Block['type'])}
                          className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            block.type === type ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}
                    className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    title="Block options"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {showBlockMenu === block.id && (
                    <div className="absolute left-full top-0 ml-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-2 w-64">
                      <p className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Add block below</p>
                      <div className="max-h-64 overflow-y-auto">
                        {blockTypes.map(({ type, label, icon: Icon, description }) => (
                          <button
                            key={type}
                            onClick={() => addBlock(type, block.id)}
                            className="w-full flex items-start space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
                              <div className="text-xs text-gray-500">{description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Direct delete button */}
                {content.length > 1 && (
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Delete block"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Block content */}
          <div className="flex-1 flex items-start gap-2">
            {/* Special prefixes for different block types */}
            {block.type === 'list' && (
              <span className="text-gray-500 dark:text-gray-400 mt-1 select-none">•</span>
            )}
            {block.type === 'numbered-list' && (
              <span className="text-gray-500 dark:text-gray-400 mt-1 select-none min-w-[1.5rem]">{content.filter(b => b.type === 'numbered-list').findIndex(b => b.id === block.id) + 1}.</span>
            )}
            {block.type === 'todo' && (
              <button
                onClick={() => toggleTodo(block.id)}
                className="mt-1 flex-shrink-0"
              >
                <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${
                  block.checked
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}>
                  {block.checked && <Check className="w-3 h-3" />}
                </div>
              </button>
            )}
            {block.type === 'toggle' && (
              <button
                onClick={() => toggleCollapse(block.id)}
                className="mt-1 flex-shrink-0 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${block.collapsed ? '' : 'rotate-90'}`} />
              </button>
            )}
            

            {/* Block content rendering */}
            {block.type === 'divider' ? (
              <div className="w-full border-t border-gray-300 dark:border-gray-600 my-4" />
            ) : block.type === 'image' ? (
              block.content ? (
                <img
                  src={block.content}
                  alt="Uploaded content"
                  className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setIsImageModalOpen(block.id)}
                />
              ) : (
                <div
                  onClick={() => setIsImageModalOpen(block.id)}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <Image className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to add an image</p>
                  <p className="text-xs text-gray-500">Upload or select from library</p>
                </div>
              )
            ) : block.type === 'callout' ? (
                 <div className={getBlockClassName(block)}>
                    <span className="text-yellow-500 mt-1 flex-shrink-0 text-lg">💡</span>
                    <div className="flex-1 relative">
                      <div
                          contentEditable
                          suppressContentEditableWarning
                          className="w-full focus:outline-none bg-transparent"
                          onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.innerHTML || '' })}
                          onMouseUp={(e) => handleTextSelection(e, block.id)}
                          dangerouslySetInnerHTML={{ __html: block.content }}
                       />
                       {!block.content && (
                         <div className="absolute inset-0 pointer-events-none text-gray-400 dark:text-gray-500">
                           {getPlaceholderText(block)}
                         </div>
                       )}
                     </div>
                 </div>
            ) : block.type === 'toggle' ? (
              <div className="flex-1">
                <div className="relative">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className={getBlockClassName(block)}
                    onBlur={(e) => updateBlock(block.id, { toggleTitle: e.currentTarget.innerHTML || '' })}
                    onKeyDown={(e) => handleSlashCommand(e, block.id)}
                    onMouseUp={(e) => handleTextSelection(e, block.id)}
                    dangerouslySetInnerHTML={{ __html: block.toggleTitle || '' }}
                  />
                  {!block.toggleTitle && (
                    <div className="absolute inset-0 pointer-events-none text-gray-400 dark:text-gray-500">
                      Type content here...
                    </div>
                  )}
                </div>
                {!block.collapsed && (
                  <div className="ml-6 mt-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    <div className="relative">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="w-full border-none outline-none bg-transparent resize-none overflow-hidden focus:outline-none text-gray-800 dark:text-gray-200 leading-relaxed min-h-[1.5rem] text-base"
                        onBlur={(e) => updateBlock(block.id, { toggleContent: e.currentTarget.innerHTML || '' })}
                        onMouseUp={(e) => handleTextSelection(e, block.id)}
                        dangerouslySetInnerHTML={{ __html: block.toggleContent || '' }}
                      />
                      {!block.toggleContent && (
                        <div className="absolute inset-0 pointer-events-none text-gray-400 dark:text-gray-500">
                          Type content here...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : ['table', 'chart-bar', 'chart-pie', 'calendar', 'file', 'video', 'audio', 'bookmark'].includes(block.type) ? (
              renderSpecialBlock(block)
            ) : (
              <div className="flex-1 relative">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className={getBlockClassName(block)}
                  onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.innerHTML || '' })}
                  onKeyDown={(e) => handleSlashCommand(e, block.id)}
                  onMouseUp={(e) => handleTextSelection(e, block.id)}
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
                {!block.content && (
                  <div className="absolute inset-0 pointer-events-none text-gray-400 dark:text-gray-500">
                    {getPlaceholderText(block)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alignment controls */}
          {!['image', 'divider', 'callout', 'table', 'chart-bar', 'chart-pie', 'calendar', 'file', 'video', 'audio', 'bookmark', 'toggle'].includes(block.type) && (
            <div className={`flex items-center space-x-1 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <button
                onClick={() => updateBlock(block.id, { alignment: 'left' })}
                className={`p-1 rounded ${block.alignment === 'left' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Align left"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateBlock(block.id, { alignment: 'center' })}
                className={`p-1 rounded ${block.alignment === 'center' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Align center"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateBlock(block.id, { alignment: 'right' })}
                className={`p-1 rounded ${block.alignment === 'right' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Align right"
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-sans">
      {/* Text formatting menu */}
      {showFormatMenu && (
        <div
          ref={formatMenuRef}
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 px-1 flex items-center gap-1"
          style={{
            left: `${formatMenuPosition.x}px`,
            top: `${formatMenuPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
            <button onClick={() => applyFormatting('bold')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Bold"><Bold size={14} /></button>
            <button onClick={() => applyFormatting('italic')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Italic"><Italic size={14} /></button>
            <button onClick={() => applyFormatting('underline')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Underline"><Underline size={14} /></button>
            <button onClick={() => applyFormatting('strikethrough')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Strikethrough"><Strikethrough size={14} /></button>
            <button onClick={() => document.execCommand('insertHTML', false, '<code>&nbsp;</code>')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Code"><Code size={14} /></button>
            <button onClick={() => applyFormatting('link')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Link"><Link size={14} /></button>
        </div>
      )}

      {/* Slash command menu */}
      {showSlashMenu && (
        <div
          ref={slashMenuRef}
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 w-80 max-h-96 overflow-y-auto"
          style={{
            left: `${showSlashMenu.position.x}px`,
            top: `${showSlashMenu.position.y}px`
          }}
        >
          <p className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Basic blocks</p>
          <div>
            {blockTypes.map(({ type, label, icon: Icon, description }) => (
              <button
                key={type}
                onClick={() => addBlock(type, showSlashMenu.blockId)}
                className="w-full flex items-start space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Image</h3>
              <button
                onClick={() => setIsImageModalOpen(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Upload section */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload a file
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                <p className="text-xs text-gray-500 mt-2">Maximum file size: 5MB</p>
              </div>

              {/* Embed link section */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Embed from URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://unsplash.com/..." 
                    className="flex-grow bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleEmbedImage}
                    className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Embed
                  </button>
                </div>
              </div>
              
              {/* Media Library */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Or select from library</h4>
                <div className="grid grid-cols-3 gap-4 max-h-48 overflow-y-auto p-1">
                  {mockMediaLibrary.map(url => (
                    <img 
                      key={url}
                      src={url}
                      alt="library media"
                      className="w-full h-24 object-cover rounded-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                      onClick={() => handleSelectFromLibrary(url)}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Main Editor Body */}
      <main className="max-w-4xl mx-auto p-4 sm:p-8 lg:p-12">
        <div className="space-y-1">
            {content.map((block, index) => renderBlock(block, index))}
        </div>
      </main>
    </div>
  );
};

export default NotionEditor;
