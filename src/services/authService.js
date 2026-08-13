import { apiService } from "../config/api";
import API from "../config/api";

// Login API
export const login = async (credentials) => {
  const formData = new FormData();
  for (const key in credentials) {
    formData.append(key, credentials[key]);
  }
  const res = await apiService.post(`${API.ENDPOINTS.login}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data; // { token, user }
};

// Get profile
export const getProfile = async (token) => {
  const res = await apiService.get(API.ENDPOINTS.PROFILE, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.user;
};

// Update profile
export const updateUserProfile = async (token, profileData) => {
  const formData = new FormData();

  // Append all fields except profileImage and companyLogo
  Object.keys(profileData).forEach((key) => {
    if (key !== "profileImage" && key !== "companyLogo") {
      formData.append(key, profileData[key]);
    }
  });

  // Handle profileImage
  if (profileData.profileImage) {
    if (typeof profileData.profileImage !== "string") {
      formData.append("profileImage", profileData.profileImage);
    } else {

    }
  }

  // Handle companyLogo
  if (profileData.companyLogo) {
    if (typeof profileData.companyLogo !== "string") {
      formData.append("companyLogo", profileData.companyLogo);
    } else {

    }
  }

  const res = await apiService.post(API.ENDPOINTS.UPDATE, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

// Change password
export const changePassword = async (token, passwordData) => {
  const formData = new FormData();
  for (const key in passwordData) {
    formData.append(key, passwordData[key]);
  }
  const res = await apiService.put(API.ENDPOINTS.CHANGE_PASSWORD, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
