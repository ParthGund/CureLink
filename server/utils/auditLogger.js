const AuditLog = require('../models/AuditLog');

/**
 * Log a sensitive security or medical record action.
 * Fails silently so audit logging never interrupts core business operations.
 *
 * @param {object} logData
 * @param {string} logData.action - Action name (e.g. 'CONSULTATION_COMPLETED')
 * @param {object} [logData.user] - req.user (performer)
 * @param {string} [logData.role] - Performer role
 * @param {string} [logData.targetUser] - User ID affected
 * @param {string} [logData.resourceType] - Model or entity name
 * @param {string} [logData.resourceId] - Entity ID
 * @param {string} [logData.ipAddress] - Request IP
 * @param {object} [logData.details] - Arbitrary additional details
 */
async function recordAudit({
  action,
  user,
  role,
  targetUser,
  resourceType,
  resourceId,
  ipAddress,
  details,
}) {
  try {
    await AuditLog.create({
      action,
      performedBy: user?._id || user?.id,
      role: role || user?.role || 'anonymous',
      targetUser,
      resourceType,
      resourceId,
      ipAddress,
      details,
    });
  } catch (err) {
    // Audit logging failure must never fail the transaction or user request
    console.warn(`[AuditLog] Failed to record audit log for action ${action}:`, err.message);
  }
}

module.exports = { recordAudit };
