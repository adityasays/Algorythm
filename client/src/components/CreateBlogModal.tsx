import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Edit3, Trash2, X, Plus, Italic, List, Quote, Code, Bold } from 'lucide-react';

// Type definitions
interface BlogFormData {
  title: string;
  content: string;
  category: string;
  readTime?: number;
  tags?: string[];
}

interface ErrorRecord {
  [key: string]: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder: string;
}

interface CreateBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (blog: BlogFormData) => void;
  isSubmitting?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
      setIsEmpty(!value || value.trim() === '');
    }
  }, [value]);

  const formatText = useCallback((command: string, value: string | null = null) => {
    try {
      document.execCommand(command, false, value || undefined);
      if (editorRef.current) {
        editorRef.current.focus();
        onChange(editorRef.current.innerHTML);
      }
    } catch (error) {
      console.error('Error executing command:', error);
    }
  }, [onChange]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const content = target.innerHTML;
    const textContent = target.textContent || target.innerText || '';
    setIsEmpty(!textContent.trim());
    onChange(content);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    setTimeout(() => {
      const activeElement = document.activeElement;
      const currentTarget = e.currentTarget;
      if (!currentTarget.contains(activeElement) && !currentTarget.parentElement?.contains(activeElement)) {
        setIsEditing(false);
      }
    }, 150);
  }, []);

  const getCharacterCount = useCallback(() => {
    if (!value) return 0;
    return value.replace(/<[^>]*>/g, '').length;
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue !== 'normal') {
      formatText('formatBlock', selectedValue);
    }
  };

  return (
    <div className="relative border border-gray-600 rounded-lg bg-gray-700/50">
      <div 
        className={`flex items-center gap-2 px-3 py-2 bg-gray-800/50 border-b border-gray-600 transition-all duration-200 ${
          isEditing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none absolute'
        }`} 
        style={{ zIndex: isEditing ? 10 : -1 }}
      >
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="px-2 py-1 rounded hover:bg-gray-600 bg-gray-300 text-gray-800 hover:bg-gray-200"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="px-2 py-1 rounded hover:bg-gray-600 bg-gray-300 text-gray-800 hover:bg-gray-200"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="px-2 py-1 rounded hover:bg-gray-600 bg-gray-300 text-gray-800 hover:bg-gray-200"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'blockquote')}
          className="px-2 py-1 rounded hover:bg-gray-600 bg-gray-300 text-gray-800 hover:bg-gray-200"
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'pre')}
          className="px-2 py-1 rounded hover:bg-gray-600 bg-gray-300 text-gray-800 hover:bg-gray-200"
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-600" />
        
        <select 
          onChange={handleSelectChange}
          className="px-2 py-1 bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          defaultValue="normal"
        >
          <option value="normal">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable="true"
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={() => setIsEditing(true)}
          className="w-full px-4 py-4 bg-gray-700 text-gray-200 min-h-[250px] focus:outline-none resize-none"
          style={{ 
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            lineHeight: '1.6'
          }}
          suppressContentEditableWarning={true}
          role="textbox"
          aria-label="Blog content editor"
          aria-multiline="true"
          title="Blog post content editor"
        />
        {isEmpty && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-gray-800/80 text-gray-300 px-2 py-1 rounded text-sm">
          {getCharacterCount()} characters
        </div>
      </div>
    </div>
  );
};

const CreateBlogModal: React.FC<CreateBlogModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting = false
}) => {
  const [blogData, setBlogData] = useState<BlogFormData>({ 
    title: '', 
    content: '', 
    category: 'Tips/Tricks', 
    readTime: 5, 
    tags: [] 
  });
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState<string>('');
  const [errors, setErrors] = useState<ErrorRecord>({});

  useEffect(() => {
    if (!isOpen) {
      setBlogData({ title: '', content: '', category: 'Tips/Tricks', readTime: 5, tags: [] });
      setTags([]);
      setCurrentTag('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = useCallback(() => {
    const newErrors: ErrorRecord = {};
    if (!blogData.title.trim()) newErrors.title = 'Title is required!';
    else if (blogData.title.trim().length < 3) newErrors.title = 'Title must be at least 3 characters!';
    
    if (!blogData.category) newErrors.category = 'Category is required!';
    
    if (!blogData.content.trim()) newErrors.content = 'Content is required!';
    else if (blogData.content.replace(/<[^>]*>/g, '').trim().length < 10) newErrors.content = 'Content must be at least 10 characters!';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [blogData.title, blogData.category, blogData.content]);

  const addTag = useCallback(() => {
    const trimmedTag = currentTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 8) {
      setTags(prev => [...prev, trimmedTag]);
      setBlogData(prev => ({ ...prev, tags: [...(prev.tags || []), trimmedTag] }));
      setCurrentTag('');
    }
  }, [currentTag, tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
    setBlogData(prev => ({ ...prev, tags: prev.tags?.filter(tag => tag !== tagToRemove) || [] }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      onSubmit(blogData);
    }
  }, [validateForm, onSubmit, blogData]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }, [addTag]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl w-full max-w-6xl h-[90vh] overflow-hidden shadow-xl">
        <div className="relative py-6 px-4 bg-gray-700/50">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500" />
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center mr-3">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
                  Create New Blog
                </h2>
                <p className="text-gray-400 text-sm">Share your knowledge with the community</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl bg-gray-600 hover:bg-gray-700 text-gray-300 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto h-[calc(90vh-160px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={blogData.title}
                  onChange={(e) => {
                    setBlogData({ ...blogData, title: e.target.value });
                    if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                  }}
                  className={`w-full px-3 py-3 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="Enter blog title..."
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={blogData.category}
                  onChange={(e) => {
                    setBlogData({ ...blogData, category: e.target.value });
                    if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                  }}
                  className={`w-full px-3 py-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  <option value="" disabled>Select category</option>
                  <option value="Tips/Tricks">💡 Tips/Tricks</option>
                  <option value="Interview Experience">🎯 Interview Experience</option>
                  <option value="Others">📝 Other</option>
                </select>
                {errors.category && (
                  <p className="text-red-400 text-sm mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Reading Time (min)</label>
                <input
                  type="number"
                  value={blogData.readTime || ''}
                  onChange={(e) => setBlogData({ 
                    ...blogData, 
                    readTime: parseInt(e.target.value) || undefined 
                  })}
                  className="w-full px-3 py-3 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  max="200"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">
                  Keywords {tags.length > 0 && <span className="text-sm text-gray-400">({tags.length}/8)</span>}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 text-sm rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-gray-300">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1 px-2 py-2 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Add keyword..."
                    maxLength={20}
                    disabled={tags.length >= 8}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!currentTag.trim() || tags.length >= 8}
                    className="px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 text-gray-300 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-2">
              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  Content <span className="text-red-400">*</span>
                </label>
                <RichTextEditor
                  value={blogData.content}
                  onChange={(content) => {
                    setBlogData({ ...blogData, content });
                    if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
                  }}
                  placeholder="Write your blog content here... Use the toolbar to format your text."
                />
                {errors.content && (
                  <p className="text-red-400 text-sm mt-1">{errors.content}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-800/70 border-t border-gray-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Fill in the details and publish your blog post
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-gray-300 font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBlogModal;