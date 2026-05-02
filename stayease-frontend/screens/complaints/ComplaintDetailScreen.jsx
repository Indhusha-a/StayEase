import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Animated, Image, TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import api, { SERVER_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  'Open': { bg: '#FEE2E2', text: '#DC2626', icon: '🔴' },
  'In Progress': { bg: '#FEF3C7', text: '#D97706', icon: '🟡' },
  'Resolved': { bg: '#D1FAE5', text: '#059669', icon: '🟢' },
  'Closed': { bg: '#F3F4F6', text: '#6B7280', icon: '⚫' },
};

const PRIORITY_COLORS = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
  Urgent: '#7C3AED',
};

const TYPE_ICONS = {
  Complaint: '⚠️',
  Maintenance: '🔧',
  Housekeeping: '🧹',
};

const InfoRow = ({ label, value, valueStyle }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueStyle]}>{value || '—'}</Text>
  </View>
);

const ComplaintDetailScreen = ({ route, navigation }) => {
  const { complaintId } = route.params;
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('Low');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchComplaint();
  }, [complaintId]);

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${complaintId}`);
      // Backend returns { success, complaint }
      setComplaint(res.data.complaint);
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    } catch (err) {
      console.error('Fetch complaint error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to load complaint.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const isOwner = () => {
    if (!complaint || !complaint.reportedBy || !user || !user._id) return false;
    // Handle both populated and non-populated reportedBy
    const reporterId = complaint.reportedBy._id || complaint.reportedBy;
    if (!reporterId) return false;
    return String(reporterId) === String(user._id);
  };

  const handleEdit = () => {
    setEditTitle(complaint.title);
    setEditDescription(complaint.description);
    setEditPriority(complaint.priority);
    setEditModalVisible(true);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Complaint',
      'Are you sure you want to delete this complaint? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/complaints/${complaintId}`);
              Alert.alert('Success', 'Complaint deleted successfully.');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete complaint.');
            }
          },
        },
      ]
    );
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      Alert.alert('Validation Error', 'Title and description are required.');
      return;
    }

    try {
      await api.put(`/complaints/${complaintId}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
      });
      Alert.alert('Success', 'Complaint updated successfully.');
      setEditModalVisible(false);
      fetchComplaint(); // Refresh data
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update complaint.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Loading complaint…</Text>
      </View>
    );
  }

  if (!complaint) return null;

  const statusStyle = STATUS_COLORS[complaint.status] || STATUS_COLORS['Open'];
  const priorityColor = PRIORITY_COLORS[complaint.priority] || '#6B7280';
  const imageUri = complaint.evidenceImage
    ? `${SERVER_URL}/${complaint.evidenceImage.replace(/\\/g, '/')}`
    : null;

  const submittedBy = complaint.reportedBy?.name || 'Unknown';
  const formattedDate = new Date(complaint.createdAt).toLocaleString('en-US', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const resolvedAt = complaint.resolvedAt
    ? new Date(complaint.resolvedAt).toLocaleString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    : null;

  const canEdit = isOwner() && complaint.status === 'Open';
  const canDelete = isOwner() && complaint.status === 'Open';

  return (
    <Animated.ScrollView
      style={[styles.container, { opacity: fadeAnim }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Action buttons for owner */}
      {(canEdit || canDelete) && (
        <View style={styles.actionButtons}>
          {canEdit && (
            <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Type + status hero */}
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroIcon}>{TYPE_ICONS[complaint.type] || '📋'}</Text>
          <View>
            <Text style={styles.heroType}>{complaint.type}</Text>
            <Text style={styles.heroId}>#{complaint._id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={styles.statusBadgeIcon}>{statusStyle.icon}</Text>
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{complaint.status}</Text>
        </View>
      </View>

      {/* Priority banner */}
      <View style={[styles.priorityBanner, { backgroundColor: priorityColor + '18', borderLeftColor: priorityColor }]}>
        <Text style={[styles.priorityText, { color: priorityColor }]}>
          🎯 {complaint.priority} Priority
        </Text>
      </View>

      {/* Title & description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.complaintTitle}>{complaint.title}</Text>
        <Text style={styles.complaintDesc}>{complaint.description}</Text>
      </View>

      {/* Meta info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Information</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Submitted by" value={submittedBy} />
          <InfoRow label="Date submitted" value={formattedDate} />
          {complaint.roomId && (
            <InfoRow
              label="Room"
              value={`Room ${complaint.roomId.roomNumber} · ${complaint.roomId.roomType}`}
            />
          )}
          {complaint.assignedTo && (
            <InfoRow label="Assigned to" value={complaint.assignedTo} valueStyle={{ color: '#6366F1', fontWeight: '700' }} />
          )}
          {resolvedAt && (
            <InfoRow label="Resolved at" value={resolvedAt} valueStyle={{ color: '#059669' }} />
          )}
        </View>
      </View>

      {/* Evidence image */}
      {imageUri && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidence Photo</Text>
          <Image
            source={{ uri: imageUri }}
            style={styles.evidenceImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Timeline tracker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Timeline</Text>
        <View style={styles.timeline}>
          {['Open', 'In Progress', 'Resolved', 'Closed'].map((s, i) => {
            const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
            const currentIdx = statuses.indexOf(complaint.status);
            const isPast = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <View key={s} style={styles.timelineStep}>
                <View style={[
                  styles.timelineDot,
                  isCurrent && styles.timelineDotCurrent,
                  isPast && styles.timelineDotPast,
                ]}>
                  {(isPast || isCurrent) && <Text style={styles.timelineCheck}>{isPast ? '✓' : '●'}</Text>}
                </View>
                {i < 3 && <View style={[styles.timelineLine, isPast && styles.timelineLinePast]} />}
                <Text style={[
                  styles.timelineLabel,
                  isCurrent && styles.timelineLabelCurrent,
                  isPast && styles.timelineLabelPast,
                ]}>{s}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Admin update hint */}
      {user?.role !== 'admin' && complaint.status === 'Open' && (
        <View style={styles.tipBox}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Our team has been notified and will update the status shortly. You'll see progress here.
          </Text>
        </View>
      )}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Complaint</Text>

            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              style={styles.modalInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter complaint title"
              multiline
            />

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Describe the issue in detail"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.modalLabel}>Priority</Text>
            <View style={styles.priorityOptions}>
              {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    editPriority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }
                  ]}
                  onPress={() => setEditPriority(p)}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    editPriority === p && { color: '#fff' }
                  ]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={saveEdit}
              >
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.ScrollView>
  );
};

export default ComplaintDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },

  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editBtnText: { color: '#1D4ED8', fontWeight: '700', fontSize: 14 },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },

  hero: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1D4ED8', borderRadius: 16, padding: 18, marginBottom: 12,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { fontSize: 32 },
  heroType: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroId: { fontSize: 12, color: '#BFDBFE', marginTop: 2 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  statusBadgeIcon: { fontSize: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },

  priorityBanner: {
    borderLeftWidth: 4, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 16,
  },
  priorityText: { fontSize: 13, fontWeight: '700' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  complaintTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  complaintDesc: { fontSize: 14, color: '#4B5563', lineHeight: 22 },

  infoCard: {
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 13, color: '#9CA3AF', flex: 1 },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 2, textAlign: 'right' },

  evidenceImage: {
    width: '100%', height: 220, borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },

  timeline: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  timelineStep: { alignItems: 'center', flex: 1, position: 'relative' },
  timelineDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#D1D5DB', marginBottom: 6,
  },
  timelineDotCurrent: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  timelineDotPast: { backgroundColor: '#10B981', borderColor: '#10B981' },
  timelineCheck: { color: '#fff', fontSize: 11, fontWeight: '800' },
  timelineLine: {
    position: 'absolute', top: 13, left: '55%', right: '-45%',
    height: 2, backgroundColor: '#E5E7EB',
  },
  timelineLinePast: { backgroundColor: '#10B981' },
  timelineLabel: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', fontWeight: '600' },
  timelineLabelCurrent: { color: '#1D4ED8', fontWeight: '800' },
  timelineLabelPast: { color: '#10B981' },

  tipBox: {
    flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, gap: 10,
  },
  tipIcon: { fontSize: 18 },
  tipText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 19 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  priorityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  priorityOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 14,
  },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});