import API, { apiService } from "../config/api";


// ✅ Create new contact
export const addContact = async (token, contactData) => {
  const res = await apiService.post(API.ENDPOINTS.ADD_CONTACT, contactData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// ✅ Get all contacts
export const getContacts = async (token, page = 1, limit = 15, search = "") => {
  const params = {};
  if (search) {
    params.search = search;
  } else {
    params.per_page = limit;
    if (page && page > 1) params.page = page;
  }

  const res = await apiService.get(API.ENDPOINTS.GET_CONTACT, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  // We return the full response data so we can access pagination in the slice
  return res.data;
};

// ✅ Get contact by ID
export const getContactById = async (token, id) => {
  const res = await apiService.get(`${API.ENDPOINTS.getContacts}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.contact;
};

// ✅ Update contact
export const updateContact = async (token, id, contactData) => {
  console.log("idiiii", id)
  const res = await apiService.put(`${API.ENDPOINTS.UPDATE_CONTACT}/${id}`, contactData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// ✅ Delete contact
export const deleteContact = async (token, id) => {
  const res = await apiService.delete(`${API.ENDPOINTS.DELETE_CONTACT}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
