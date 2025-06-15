
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import NotionEditorFormIntegrated from './NotionEditorFormIntegrated';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.string().optional(),
  editorContent: z.array(z.object({
    id: z.string(),
    type: z.string(),
    content: z.string(),
    alignment: z.string().optional(),
    checked: z.boolean().optional(),
    collapsed: z.boolean().optional(),
    children: z.array(z.any()).optional(),
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    tableData: z.object({
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string()))
    }).optional(),
    chartData: z.object({
      labels: z.array(z.string()),
      values: z.array(z.number())
    }).optional(),
    toggleTitle: z.string().optional(),
    toggleContent: z.string().optional(),
    selectedDate: z.date().optional(),
    calendarEvents: z.array(z.any()).optional(),
    fileName: z.string().optional(),
    fileSize: z.string().optional(),
    fileType: z.string().optional()
  })).min(1, 'Editor content is required')
});

type FormData = z.infer<typeof formSchema>;

interface NotionEditorFormProps {
  onSubmit: (data: FormData) => void;
  initialData?: Partial<FormData>;
  isLoading?: boolean;
}

const NotionEditorForm: React.FC<NotionEditorFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      tags: initialData?.tags || '',
      editorContent: initialData?.editorContent || [
        { id: 'block-1', type: 'paragraph', content: 'Start writing...', alignment: 'left' }
      ]
    }
  });

  const handleFormSubmit = (data: FormData) => {
    console.log('Form Data:', data);
    onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Create New Document
        </h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter document title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Blog, Documentation, Notes"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the document"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Separate tags with commas (e.g., react, tutorial, web)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Editor Content Field */}
            <FormField
              control={form.control}
              name="editorContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Controller
                        name="editorContent"
                        control={form.control}
                        render={({ field: { onChange, value } }) => (
                          <NotionEditorFormIntegrated
                            initialContent={value}
                            onChange={onChange}
                          />
                        )}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Document'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* JSON Preview (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Form Data Preview (Development Only)</h3>
          <pre className="text-xs bg-white dark:bg-gray-900 p-4 rounded border overflow-auto max-h-64">
            {JSON.stringify(form.watch(), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default NotionEditorForm;
