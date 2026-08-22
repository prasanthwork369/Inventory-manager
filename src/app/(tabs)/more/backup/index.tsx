import React from 'react';
import { DatabaseBackup } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function BackupRestore() {
  return <DevPlaceholderScreen title="Backup & data" icon={<DatabaseBackup size={28} color={colors.brand[600]} />} />;
}
