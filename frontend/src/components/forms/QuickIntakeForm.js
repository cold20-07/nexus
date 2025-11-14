import { useState } from 'react';
import { Upload, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formSubmissionsApi, fileUploadApi } from '../../lib/api';
import SuccessModal from '../SuccessModal';

const FORM_TYPES = [
  { value: 'nexus_letter', label: 'Nexus Letter', requiresUpload: false },
  { value: 'dbq', label: 'Disability Benefits Questionnaires (DBQs)', requiresUpload: false },
  { value: '1151_claim', label: '1151 Claim (VA Medical Malpractice)', requiresUpload: false },
  { value: 'aid_attendance', label: 'Aid & Attendance', requiresUpload: false },
  { value: 'unsure', label: "I'm not sure what I need", requiresUpload: false },
];

const QuickIntakeForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    formType: 'unsure',
    briefSummary: '',
    rushService: false,
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const selectedFormType = FORM_TYPES.find(ft => ft.value === formData.formType);
  const requiresUpload = selectedFormType?.requiresUpload || false;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit form
      const submission = await formSubmissionsApi.submit({
        formType: formData.formType,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        formData: {
          briefSummary: formData.briefSummary,
        },
        requiresUpload,
      });

      // Upload files if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          await fileUploadApi.upload(file, submission.id, 'medical_record', true);
        }
      }

      setShowSuccessModal(true);
      
      if (onSuccess) {
        onSuccess(submission);
      }

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        formType: 'unsure',
        briefSummary: '',
        rushService: false,
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDiscovery = () => {
    window.location.href = 'mailto:contact@militarydisabilitynexus.com?subject=Free Discovery Call';
  };

  return (
    <div className="relative rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl bg-white/80 border border-white/40">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Quick Intake</h3>
      <p className="text-xs sm:text-sm text-slate-700 mb-4 sm:mb-6">
        Upload Redacted documents or describe your case and we will recommend the right service.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:outline-none text-sm text-slate-900 placeholder:text-slate-600"
            placeholder="Full name"
          />
        </div>

        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:outline-none text-sm text-slate-900 placeholder:text-slate-600"
            placeholder="Email"
          />
        </div>

        <div>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:outline-none text-sm text-slate-900 placeholder:text-slate-600"
            placeholder="Phone (optional)"
          />
        </div>

        <div>
          <select
            name="formType"
            value={formData.formType}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:outline-none text-sm text-slate-900"
          >
            {FORM_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <textarea
            name="briefSummary"
            value={formData.briefSummary}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2.5 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 focus:outline-none text-sm resize-none text-slate-900 placeholder:text-slate-600"
            placeholder="Brief summary (optional)"
          />
        </div>

        {/* File Upload Section - Available for all services */}
        <div className="border-2 border-dashed border-white/40 bg-white/30 backdrop-blur-sm rounded-lg p-4">
          <label className="cursor-pointer block text-center">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <span className="text-sm text-slate-600">
              Click to upload documents (optional)
            </span>
            <p className="text-xs text-slate-500 mt-1">
              PDF, DOC, or images
            </p>
          </label>

          {selectedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded"
                >
                  <span className="truncate flex-1">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rush Service Checkbox */}
        <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
          <input
            type="checkbox"
            id="rushService"
            name="rushService"
            checked={formData.rushService}
            onChange={(e) => setFormData(prev => ({ ...prev, rushService: e.target.checked }))}
            className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="rushService" className="flex-1 cursor-pointer">
            <span className="text-sm font-medium text-slate-900">Rush service (expedited fee)</span>
            <p className="text-xs text-slate-600 mt-0.5">Get your documentation completed in 3-5 business days</p>
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Start Free Discovery</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Form Submitted Successfully!"
        message="We've received your request — Thank you for your service. It's our privilege to support you in return."
      />
    </div>
  );
};

export default QuickIntakeForm;
