import { SERVER_URL } from '../../utils/api';

export const complaintTypes = ['Complaint', 'Maintenance', 'Housekeeping'];
export const priorities = ['Low', 'Medium', 'High', 'Urgent'];
export const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

export const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const imageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${SERVER_URL}/${cleanPath}`;
};

export const evidenceUploadUrl = (complaintId) => `${SERVER_URL}/api/complaints/${complaintId}/image`;

export const formatDate = (dateValue) => {
  if (!dateValue) return 'Not set';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString();
};

export const statusColor = (status) => {
  if (status === 'Open') return '#DC2626';
  if (status === 'In Progress') return '#F59E0B';
  if (status === 'Resolved') return '#059669';
  if (status === 'Closed') return '#4B5563';
  return '#6B7280';
};

export const priorityColor = (priority) => {
  if (priority === 'Urgent') return '#B91C1C';
  if (priority === 'High') return '#EA580C';
  if (priority === 'Medium') return '#CA8A04';
  return '#2563EB';
};

export const roomLabel = (room) => {
  if (!room) return 'No room selected';
  return `Room ${room.roomNumber || ''}${room.roomType ? ` - ${room.roomType}` : ''}`.trim();
};
