// services/index.js

// Shared Services
export {
  transporter,
  sendIndividualVerificationEmail,
  sendCompanyManagerVerificationEmail,
  sendEmployeeInvitationEmail,
  sendPasswordResetEmail
} from './shared/email.service.js';

export {
  twilioClient,
  sendPasswordSetupCode,
  sendPasswordResetCode
} from './shared/sms.service.js';

export {
  validatePhoneNumber,
  validatePassword,
  validatePasswordMatch,
  validateSiteId,
  validateCompanyCode,
  validateAccountStatus
} from './shared/validation.service.js';

// Auth Services
export {
  initiatePasswordSetupService,
  setPasswordWithCodeService,
  loginUserService
} from './auth/userAuth.service.js';

export {
  forgotUserPasswordService,
  resetUserPasswordService,
  forgotAdminPasswordService,
  resetAdminPasswordService,
  setNewPasswordService
} from './auth/passwordReset.service.js';

export {
  registerIndividualService,
  registerCompanyManagerService,
  verifyEmailService,
  loginAdminService
} from './auth/adminAuth.service.js';

// Company Services
export {
  getCompanyByManagerService,
  updateCompanyService,
  getCompanyEmployeesService
} from './company/company.service.js';

export {
  createEmployeeInvitationService,
  acceptEmployeeInvitationService,
  getCompanyInvitationsService
} from './company/invitation.service.js';

// Site Services
export {
  generateBlockNames,
  createBlocksForSite,
  getBlocksBySiteService,
  updateBlockService,
  deleteBlockService,
  recreateBlocksForSite
} from './site/block.service.js';

export {
  createSiteService,
  updateSiteService,
  getSitesService,
  getSiteByIdService,
  deleteSiteService
} from './site/site.service.js';

// Account Services
export {
  getAllAccountsService,
  updateAccountStatusService,
  getDashboardStatsService,
  getAccountByIdService,
  updateAccountProfileService
} from './account/account.service.js';