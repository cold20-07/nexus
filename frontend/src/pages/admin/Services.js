import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setServices(services.map(s => 
        s.id === id ? { ...s, is_active: !currentStatus } : s
      ));
      toast.success('Service updated');
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Services</h1>
            <p className="text-slate-600 mt-2">Manage your services</p>
          </div>
          <a
            href="/admin/services/new"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Service</span>
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{service.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    service.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">{service.short_description}</p>
                
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="font-semibold text-teal-600">${service.base_price_usd}</span>
                  <span className="text-slate-500">{service.duration}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleActive(service.id, service.is_active)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
                  >
                    {service.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <a
                    href={`/services/${service.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <a
                    href={`/admin/services/edit/${service.id}`}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    <Edit className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Edit services directly in Supabase Table Editor for now. Full CRUD interface coming soon!
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Services;
