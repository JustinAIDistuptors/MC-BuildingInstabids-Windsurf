/**
 * Represents a geographic location with latitude and longitude.
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/**
 * Represents a user's address.
 */
export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  geoLocation?: GeoLocation;
}

/**
 * Represents a user in the system.
 */
export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  username?: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  lastLoginAt?: string; // ISO 8601 timestamp
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  emailVerified: boolean;
  phoneVerified?: boolean;
  avatarUrl?: string;
  timezone: string;
  locale: string;
  metadata?: Record<string, any>; // Extensible metadata
}

/**
 * Represents a user's role in the system.
 */
export interface UserType {
  userId: string;
  type: 'homeowner' | 'contractor' | 'property_manager' | 'admin' | 'labor_helper';
  isPrimary: boolean;
}

/**
 * Represents a user's authentication session.
 */
export interface UserAuth {
  userId: string;
  refreshToken?: string;
  tokenExpiresAt?: string; // ISO 8601 timestamp
  deviceInfo?: Record<string, any>;
  ipAddress?: string;
  lastUsedAt: string; // ISO 8601 timestamp
  revoked: boolean;
}

/**
 * Represents a user's notification preferences.
 */
export interface UserNotificationPreferences {
  userId: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  notificationType: string; // e.g., 'bid_updates', 'messages', 'payments'
  enabled: boolean;
}

/**
 * Represents a job category.
 */
export interface JobCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  parentCategoryId?: string;
}

/**
 * Represents a specific type of job within a category.
 */
export interface JobType {
  id: string;
  categoryId: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  estimatedDurationDays?: number;
  complexityLevel?: 'simple' | 'moderate' | 'complex';
}

/**
 * Represents a system setting.
 */
export interface SystemSetting {
  settingKey: string;
  settingValue: any;
  description?: string;
  isPublic: boolean;
}

/**
 * Represents a tag for categorizing content.
 */
export interface Tag {
  id: string;
  name: string;
  category: string;
}

/**
 * Represents a feature flag for controlling feature availability.
 */
export interface FeatureFlag {
  flagKey: string;
  description?: string;
  enabled: boolean;
  userGroupFilters?: Record<string, any>;
  percentageRollout?: number;
}

/**
 * Represents an audit log entry.
 */
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  changeData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string; // ISO 8601 timestamp
}
