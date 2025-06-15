import React, { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
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
  ChevronRight,
  Palette,
  Play,
  Pause,
  Download,
  FileAudio,
  FileVideo
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import CalendarView, { CalendarEvent } from './CalendarView';

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
  calendarEvents?: CalendarEvent[];
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}

interface NotionEditorProps {
  initialContent?: Block[];
  onChange?: (content: Block[]) => void;
  readOnly?: boolean;
  className?: string;
}

const NotionEditorFormIntegrated: React.FC<NotionEditorProps> = ({
  initialContent,
  onChange,
  readOnly = false,
  className = ''
}) => {
  const [content, setContent] = useState<Block[]>(
    initialContent || [
      { id: 'block-1', type: 'paragraph', content: 'Start writing...', alignment: 'left' }
    ]
  );

  // Notify parent component when content changes
  useEffect(() => {
    if (onChange) {
      onChange(content);
    }
  }, [content, onChange]);

  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState<{ blockId: string; position: { x: number; y: number } } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState<string | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState<string | null>(null);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [formatMenuPosition, setFormatMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [showTypeMenu, setShowTypeMenu] = useState<string | null>(null);
  const [showColorPalette, setShowColorPalette] = useState<'text' | 'background' | null>(null);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});

  const menuRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const formatMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const mockMediaLibrary = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80',
    'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80'
  ];

  const colorPalette = [
    { name: 'Default', text: '#000000', bg: 'transparent' },
    { name: 'Gray', text: '#6B7280', bg: '#F3F4F6' },
    { name: 'Brown', text: '#92400E', bg: '#FEF3C7' },
    { name: 'Orange', text: '#EA580C', bg: '#FED7AA' },
    { name: 'Yellow', text: '#D97706', bg: '#FEF3C7' },
    { name: 'Green', text: '#16A34A', bg: '#DCFCE7' },
    { name: 'Blue', text: '#2563EB', bg: '#DBEAFE' },
    { name: 'Purple', text: '#9333EA', bg: '#E9D5FF' },
    { name: 'Pink', text: '#DB2777', bg: '#FCE7F3' },
    { name: 'Red', text: '#DC2626', bg: '#FEE2E2' },
    { name: 'Teal', text: '#0D9488', bg: '#CCFBF1' },
    { name: 'Indigo', text: '#4338CA', bg: '#E0E7FF' }
  ];

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

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setContent(currentContent =>
      currentContent.map(block =>
        block.id === id ? { ...block, ...updates } : block
      )
    );
  }, []);

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
      selectedDate: type === 'calendar' ? new Date() : undefined,
      calendarEvents: type === 'calendar' ? [] : undefined
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
    
    setTimeout(() => {
      const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"] [contenteditable="true"]`);
      if (newBlockElement) {
        (newBlockElement as HTMLElement).focus();
      }
    }, 0);
  }, []);

  return (
    <div className={`min-h-[400px] bg-white dark:bg-gray-900 font-sans ${className}`}>
      <main className="max-w-4xl mx-auto p-4 sm:p-8 lg:p-12">
        <div className="space-y-1">
          {content.map((block, index) => (
            <div key={block.id} className="group" data-block-id={block.id}>
              <div className="flex items-start gap-2 py-1">
                <div className="flex-1">
                  <div
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    className="w-full border-none outline-none bg-transparent resize-none overflow-hidden focus:outline-none text-gray-800 dark:text-gray-200 leading-relaxed min-h-[1.5rem] text-base"
                    onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.innerHTML || '' })}
                    dangerouslySetInnerHTML={{ __html: block.content }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default NotionEditorFormIntegrated;
