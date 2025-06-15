# NotionEditor Form Integration Documentation

## Overview

This documentation explains how to integrate the NotionEditor component with forms and save the data to a database. The integration allows you to capture both traditional form fields and rich text content from the editor in a single JSON structure.

## Quick Start

```typescript
import NotionEditorForm from './components/NotionEditorForm';

function MyApp() {
  const handleSave = (data) => {
    // Send data to your API/database
    console.log('Form data:', data);
  };

  return (
    <NotionEditorForm 
      onSubmit={handleSave}
      isLoading={false}
    />
  );
}
```

## Data Structure

### Form Schema

The form captures the following data structure:

```typescript
interface FormData {
  title: string;                    // Required document title
  description?: string;             // Optional description
  category: string;                 // Required category
  tags?: string;                    // Optional comma-separated tags
  editorContent: Block[];           // Array of editor blocks
}
```

### Block Structure

Each editor block has the following structure:

```typescript
interface Block {
  id: string;                       // Unique identifier
  type: BlockType;                  // Block type (paragraph, heading1, etc.)
  content: string;                  // The actual content/text
  alignment?: 'left' | 'center' | 'right';
  checked?: boolean;                // For todo blocks
  collapsed?: boolean;              // For toggle blocks
  children?: Block[];               // For nested content
  
  // Rich media properties
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  chartData?: {
    labels: string[];
    values: number[];
  };
  
  // File upload properties
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  
  // Calendar properties
  selectedDate?: Date;
  calendarEvents?: CalendarEvent[];
  
  // Toggle-specific properties
  toggleTitle?: string;
  toggleContent?: string;
}
```

### Supported Block Types

```typescript
type BlockType = 
  | 'paragraph'      // Regular text
  | 'heading1'       // Large heading
  | 'heading2'       // Medium heading  
  | 'heading3'       // Small heading
  | 'quote'          // Blockquote
  | 'code'           // Code block
  | 'list'           // Bullet list
  | 'numbered-list'  // Numbered list
  | 'todo'           // Checkbox list
  | 'toggle'         // Collapsible content
  | 'image'          // Images
  | 'divider'        // Horizontal rule
  | 'callout'        // Highlighted box
  | 'table'          // Data table
  | 'chart-bar'      // Bar chart
  | 'chart-pie'      // Pie chart
  | 'calendar'       // Calendar widget
  | 'file'           // File attachments
  | 'video'          // Video files
  | 'audio'          // Audio files
  | 'bookmark'       // Link bookmarks
```

## Component Usage

### Basic Integration

```typescript
import { useForm } from 'react-hook-form';
import NotionEditorFormIntegrated from './components/NotionEditorFormIntegrated';

function MyForm() {
  const [editorContent, setEditorContent] = useState([]);
  
  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  return (
    <form>
      {/* Other form fields */}
      
      <NotionEditorFormIntegrated
        initialContent={editorContent}
        onChange={handleEditorChange}
        readOnly={false}
      />
      
      {/* Submit button */}
    </form>
  );
}
```

### Props Reference

#### NotionEditorForm Props

```typescript
interface NotionEditorFormProps {
  onSubmit: (data: FormData) => void;     // Callback when form is submitted
  initialData?: Partial<FormData>;        // Pre-populate form fields
  isLoading?: boolean;                    // Show loading state
}
```

#### NotionEditorFormIntegrated Props

```typescript
interface NotionEditorProps {
  initialContent?: Block[];               // Initial editor blocks
  onChange?: (content: Block[]) => void;  // Callback when content changes
  readOnly?: boolean;                     // Disable editing
  className?: string;                     // Additional CSS classes
}
```

## Database Integration

### Example Database Schema

Here's a suggested database schema for storing the form data:

```sql
-- PostgreSQL example
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  tags TEXT,
  editor_content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  author_id INTEGER REFERENCES users(id)
);

-- Index for faster JSON queries
CREATE INDEX idx_documents_content ON documents USING GIN (editor_content);
```

### Saving to Database

