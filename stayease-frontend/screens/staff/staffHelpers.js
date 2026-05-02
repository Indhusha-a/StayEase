import { SERVER_URL } from '../../utils/api';

export const roles = ['Receptionist', 'Housekeeper', 'Manager', 'Security', 'Chef'];
export const shifts = ['Morning', 'Evening', 'Night'];

export const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const imageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${SERVER_URL}/${cleanPath}`;
};

export const formatDate = (dateValue) => {
  if (!dateValue) return 'Not set';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString();
};

export const toDateInput = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export const photoUploadUrl = (staffId) => `${SERVER_URL}/api/staff/${staffId}/photo`;
