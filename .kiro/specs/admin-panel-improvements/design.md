# Design Document: Admin Panel Improvements

## Overview

This design outlines the implementation of admin panel improvements focused on better form data display, document viewing capabilities, and enhanced user experience for reviewing submissions.

## Architecture

### Component Structure

```
frontend/src/
├── pages/admin/
│   ├── Contacts.js (enhanced)
│   └── FormSubmissions.js (new)
├── components/admin/
│   ├── ContactDetailModal.js (new)
│   ├── FormDataParser.js (new)
│   ├── DocumentViewer.js (new)
│   └── FilePreviewModal.js (new)
└── lib/
    └── formDataParser.js (new utility)
```

### Data Flow

1. **Contact Detail View**
   - Fetch contact data from `contacts` table
   - Parse JSON message field
   - Fetch associated files from `file_uploads` table
   - Display in tabbed modal

2. **Document Viewing**
   - Fetch file metadata from `file_uploads` table
   - Generate signed URL from Supabase Storage
   - Display in preview modal based on file type

3. **Form Submissions**
   - Fetch from `form_submissions` table
   - Parse JSONB `form_data` field
   - Display structured form fields
   - Link to associated file uploads

## Components and Interfaces

### 1. FormDataParser Component

**Purpose:** Parse and display JSON form data in human-readable format

**Props:**
```typescript
interface FormDataParserProps {
  data: string | object;  // JSON string or parsed object
  formType?: string;      // 'aid_attendance', 'quick_intake', etc.
}
```

**Functionality:**
- Detect if data is JSON string or plain text
- Parse JSON safely with error handling
- Organize fields into logical sections
- Apply appropriate labels and formatting
- Handle nested objects and arrays

**Sections for Aid & Attendance:**
- Personal Information
- Contact Person
- Medical Information
- Activities of Daily Living
- Care Requirements
- Additional Information

### 2. DocumentViewer Component

**Purpose:** Display list of uploaded documents with preview capability

**Props:**
```typescript
interface DocumentViewerProps {
  contactId?: string;
  formSubmissionId?: string;
  onFileClick: (file: FileUpload) => void;
}
```

**Functionality:**
- Fetch files based on contact_id or form_submission_id
- Display file list with metadata (name, size, date, type)
- Provide preview button for each file
- Show file count badge
- Handle empty state

### 3. FilePreviewModal Component

**Purpose:** Preview documents in a modal

**Props:**
```typescript
interface FilePreviewModalProps {
  file: FileUpload;
  isOpen: boolean;
  onClose: () => void;
}
```

**Functionality:**
- Generate signed URL for file access
- Render PDF using `react-pdf` or iframe
- Display images using img tag
- Provide download button
- Handle loading and error states
- Support keyboard navigation (ESC to close)

### 4. ContactDetailModal Component

**Purpose:** Enhanced modal for viewing contact details

**Props:**
```typescript
interface ContactDetailModalProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}
```

**Tabs:**
1. **Details Tab**
   - Parsed form data
   - Contact information
   - Service interest
   - Submission date

2. **Documents Tab**
   - List of uploaded files
   - File preview capability
   - Download options

3. **Activity Tab** (future enhancement)
   - Submission timeline
   - Status changes
   - Admin notes

### 5. FormSubmissions Page

**Purpose:** Dedicated page for managing form submissions

**Features:**
- Filter by form type dropdown
- Search functionality
- Table view with key fields
- Detail modal similar to contacts
- Status indicators

## Data Models

### Enhanced File Upload Display

```typescript
interface FileUploadDisplay {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  file_category: string;
  created_at: string;
  storage_path: string;
  preview_url?: string;  // Generated signed URL
}
```

### Parsed Form Data Structure

```typescript
interface ParsedFormData {
  sections: FormSection[];
}

interface FormSection {
  title: string;
  fields: FormField[];
}

interface FormField {
  label: string;
  value: string | string[];
  type: 'text' | 'date' | 'select' | 'textarea' | 'checkbox';
}
```

## Error Handling