```typescript
// Example API endpoint (Node.js/Express)
app.post('/api/documents', async (req, res) => {
  try {
    const { title, description, category, tags, editorContent } = req.body;
    
    const document = await db.documents.create({
      title,
      description,
      category,
      tags,
      editor_content: editorContent,  // Store as JSONB
      author_id: req.user.id
    });
    
    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Querying Data

```typescript
// Search documents by content
app.get('/api/documents/search', async (req, res) => {
  const { query } = req.query;
  
  const documents = await db.documents.findAll({
    where: {
      [Op.or]: [
        { title: { [Op.iLike]: `%${query}%` } },
        { 
          editor_content: {
            [Op.contains]: [{ content: { [Op.iLike]: `%${query}%` } }]
          }
        }
      ]
    }
  });
  
  res.json(documents);
});
```

## Data Processing Examples

### Extract Plain Text

```typescript
function extractPlainText(blocks: Block[]): string {
  return blocks
    .map(block => {
      // Remove HTML tags and get plain text
      const plainText = block.content.replace(/<[^>]*>/g, '');
      return plainText;
    })
    .filter(text => text.trim().length > 0)
    .join(' ');
}
```

### Count Word/Character Statistics

```typescript
function getDocumentStats(blocks: Block[]) {
  const plainText = extractPlainText(blocks);
  
  return {
    blocks: blocks.length,
    characters: plainText.length,
    words: plainText.split(/\s+/).filter(word => word.length > 0).length,
    images: blocks.filter(b => b.type === 'image').length,
    tables: blocks.filter(b => b.type === 'table').length,
    todos: blocks.filter(b => b.type === 'todo').length,
    completedTodos: blocks.filter(b => b.type === 'todo' && b.checked).length
  };
}
```

### Export to Different Formats

```typescript
// Export to Markdown
function exportToMarkdown(blocks: Block[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading1':
        return `# ${block.content}`;
      case 'heading2':
        return `## ${block.content}`;
      case 'heading3':
        return `### ${block.content}`;
      case 'quote':
        return `> ${block.content}`;
      case 'code':
        return `\`\`\`\n${block.content}\n\`\`\``;
      case 'list':
        return `- ${block.content}`;
      case 'numbered-list':
        return `1. ${block.content}`;
      case 'todo':
        return `- [${block.checked ? 'x' : ' '}] ${block.content}`;
      default:
        return block.content;
    }
  }).join('\n\n');
}
```

## Validation & Error Handling

### Form Validation

The form uses Zod for validation:

```typescript
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.string().optional(),
  editorContent: z.array(z.object({
    id: z.string(),
    type: z.string(),
    content: z.string()
    // ... other block properties
  })).min(1, 'Editor content is required')
});
```

### Error Handling

```typescript
const handleSubmit = async (data: FormData) => {
  try {
    // Validate editor content
    if (data.editorContent.length === 0) {
      throw new Error('Document cannot be empty');
    }
    
    // Save to database
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save document');
    }
    
    const result = await response.json();
    console.log('Document saved:', result);
    
  } catch (error) {
    console.error('Error saving document:', error);
    // Show error message to user
  }
};
```

## Best Practices

### Performance Optimization

1. **Debounce onChange**: Avoid too frequent updates
```typescript
const debouncedOnChange = useCallback(
  debounce((content: Block[]) => {
    onChange?.(content);
  }, 300),
  [onChange]
);
```

2. **Memoize heavy computations**:
```typescript
const documentStats = useMemo(() => 
  getDocumentStats(editorContent), 
  [editorContent]
);
```

### Data Management

1. **Version Control**: Store document versions
2. **Auto-save**: Implement periodic auto-saving
3. **Offline Support**: Cache data locally
4. **File Management**: Use proper file storage for media

### Security

1. **Sanitize HTML**: Clean user-generated HTML content
2. **File Upload Security**: Validate file types and sizes
3. **Access Control**: Implement proper permissions
4. **XSS Prevention**: Escape content when rendering

## Migration Guide

If you're upgrading from a previous version:

1. Update your database schema to use JSONB for editor content
2. Migrate existing content to the new block structure
3. Update your API endpoints to handle the new data format
4. Test thoroughly with existing data

## Troubleshooting

### Common Issues

1. **Content not saving**: Check form validation errors
2. **Images not displaying**: Verify file upload configuration
3. **Performance issues**: Implement debouncing and memoization
4. **TypeScript errors**: Ensure proper type definitions

### Debug Mode

Enable debug mode to see real-time form data:

```typescript
<NotionEditorForm 
  {...props}
  debug={process.env.NODE_ENV === 'development'}
/>
```

## Examples

See the `ExampleUsage.tsx` component for a complete working example that demonstrates:

- Form integration
- Data saving simulation
- Real-time preview
- Error handling
- Loading states

This documentation should provide everything you need to integrate the NotionEditor with your forms and database!
