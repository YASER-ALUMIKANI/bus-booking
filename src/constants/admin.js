export const VALID_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled'
};

export const STATUS_COLORS = {
  [VALID_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-800',
  [VALID_STATUSES.CONFIRMED]: 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800',
  [VALID_STATUSES.CANCELLED]: 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800'
};

export const STATUS_LABELS = {
  [VALID_STATUSES.PENDING]: 'معلق',
  [VALID_STATUSES.CONFIRMED]: 'مؤكد',
  [VALID_STATUSES.CANCELLED]: 'ملغي'
};

export const ROLE_TYPES = {
  MANAGER: 'manager',
  EMPLOYEE: 'employee'
};

export const DB_PAGE_SIZE = 10;
