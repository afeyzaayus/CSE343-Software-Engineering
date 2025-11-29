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
} from './modules/auth/service/userAuth.service.js';

export {
  forgotUserPasswordService,
  resetUserPasswordService,
  forgotAdminPasswordService,
  resetAdminPasswordService,
  setNewPasswordService,
  changeUserPasswordService,
  changeAdminPasswordService
} from './modules/auth/service/passwordReset.service.js';
export {
  registerIndividualService,
  registerCompanyManagerService,
  verifyEmailService,
  loginAdminService
} from './modules/auth/service/adminAuth.service.js';

// Company Services
export {
  getCompanyByManagerService,
  updateCompanyService,
  getCompanyEmployeesService
} from './modules/company/service/company.service.js';

export {
  createEmployeeInvitationService,
  acceptEmployeeInvitationService,
  getCompanyInvitationsService
} from './modules//company/service/invitation.service.js';

// Site Services
export {
  generateBlockNames,
  createBlocksForSite,
  getBlocksBySiteService,
  updateBlockService,
  deleteBlockService,
  recreateBlocksForSite
} from './modules/site/service/block.service.js';

export {
  createSiteService,
  updateSiteService,
  getSitesService,
  getSiteByIdService,
  deleteSiteService
} from './modules/site/service/site.service.js';

// Account Services
export {
  getAllAccountsService,
  updateAccountStatusService,
  getDashboardStatsService,
  getAccountByIdService,
  updateAccountProfileService
} from './modules/account/account.service.js';