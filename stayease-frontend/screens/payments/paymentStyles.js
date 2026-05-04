import { StyleSheet } from 'react-native';

// ---------------------------------------------------------------------------
// Shared payment palette
// ---------------------------------------------------------------------------
// Centralizes the visual tokens used by the guest payment flow, history list,
// receipt screen, and revenue summary cards.
// ---------------------------------------------------------------------------
const PRIMARY = '#0037b0';
const PRIMARY_CONT = '#1d4ed8';
const ON_PRI_CONT = '#cad3ff';
const SURFACE = '#faf8ff';
const SURF_CONT_LOW = '#f3f2fe';
const ON_SURFACE = '#1a1b23';
const ON_VARIANT = '#434655';
const OUTLINE = '#747686';
const OUTLINE_VAR = '#c4c5d7';
const SURF_VAR = '#e2e1ed';
const WHITE = '#ffffff';

// ---------------------------------------------------------------------------
// paymentStyles
// ---------------------------------------------------------------------------
// Shared style module for the payment feature.
// ---------------------------------------------------------------------------
const paymentStyles = StyleSheet.create({
  // Screen-level wrappers
  container: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SURFACE,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },

  // Page heading block
  header: {
    marginBottom: 20,
    gap: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: ON_SURFACE,
    letterSpacing: -0.72,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    color: ON_VARIANT,
    lineHeight: 24,
  },

  // Decorative hero/stat banner
  heroPanel: {
    backgroundColor: ON_PRI_CONT,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroCircle2: {
    position: 'absolute',
    bottom: -36,
    left: -36,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: PRIMARY,
    opacity: 0.8,
    marginBottom: 6,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  heroSubValue: {
    fontSize: 14,
    color: PRIMARY,
    opacity: 0.85,
    marginTop: 4,
    lineHeight: 20,
  },

  // Shared white card surface
  card: {
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: OUTLINE_VAR,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: ON_VARIANT,
    marginBottom: 12,
  },

  // Basic label/value text helpers
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: ON_VARIANT,
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
    color: ON_SURFACE,
    fontWeight: '500',
  },
  valueStrong: {
    fontSize: 16,
    color: ON_SURFACE,
    fontWeight: '700',
  },
  mutedValue: {
    fontSize: 13,
    color: ON_VARIANT,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 10,
  },
  rowBlock: {
    flex: 1,
    minWidth: 0,
  },
  divider: {
    height: 1,
    backgroundColor: SURF_VAR,
    marginVertical: 10,
  },

  // Form controls
  fieldWrapper: {
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: OUTLINE_VAR,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: ON_SURFACE,
    backgroundColor: SURFACE,
  },
  inputReadonly: {
    backgroundColor: '#eef2ff',
    color: PRIMARY,
    fontWeight: '700',
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 15,
  },

  // Compact pill controls kept for smaller selection patterns
  pillGroup: {
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: OUTLINE_VAR,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: WHITE,
  },
  pillActive: {
    borderColor: 'transparent',
    backgroundColor: ON_PRI_CONT,
  },
  pillText: {
    fontSize: 14,
    color: ON_VARIANT,
    fontWeight: '600',
  },
  pillTextActive: {
    color: PRIMARY_CONT,
  },

  // Payment-method chooser cards
  methodCards: {
    gap: 10,
  },
  methodCard: {
    borderWidth: 1,
    borderColor: OUTLINE_VAR,
    borderRadius: 12,
    padding: 12,
    backgroundColor: WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodCardActive: {
    borderColor: 'transparent',
    backgroundColor: ON_PRI_CONT,
  },
  methodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: OUTLINE_VAR,
  },
  methodIconWrapActive: {
    backgroundColor: WHITE,
    borderColor: 'transparent',
  },
  methodTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  methodTitleActive: {
    color: PRIMARY,
  },
  methodHint: {
    marginTop: 3,
    fontSize: 12,
    color: ON_VARIANT,
  },
  methodHintActive: {
    color: PRIMARY,
    opacity: 0.8,
  },

  // Child form containers used by OnlinePayForm / BankTransferForm
  methodFormSection: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: SURF_VAR,
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 12,
  },
  methodFormTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  methodFormHint: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 12,
    color: ON_VARIANT,
    lineHeight: 18,
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardMetaBlock: {
    flex: 1,
  },
  fieldError: {
    marginTop: 2,
    marginBottom: 8,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 15,
  },

  // Slip-upload status widgets
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: OUTLINE_VAR,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: WHITE,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ON_SURFACE,
    marginBottom: 4,
  },
  uploadMeta: {
    fontSize: 12,
    color: ON_VARIANT,
    lineHeight: 18,
  },
  uploadStatusRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  uploadClearText: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
  },

  // Shared badges and empty-state styles
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  emptyText: {
    fontSize: 14,
    color: OUTLINE,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Payment history list-card styles
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  listCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ON_SURFACE,
    letterSpacing: -0.3,
  },
  listCardSubtitle: {
    fontSize: 13,
    color: ON_VARIANT,
    marginTop: 4,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: ON_VARIANT,
  },

  // Revenue summary and notes blocks
  amountCardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  summaryGrid: {
    gap: 12,
  },
  notesBox: {
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: SURF_VAR,
  },
  statsBanner: {
    backgroundColor: ON_PRI_CONT,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statsBlock: {
    flex: 1,
    gap: 4,
  },
  statsDivider: {
    width: 0.5,
    height: 60,
    backgroundColor: PRIMARY,
    opacity: 0.2,
  },
});

export default paymentStyles;
