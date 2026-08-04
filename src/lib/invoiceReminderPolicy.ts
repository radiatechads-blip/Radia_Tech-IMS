export type ReminderType = 'before3' | 'due' | 'after3' | 'after7' | 'manual';

export function shouldSkipReminderSend({
  type,
  existingReminder,
}: {
  type: ReminderType;
  existingReminder: unknown;
}) {
  return Boolean(existingReminder) && type !== 'manual';
}
