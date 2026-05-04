import React, { useState } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../utils/api';
import paymentStyles from './paymentStyles';

// ---------------------------------------------------------------------------
// inferMimeType
// ---------------------------------------------------------------------------
// DocumentPicker on some Android devices returns a generic MIME type like
// 'application/octet-stream' instead of the real type. This helper derives
// the correct MIME from the file extension as a reliable fallback.
// Used when building the FormData object for native (non-web) uploads.
// ---------------------------------------------------------------------------
const inferMimeType = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'pdf') return 'application/pdf';
  return 'application/octet-stream'; // safe default if extension is unrecognised
};

// 5MB cap — matches the limit enforced by Multer on the server side.
// Checked client-side first so we can show an error before wasting a network call.
const MAX_SLIP_SIZE_BYTES = 5 * 1024 * 1024;

// ---------------------------------------------------------------------------
// normalizeNativeUri
// ---------------------------------------------------------------------------
// React Native's fetch and FormData require a URI that starts with 'file://'
// or 'content://'. On some Android versions DocumentPicker returns a bare
// path without a scheme. This function adds 'file://' when missing so the
// upload request doesn't silently fail on those devices.
// ---------------------------------------------------------------------------
const normalizeNativeUri = (uri = '') => {
  if (!uri) return uri;
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return `file://${uri}`;
};

