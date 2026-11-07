import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#4C6EF5',
  primarySoft: '#EDF2FF',
  income: '#2BB673',
  expense: '#F25C54',
  text: '#1C2033',
  textSecondary: '#6B7285',
  textMuted: '#A3A9B8',
  border: '#ECEEF3',
  bg: '#F5F6FA',
  card: '#FFFFFF',
};

export const radius = { sm: 8, md: 12, lg: 20 };

export const shadow = StyleSheet.create({
  card: {
    shadowColor: '#1C2033',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
}).card;

export const numberFont = { fontVariant: ['tabular-nums' as const] };
