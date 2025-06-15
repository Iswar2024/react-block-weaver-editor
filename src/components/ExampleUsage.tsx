
import React, { useState } from 'react';
import NotionEditorForm from './NotionEditorForm';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

// This represents what you would send to your database
interface DatabaseRecord {
  id?: string;
  title: string;
  description?: string;
  category: string;
  tags?: string;
  editorContent: any[]; // The NotionEditor blocks
  createdAt?: Date;
  updatedAt?: Date;
  authorId?: string;
}

const ExampleUsage: React.FC = () => {
  const [savedData, setSavedData] = useState<DatabaseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate saving to database
  const handleSaveToDatabase = async (formData: any) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Transform form data to database format
      const databaseRecord: DatabaseRecord = {
        id: `doc_${Date.now()}`,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        editorContent: formData.editorContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 'user_123' // Would come from authentication
      };
      
      // In a real app, you would send this to your API/database
      console.log('Saving to database:', databaseRecord);
      
      // For demo purposes, just save to state
      setSavedData(databaseRecord);
      
      alert('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadExample = () => {
    const exampleData = {
      title: 'My Sample Document',
      description: 'This is a sample document with rich content',
      category: 'Tutorial',
      tags: 'react, notion, editor',
      editorContent: [
        {
          id: 'block-1',
          type: 'heading1',
          content: 'Welcome to the Editor',
          alignment: 'center'
        },
        {
          id: 'block-2',
          type: 'paragraph',
          content: 'This is a sample paragraph with some <strong>bold text</strong> and <em>italic text</em>.',
          alignment: 'left'
        },
        {
          id: 'block-3',
          type: 'list',
          content: 'First list item',
          alignment: 'left'
        },
        {
          id: 'block-4',
          type: 'list',
          content: 'Second list item',
          alignment: 'left'
        },
        {
          id: 'block-5',
          type: 'todo',
          content: 'Complete the documentation',
          alignment: 'left',
          checked: false
        }
      ]
    };
    setSavedData(exampleData as DatabaseRecord);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            NotionEditor Form Integration Example
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This example shows how to integrate the NotionEditor with forms and save data to a database.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Create New Document</CardTitle>
                <CardDescription>
                  Fill out the form and use the rich text editor to create content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleLoadExample}
                  variant="outline"
                  className="mb-4"
                >
                  Load Example Data
                </Button>
              </CardContent>
            </Card>
            
            <NotionEditorForm
              onSubmit={handleSaveToDatabase}
              initialData={savedData || undefined}
              isLoading={isLoading}
            />
          </div>

          {/* Data Preview Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Database Record Preview</CardTitle>
                <CardDescription>
                  This is what would be saved to your database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedData ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Metadata</h3>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">ID:</span> {savedData.id}</p>
                        <p><span className="font-medium">Title:</span> {savedData.title}</p>
                        <p><span className="font-medium">Category:</span> {savedData.category}</p>
                        <p><span className="font-medium">Tags:</span> {savedData.tags || 'None'}</p>
                        <p><span className="font-medium">Created:</span> {savedData.createdAt?.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Editor Content ({savedData.editorContent.length} blocks)</h3>
                      <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border overflow-auto max-h-96">
                        {JSON.stringify(savedData.editorContent, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No data saved yet. Fill out the form and submit to see the database record.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleUsage;
