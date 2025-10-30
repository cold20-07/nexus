import { supabase, STORAGE_BUCKETS } from './supabase';

// ============================================
// SERVICES
// ============================================

export const servicesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================
// BLOG
// ============================================

export const blogApi = {
  async getAll(limit = 100) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) throw error;
    return data;
  },

  async search(query, category = null) {
    let queryBuilder = supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true);

    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,excerpt.ilike.%${query}%,content_html.ilike.%${query}%`
      );
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const { data, error } = await queryBuilder
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  },
};

// ============================================
// CONTACTS
// ============================================

export const contactsApi = {
  async submit(contactData) {
    const { data, error } = await supabase
      .from('contacts')
      .insert([
        {
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone || null,
          subject: contactData.subject,
          message: contactData.message,
          service_interest: contactData.serviceInterest || contactData.service || null,
          status: 'new',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================
// FILE UPLOADS
// ============================================

export const fileUploadApi = {
  async upload(file, contactId, category = 'other') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${contactId}/${Date.now()}.${fileExt}`;

    // Validate category - must be one of the allowed values
    const validCategories = ['medical_record', 'insurance', 'identification', 'other'];
    const validCategory = validCategories.includes(category) ? category : 'other';

    // Upload to storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from(STORAGE_BUCKETS.MEDICAL_DOCUMENTS)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (storageError) throw storageError;

    // Create database record
    const { data: dbData, error: dbError } = await supabase
      .from('file_uploads')
      .insert([
        {
          contact_id: contactId,
          original_filename: file.name,
          storage_path: storageData.path,
          file_size: file.size,
          mime_type: file.type,
          file_category: validCategory,
          upload_status: 'uploaded',
          is_phi: true,
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;
    return dbData;
  },

  async getAll(contactId = null) {
    let query = supabase
      .from('file_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(fileId) {
    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) throw error;
    return data;
  },

  async getDownloadUrl(storagePath) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.MEDICAL_DOCUMENTS)
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  },

  async delete(fileId, storagePath) {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKETS.MEDICAL_DOCUMENTS)
      .remove([storagePath]);

    if (storageError) throw storageError;

    // Delete database record
    const { error: dbError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;
    return true;
  },
};

export default {
  services: servicesApi,
  blog: blogApi,
  contacts: contactsApi,
  fileUpload: fileUploadApi,
};
