import React, { useState } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../utils/api';
import paymentStyles from './paymentStyles';

const inferMimeType = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
};

const MAX_SLIP_SIZE_BYTES = 5 * 1024 * 1024;

const normalizeNativeUri = (uri = '') => {
  if (!uri) return uri;
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return `file://${uri}`;
};

const uploadSlipRequest = async (formData) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${API_URL}/payments/upload-slip`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const contentType = response.headers.get('content-type') || '';
  let payload = null;

  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    const textPayload = await response.text();
    payload = textPayload ? { message: textPayload } : {};
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Upload failed (${response.status})`);
  }

  return payload;
};

export default function BankTransferForm({
  slipUrl,
  slipFileName,
  onUploadSuccess,
  onClearSlip,
  onUploadingStateChange,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const setUploadingState = (value) => {
    setUploading(value);
    onUploadingStateChange?.(value);
  };

  const pickAndUploadSlip = async () => {
    try {
      setError('');

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file?.uri) {
        setError('No file selected.');
        return;
      }

      if (file.size && file.size > MAX_SLIP_SIZE_BYTES) {
        setError('Slip must be 5MB or smaller.');
        return;
      }

      setUploadingState(true);

      const formData = new FormData();

      if (Platform.OS === 'web') {
        // Expo Web provides a native File object. Multer requires this on web uploads.
        const webFile = file.file || result.output?.[0];
        if (webFile) {
          formData.append('slip', webFile, webFile.name || file.name || `slip-${Date.now()}`);
        } else {
          // Fallback for environments where picker doesn't expose the native File object.
          const response = await fetch(file.uri);
          const blob = await response.blob();
          formData.append('slip', blob, file.name || `slip-${Date.now()}`);
        }
      } else {
        const normalizedUri = normalizeNativeUri(file.uri);
        formData.append('slip', {
          uri: normalizedUri,
          name: file.name || `slip-${Date.now()}`,
          type: file.mimeType || inferMimeType(file.name),
        });
      }

      const payload = await uploadSlipRequest(formData);

      onUploadSuccess?.({
        slipUrl: payload?.slipUrl || '',
        fileName: payload?.fileName || file.name || 'Uploaded slip',
      });
    } catch (err) {
      setError(err?.message || 'Unable to upload slip. Try again.');
    } finally {
      setUploadingState(false);
    }
  };

  return (
    <View style={paymentStyles.methodFormSection}>
      <Text style={paymentStyles.methodFormTitle}>Upload Transfer Slip</Text>
      <Text style={paymentStyles.methodFormHint}>Accepted: JPG, PNG, PDF (up to 5MB)</Text>

      <View style={paymentStyles.uploadBox}>
        <Text style={paymentStyles.uploadTitle}>
          {slipUrl ? 'Slip uploaded' : 'No slip uploaded yet'}
        </Text>
        <Text style={paymentStyles.uploadMeta}>
          {slipFileName || 'Select a transfer slip from your device.'}
        </Text>
      </View>

      <TouchableOpacity
        style={[paymentStyles.button, uploading && paymentStyles.buttonDisabled]}
        onPress={pickAndUploadSlip}
        disabled={uploading}
        activeOpacity={0.85}
      >
        {uploading ? (
          <View style={paymentStyles.processingRow}>
            <ActivityIndicator color="#fff" />
            <Text style={paymentStyles.processingText}>Uploading slip...</Text>
          </View>
        ) : (
          <Text style={paymentStyles.buttonText}>Upload Slip</Text>
        )}
      </TouchableOpacity>

      {slipUrl ? (
        <View style={paymentStyles.uploadStatusRow}>
          <Text style={paymentStyles.uploadSuccessText}>Uploaded successfully</Text>
          <TouchableOpacity onPress={onClearSlip} activeOpacity={0.8}>
            <Text style={paymentStyles.uploadClearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? <Text style={paymentStyles.fieldError}>{error}</Text> : null}
    </View>
  );
}