### JSON Parsing Errors
- Wrap JSON.parse in try-catch
- Fall back to displaying raw text if parsing fails
- Log errors for debugging
- Show user-friendly message

### File Loading Errors
- Handle 404 for missing files
- Handle 403 for permission errors
- Show error message in preview modal
- Provide retry option

### Network Errors
- Show loading states
- Display error toast notifications
- Provide retry buttons
- Cache successful responses

## Testing Strategy

### Unit Tests
- FormDataParser: Test JSON parsing with various inputs
- File type detection logic
- Date formatting functions
- Error handling scenarios

### Integration Tests
- Contact detail modal with real data
- File upload and preview flow
- Form submission display
- Tab navigation

### Manual Testing Checklist
- [ ] View contact with JSON form data
- [ ] View contact with plain text message
- [ ] Preview PDF document
- [ ] Preview image document
- [ ] Handle missing files gracefully
- [ ] Test with multiple file uploads
- [ ] Test form submissions page
- [ ] Test tab navigation
- [ ] Test on tablet and desktop
- [ ] Test with slow network

## Performance Considerations

### File Preview Optimization
- Generate signed URLs on-demand
- Cache signed URLs (1 hour expiry)
- Lazy load file previews
- Limit preview size for large files

### Data Fetching
- Fetch files only when Documents tab is opened
- Use React Query or SWR for caching
- Implement pagination for large file lists
- Debounce search input

### UI Performance
- Use React.memo for expensive components
- Virtualize long file lists
- Optimize modal animations
- Lazy load PDF viewer library

## Security Considerations

### File Access
- Always use signed URLs with expiry
- Verify admin authentication before generating URLs
- Log file access in audit_logs table
- Respect RLS policies

### Data Display
- Sanitize HTML in parsed form data
- Prevent XSS in user-submitted content
- Validate file types before preview
- Limit file size for preview

## UI/UX Design

### Modal Layout
```
┌─────────────────────────────────────┐
│ Contact Details              [X]    │
├─────────────────────────────────────┤
│ [Details] [Documents] [Activity]    │
├─────────────────────────────────────┤
│                                     │
│  Content Area                       │
│  (Scrollable)                       │
│                                     │
│                                     │
├─────────────────────────────────────┤
│              [Close] [Delete]       │
└─────────────────────────────────────┘
```

### File Preview Modal
```
┌─────────────────────────────────────┐
│ filename.pdf                  [X]   │
├─────────────────────────────────────┤
│                                     │
│                                     │
│        PDF/Image Preview            │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  [Download]              [Close]    │
└─────────────────────────────────────┘
```

### Parsed Form Data Display
```
Personal Information
├─ Veteran's Full Name: John Doe
├─ Social Security Number: ***-**-1234
├─ Date of Birth: 01/15/1970
├─ Phone Number: (555) 123-4567
└─ Email Address: john@example.com

Medical Information
├─ Primary Diagnosis: PTSD
├─ Secondary Diagnoses: Anxiety, Depression
└─ Current Medications: Sertraline 50mg
```

## Implementation Notes

### Libraries to Use
- `react-pdf` for PDF preview (or iframe fallback)
- `lucide-react` for icons (already in use)
- `date-fns` for date formatting
- Native browser APIs for image preview

### Styling
- Use existing Tailwind classes
- Match current admin panel design
- Ensure responsive design
- Add smooth transitions

### Accessibility
- Keyboard navigation for modals
- ARIA labels for screen readers
- Focus management
- Color contrast compliance

## Migration Path

### Phase 1: Core Functionality
1. Create FormDataParser utility
2. Update ContactDetailModal with tabs
3. Add DocumentViewer component
4. Implement FilePreviewModal

### Phase 2: Form Submissions
1. Create FormSubmissions page
2. Add navigation menu item
3. Implement filtering and search
4. Link to file uploads

### Phase 3: Polish
1. Add loading skeletons
2. Improve error messages
3. Add keyboard shortcuts
4. Performance optimization

## Future Enhancements

- Bulk file download
- File annotations
- Status workflow
- Email integration
- Real-time updates
- Advanced search
- Export to CSV
