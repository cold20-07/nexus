# Implementation Plan: Admin Panel Improvements

- [x] 1. Create utility functions and helpers





- [x] 1.1 Create form data parser utility (`frontend/src/lib/formDataParser.js`)


  - Write function to detect JSON vs plain text
  - Implement JSON parsing with error handling
  - Create field mapping for Aid & Attendance form
  - Add section grouping logic
  - Handle empty/null values gracefully
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.2 Create file type detection utility


  - Implement MIME type checking
  - Add file extension validation
  - Create preview capability detection
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 2. Build FormDataParser component





- [x] 2.1 Create FormDataParser component (`frontend/src/components/admin/FormDataParser.js`)


  - Set up component structure with props
  - Implement data parsing logic
  - Create section rendering
  - Add field formatting (dates, phone numbers, etc.)
  - Style with Tailwind classes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.2 Add support for different form types


  - Handle Aid & Attendance form structure
  - Handle Quick Intake form structure
  - Handle generic form structure
  - Add fallback for unknown formats
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Build DocumentViewer component





- [x] 3.1 Create DocumentViewer component (`frontend/src/components/admin/DocumentViewer.js`)


  - Set up component with file fetching logic
  - Create file list UI with metadata display
  - Add file icons based on type
  - Implement empty state
  - Add loading state
  - _Requirements: 2.1, 2.6, 2.7_

- [x] 3.2 Integrate with Supabase file uploads API


  - Fetch files by contact_id
  - Fetch files by form_submission_id
  - Handle API errors
  - Format file size display
  - Format upload date display
  - _Requirements: 2.1, 2.7_

- [x] 4. Build FilePreviewModal component




- [x] 4.1 Create FilePreviewModal component (`frontend/src/components/admin/FilePreviewModal.js`)


  - Set up modal structure
  - Implement signed URL generation
  - Add PDF preview using iframe
  - Add image preview
  - Add download button
  - Handle unsupported file types
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 4.2 Add modal interactions and accessibility


  - Implement ESC key to close
  - Add click outside to close
  - Manage focus trap
  - Add ARIA labels
  - Add loading spinner
  - Handle error states
  - _Requirements: 2.2_

- [x] 5. Enhance ContactDetailModal component




- [x] 5.1 Create new ContactDetailModal component (`frontend/src/components/admin/ContactDetailModal.js`)


  - Set up tabbed interface structure
  - Create Details tab with FormDataParser
  - Create Documents tab with DocumentViewer
  - Create Activity tab placeholder
  - Add tab navigation logic
  - Style tabs with active states
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.2 Integrate components into modal


  - Wire up FormDataParser in Details tab
  - Wire up DocumentViewer in Documents tab
  - Connect FilePreviewModal
  - Add delete confirmation
  - Maintain existing close functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Update Contacts page






- [x] 6.1 Update Contacts.js to use new ContactDetailModal

  - Replace inline modal with new component
  - Pass contact data as props
  - Handle modal open/close state
  - Update delete handler
  - Test existing search functionality
  - _Requirements: 1.1, 2.1, 4.1_


- [x] 6.2 Add file count indicator to contacts table

  - Fetch file counts for each contact
  - Display badge with count
  - Add icon for contacts with files
  - _Requirements: 2.1, 2.7_

- [x] 7. Create FormSubmissions page




- [x] 7.1 Create FormSubmissions page (`frontend/src/pages/admin/FormSubmissions.js`)


  - Set up page structure with AdminLayout
  - Create table for form submissions
  - Add form type filter dropdown
  - Implement search functionality
  - Add pagination if needed
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 7.2 Implement form submission detail view


  - Create detail modal for form submissions
  - Use FormDataParser for form_data field
  - Show associated file uploads
  - Add status indicators
  - _Requirements: 3.3, 3.4_

- [x] 7.3 Add navigation menu item


  - Update AdminLayout navigation
  - Add "Form Submissions" link
  - Add icon for menu item
  - _Requirements: 3.1_

- [x] 8. Polish and testing





- [x] 8.1 Add loading states and error handling


  - Add skeleton loaders for file lists
  - Add error boundaries
  - Improve error messages
  - Add retry buttons
  - _Requirements: All_

- [x] 8.2 Responsive design verification


  - Test on tablet viewport
  - Test on desktop viewport
  - Adjust modal sizes if needed
  - Test tab navigation on mobile
  - _Requirements: All_

- [x] 8.3 Performance optimization


  - Implement React.memo where needed
  - Add debouncing to search
  - Lazy load PDF viewer
  - Cache signed URLs
  - _Requirements: All_

- [x] 8.4 Accessibility improvements


  - Test keyboard navigation
  - Verify ARIA labels
  - Check color contrast
  - Test with screen reader
  - _Requirements: All_