// ---------------------------------------------------------------------------
// uploadSlipRequest
// ---------------------------------------------------------------------------
// Sends the FormData (containing the slip file) to POST /payments/upload-slip.
// Uses raw fetch instead of the shared api axios instance because axios does
// not reliably set the multipart/form-data boundary header on React Native —
// fetch handles this automatically.
//
// Auth: reads the JWT from AsyncStorage and attaches it as a Bearer token.
//       The header is omitted entirely if no token is found (avoids sending
//       'Authorization: Bearer null').
//
// Response handling: the server returns JSON on both success and error, but
// we defensively check the Content-Type header first. If the body is not
// JSON (e.g. an unexpected proxy error page) we still surface a message.
//
// Returns the parsed payload on success ({ slipUrl, fileName }).
// Throws an Error with the server's message on non-2xx responses.
// ---------------------------------------------------------------------------
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
    // Non-JSON body — wrap the raw text so callers always see a { message } shape
    const textPayload = await response.text();
    payload = textPayload ? { message: textPayload } : {};
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Upload failed (${response.status})`);
  }

  return payload;
};

// ---------------------------------------------------------------------------
// BankTransferForm
// ---------------------------------------------------------------------------
// Renders the file-picker UI for bank transfer slip uploads.
// This component is stateless with respect to the uploaded URL — it calls
// onUploadSuccess and lets the parent (PaymentScreen) own slipUrl/slipFileName
// so that submitPayment() can read them when the guest finally hits submit.
//
// Props:
//   slipUrl              — Cloudinary URL of the currently uploaded slip
//                          (empty string if nothing uploaded yet). Used to
//                          toggle the status row and upload box label.
//   slipFileName         — Original filename shown in the upload box subtitle.
//   onUploadSuccess      — Called with { slipUrl, fileName } after a successful
//                          Cloudinary upload. Parent stores these in state.
//   onClearSlip          — Called when the guest taps "Clear". Parent resets
//                          slipUrl and slipFileName to empty strings.
//   onUploadingStateChange — Called with true/false whenever uploading state
//                            changes. Parent uses this to disable its own
//                            Submit Payment button while upload is in flight.
// ---------------------------------------------------------------------------
export default function BankTransferForm({
  slipUrl,
  slipFileName,
  onUploadSuccess,
  onClearSlip,
  onUploadingStateChange,
}) {
  // Local uploading flag — drives the spinner on the Upload Slip button and
  // disables it to prevent duplicate uploads mid-flight.
  const [uploading, setUploading] = useState(false);

  // Inline error message shown below the button (e.g. file too large, network error).
  const [error, setError] = useState('');

  // ---------------------------------------------------------------------------
  // setUploadingState
  // Keeps local `uploading` state and the parent's disabled flag in sync with
  // a single call. Using a wrapper avoids repeating the two-liner everywhere.
  // ---------------------------------------------------------------------------
  const setUploadingState = (value) => {
    setUploading(value);
    onUploadingStateChange?.(value); // optional chaining — safe if prop not passed
  };

  // ---------------------------------------------------------------------------
  // pickAndUploadSlip
  // Main handler for the "Upload Slip" button. Orchestrates the full flow:
  //   1. Open the device file picker (JPG, PNG, PDF only)
  //   2. Validate file size client-side (≤ 5MB)
  //   3. Build a multipart FormData payload (platform-specific — see below)
  //   4. POST to /payments/upload-slip via uploadSlipRequest()
  //   5. Call onUploadSuccess() with the Cloudinary URL on success
  //   6. Surface any error inline, always reset uploading state in finally
  // ---------------------------------------------------------------------------
  const pickAndUploadSlip = async () => {
    try {
      setError(''); // clear any previous error before a new attempt

      // ── Step 1: Open file picker ────────────────────────────────────────
      // copyToCacheDirectory: true ensures the file is accessible via a
      // local URI on iOS, where the picker may return a cloud iCloud path.
      // multiple: false — only one slip per payment.
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      // User dismissed the picker without selecting a file — do nothing.
      if (result.canceled) return;

      // expo-document-picker v2+ returns results inside assets[].
      const file = result.assets?.[0];
      if (!file?.uri) {
        setError('No file selected.');
        return;
      }

      // ── Step 2: Client-side size check ──────────────────────────────────
      // file.size may be undefined on some pickers (e.g. iOS iCloud files
      // before download). We only block if the size is known and over the cap.
      if (file.size && file.size > MAX_SLIP_SIZE_BYTES) {
        setError('Slip must be 5MB or smaller.');
        return;
      }

      // Lock the button and notify parent to disable Submit Payment.
      setUploadingState(true);

      // ── Step 3: Build FormData (platform-specific) ──────────────────────
      const formData = new FormData();

      if (Platform.OS === 'web') {
        // ── Web branch ──────────────────────────────────────────────────
        // On Expo Web, Multer (the server-side file handler) expects a real
        // browser File object — not a blob with a separate filename string.
        // DocumentPicker exposes the native File via file.file (expo SDK) or
        // result.output[0] (standard web FileList). We try both.
        const webFile = file.file || result.output?.[0];
        if (webFile) {
          formData.append('slip', webFile, webFile.name || file.name || `slip-${Date.now()}`);
        } else {
          // Last-resort fallback: fetch the data URI and convert to a Blob.
          // Less efficient but handles edge cases where the File object is
          // not exposed by the picker (e.g. older browser environments).
          const response = await fetch(file.uri);
          const blob = await response.blob();
          formData.append('slip', blob, file.name || `slip-${Date.now()}`);
        }
      } else {
        // ── Native branch (iOS / Android) ───────────────────────────────
        // React Native's FormData accepts a plain object with { uri, name, type }
        // instead of a real File. The fetch polyfill reads `uri` as a file path.
        // normalizeNativeUri() ensures the URI has a scheme so fetch can open it.
        const normalizedUri = normalizeNativeUri(file.uri);
        formData.append('slip', {
          uri: normalizedUri,
          name: file.name || `slip-${Date.now()}`,
          // Prefer the picker-reported MIME; fall back to extension inference
          // for devices that return a generic type.
          type: file.mimeType || inferMimeType(file.name),
        });
      }

      // ── Step 4: Upload to server → Cloudinary ───────────────────────────
      const payload = await uploadSlipRequest(formData);

      // ── Step 5: Notify parent with the Cloudinary URL ───────────────────
      // Parent (PaymentScreen) stores slipUrl so submitPayment() can include
      // it in the POST /payments body when the guest hits Submit Payment.
      onUploadSuccess?.({
        slipUrl: payload?.slipUrl || '',
        fileName: payload?.fileName || file.name || 'Uploaded slip',
      });

    } catch (err) {
      // ── Step 6: Surface upload errors inline ────────────────────────────
      // Covers network failures, Cloudinary errors, and server 4xx/5xx.
      setError(err?.message || 'Unable to upload slip. Try again.');
    } finally {
      // Always re-enable the button and notify parent — even if upload failed.
      setUploadingState(false);
    }
  };

  return (
    <View style={paymentStyles.methodFormSection}>
      <Text style={paymentStyles.methodFormTitle}>Upload Transfer Slip</Text>
      <Text style={paymentStyles.methodFormHint}>Accepted: JPG, PNG, PDF (up to 5MB)</Text>

      {/*
       * Upload status box
       * Shows "No slip uploaded yet" / "Slip uploaded" based on whether slipUrl
       * is populated. slipFileName shows the original filename once uploaded.
       */}
      <View style={paymentStyles.uploadBox}>
        <Text style={paymentStyles.uploadTitle}>
          {slipUrl ? 'Slip uploaded' : 'No slip uploaded yet'}
        </Text>
        <Text style={paymentStyles.uploadMeta}>
          {slipFileName || 'Select a transfer slip from your device.'}
        </Text>
      </View>

      {/*
       * Upload Slip button
       * Disabled and shows a spinner while uploading is true.
       * Once upload succeeds, the button remains active so the guest can
       * replace the slip by uploading again (previous slipUrl is overwritten
       * via onUploadSuccess in the parent).
       */}
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

      {/*
       * Success row — only rendered after a successful upload (slipUrl is set).
       * "Clear" calls onClearSlip() in the parent, which resets slipUrl and
       * slipFileName to empty strings, hiding this row and reverting the upload
       * box back to "No slip uploaded yet".
       */}
      {slipUrl ? (
        <View style={paymentStyles.uploadStatusRow}>
          <Text style={paymentStyles.uploadSuccessText}>Uploaded successfully</Text>
          <TouchableOpacity onPress={onClearSlip} activeOpacity={0.8}>
            <Text style={paymentStyles.uploadClearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/*
       * Inline error message — shown when any step of pickAndUploadSlip fails
       * (file too large, picker error, network failure, server rejection).
       * Cleared at the start of each new upload attempt.
       */}
      {error ? <Text style={paymentStyles.fieldError}>{error}</Text> : null}
    </View>
  );
}