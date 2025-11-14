# Requirements Document: Admin Panel Improvements

## Introduction

This specification outlines improvements to the admin panel for the Military Disability Nexus application. The focus is on enhancing admin capabilities for managing contacts, viewing uploaded documents, and improving the user experience when reviewing form submissions.

## Glossary

- **Admin Panel**: The authenticated administrative interface for managing the application
- **Contact**: A form submission from a user (stored in `contacts` table)
- **Form Submission**: A structured form submission (stored in `form_submissions` table)
- **File Upload**: A document uploaded by a user (stored in `file_uploads` table and Supabase Storage)
- **JSON Parsing**: Converting JSON string data into human-readable format
- **Modal**: A popup dialog for displaying detailed information

## Requirements

### Requirement 1: Clean Form Data Display

**User Story:** As an admin, I want to view form submissions in a clean, readable format instead of raw JSON, so that I can quickly understand the submission details.

#### Acceptance Criteria

1. WHEN the Admin views a contact detail modal, THE System SHALL parse JSON data from the message field and display it in a structured, human-readable format
2. WHEN the message field contains JSON data, THE System SHALL extract and display each field with appropriate labels
3. WHEN the message field contains plain text, THE System SHALL display it as-is without modification
4. WHEN displaying parsed form data, THE System SHALL organize fields into logical sections (Personal Info, Medical Info, etc.)
5. WHEN a JSON field is empty or null, THE System SHALL display "Not provided" instead of showing empty values

### Requirement 2: Document Viewing in Admin Panel

**User Story:** As an admin, I want to view uploaded documents directly in the admin panel, so that I can review submissions without downloading files separately.

#### Acceptance Criteria

1. WHEN the Admin views a contact detail, THE System SHALL display a list of all associated uploaded files
2. WHEN the Admin clicks on a file, THE System SHALL open a preview modal showing the document
3. WHEN the file is a PDF, THE System SHALL display it using an embedded PDF viewer
4. WHEN the file is an image (JPG, PNG), THE System SHALL display it as an inline image
5. WHEN the file cannot be previewed, THE System SHALL provide a download button
6. WHEN no files are uploaded for a contact, THE System SHALL display "No documents uploaded"
7. WHEN the Admin views file list, THE System SHALL show file name, size, upload date, and file type

### Requirement 3: Form Submissions Management

**User Story:** As an admin, I want to view and manage form submissions separately from general contacts, so that I can track different types of inquiries efficiently.

#### Acceptance Criteria

1. WHEN the Admin navigates to the admin panel, THE System SHALL provide a "Form Submissions" menu item
2. WHEN the Admin views form submissions, THE System SHALL display submissions grouped by form type
3. WHEN the Admin views a form submission detail, THE System SHALL display all form fields in a clean format
4. WHEN viewing form submissions, THE System SHALL show associated file uploads
5. WHEN the Admin filters by form type, THE System SHALL show only submissions of that type

### Requirement 4: Enhanced Contact Detail View

**User Story:** As an admin, I want an improved contact detail view with tabs for different information sections, so that I can navigate complex submissions easily.

#### Acceptance Criteria

1. WHEN the Admin opens a contact detail, THE System SHALL display information in tabbed sections
2. WHEN the detail view has tabs, THE System SHALL include: Details, Documents, Activity tabs
3. WHEN the Admin switches tabs, THE System SHALL maintain the modal open state
4. WHEN viewing the Documents tab, THE System SHALL show all uploaded files with preview capability
5. WHEN viewing the Activity tab, THE System SHALL show submission timestamp and status changes

## Out of Scope

The following items are explicitly out of scope for this phase:

- Admin user management (creating new admin accounts)
- Email notifications for form submissions
- Real-time notifications
- Bulk operations on contacts
- Export functionality
- Advanced filtering and sorting
- Status workflow management

These items will be addressed in future phases.

## Success Criteria

The implementation will be considered successful when:

1. Admins can view form data without seeing raw JSON
2. Admins can preview uploaded documents in the admin panel
3. Form submissions are displayed in a clean, organized format
4. The contact detail modal has improved UX with tabs
5. All existing functionality continues to work without regression
6. No performance degradation when viewing contacts with multiple files

## Technical Constraints

- Must work with existing Supabase database schema
- Must maintain HIPAA compliance for PHI data
- Must support existing file types (PDF, DOC, DOCX, JPG, PNG)
- Must work on existing authentication system
- Must be responsive for tablet and desktop views
