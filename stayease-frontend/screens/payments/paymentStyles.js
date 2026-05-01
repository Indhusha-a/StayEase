import { StyleSheet } from 'react-native';

const paymentStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.08)',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
    color: '#111827',
  },
  fieldWrapper: {
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  inputReadonly: {
    backgroundColor: '#EEF2FF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 24,
  },
  pill: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  pillActive: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
  },
  pillText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#1D4ED8',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default paymentStyles;
