// services/index.js

// Shared Services
export {
  sendEmail,
  sendIndividualVerificationEmail,
  sendCompanyManagerVerificationEmail,
  sendEmployeeInvitationEmail,
  sendPasswordResetEmail
} from './shared/email.service.js';

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
  getCompanyEmployeesService,
  suspendEmployeeService,
  activateEmployeeService,
  deleteEmployeeService
} from './modules/company/service/company.service.js';

export {
  createEmployeeInvitationService,
  acceptEmployeeInvitationService,
  getCompanyInvitationsService,
  deleteInvitationService,
  verifyEmployeeInvitationService 
} from './modules//company/service/invitation.service.js';

// Site Services
export {
  createSiteService,
  updateSiteService,
  getSitesService,
  getSiteByIdService,
  deleteSiteService
} from './modules/site/site.service.js';