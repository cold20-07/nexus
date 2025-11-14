import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import ContactDetailModal from '../../components/admin/ContactDetailModal';
import ErrorBoundary from '../../components/admin/ErrorBoundary';
import { TableRowSkeleton } from '../../components/admin/SkeletonLoader';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, Mail, Phone, Calendar, Eye, Trash2, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [fileCounts, setFileCounts] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data);
      
      // Fetch file counts for all contacts
      if (data && data.length > 0) {
        await fetchFileCounts(data.map(c => c.id));
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError('Failed to load contacts. Please try again.');
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchFileCounts = async (contactIds) => {
    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .select('contact_id')
        .in('contact_id', contactIds);

      if (error) throw error;

      // Count files per contact
      const counts = {};
      data.forEach(file => {
        counts[file.contact_id] = (counts[file.contact_id] || 0) + 1;
      });
      
      setFileCounts(counts);
    } catch (error) {
      console.error('Error fetching file counts:', error);
    }
  };

  const deleteContact = async (id) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(contacts.filter(c => c.id !== id));
      setSelectedContact(null);
      toast.success('Contact deleted');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoize filtered contacts to avoid unnecessary recalculations
  const filteredContacts = useMemo(() => {
    if (!debouncedSearchQuery) return contacts;
    
    const query = debouncedSearchQuery.toLowerCase();
    return contacts.filter(contact =>
      contact.name?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.subject?.toLowerCase().includes(query)
    );
  }, [contacts, debouncedSearchQuery]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <ErrorBoundary errorMessage="Failed to load contacts page">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Contacts</h1>
              <p className="text-slate-600 mt-2">Manage form submissions</p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <div className="relative">
              <label htmlFor="contact-search" className="sr-only">Search contacts</label>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
              <input
                id="contact-search"
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Search contacts by name, email, or subject"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-red-200">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to Load Contacts</h3>
              <p className="text-slate-600 mb-6">{error}</p>
              <button
                onClick={fetchContacts}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Contacts List */}
          {!error && (loading || filteredContacts.length > 0) ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Files</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {loading ? (
                      <TableRowSkeleton columns={6} rows={5} />
                    ) : (
                      filteredContacts.map((contact) => {
                        const fileCount = fileCounts[contact.id] || 0;
                        return (
                          <tr key={contact.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-900">{contact.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900 flex items-center space-x-1">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span>{contact.email}</span>
                              </div>
                              {contact.phone && (
                                <div className="text-sm text-slate-500 flex items-center space-x-1 mt-1">
                                  <Phone className="w-4 h-4 text-slate-400" />
                                  <span>{contact.phone}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-900">{contact.subject}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {fileCount > 0 ? (
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-indigo-600" />
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {fileCount} {fileCount === 1 ? 'file' : 'files'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">No files</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-500 flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(contact.created_at)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => setSelectedContact(contact)}
                                className="text-indigo-600 hover:text-teal-900 mr-3"
                                aria-label={`View details for ${contact.name}`}
                                title="View contact details"
                              >
                                <Eye className="w-5 h-5" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => deleteContact(contact.id)}
                                className="text-red-600 hover:text-red-900"
                                aria-label={`Delete contact ${contact.name}`}
                                title="Delete contact"
                              >
                                <Trash2 className="w-5 h-5" aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !error && filteredContacts.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No contacts found</p>
              {searchQuery && (
                <p className="text-slate-500 text-sm mt-2">Try adjusting your search</p>
              )}
            </div>
          )}

          {/* Contact Detail Modal */}
          <ContactDetailModal
            contact={selectedContact}
            isOpen={!!selectedContact}
            onClose={() => setSelectedContact(null)}
            onDelete={deleteContact}
          />
        </div>
      </ErrorBoundary>
    </AdminLayout>
  );
};

export default Contacts;
