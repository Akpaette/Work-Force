import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-key-change-in-production';

/**
 * Enhanced Security Module for Church Staff Database
 * Implements proper password hashing and data encryption
 */
export class SecurityManager {
  
  /**
   * Hash password using bcrypt with salt
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Encrypt sensitive data (emergency contacts, spouse info)
   */
  static encryptSensitiveData(data: string): string {
    if (!data) return data;
    
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  static decryptSensitiveData(encryptedData: string): string {
    if (!encryptedData) return encryptedData;
    
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Return original if decryption fails
    }
  }

  /**
   * Generate secure session token
   */
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize sensitive fields before storage
   */
  static sanitizeStaffData(staffData: any) {
    const sensitiveFields = [
      'emergencyContactPhone',
      'emergencyContactEmail', 
      'spousePhone',
      'spouseEmail',
      'guarantorPhone',
      'guarantorEmail',
      'guarantorAddress'
    ];

    const sanitized = { ...staffData };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = this.encryptSensitiveData(sanitized[field]);
      }
    });

    return sanitized;
  }

  /**
   * Decrypt sensitive fields after retrieval
   */
  static decryptStaffData(staffData: any) {
    const sensitiveFields = [
      'emergencyContactPhone',
      'emergencyContactEmail',
      'spousePhone', 
      'spouseEmail',
      'guarantorPhone',
      'guarantorEmail',
      'guarantorAddress'
    ];

    const decrypted = { ...staffData };
    
    sensitiveFields.forEach(field => {
      if (decrypted[field]) {
        decrypted[field] = this.decryptSensitiveData(decrypted[field]);
      }
    });

    return decrypted;
  }
}

export default SecurityManager;
