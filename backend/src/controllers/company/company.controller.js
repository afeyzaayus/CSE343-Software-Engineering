import {
  getCompanyByManagerService,
  updateCompanyService,
  getCompanyEmployeesService
} from '../../services/index.js';

/**
 * Şirket yöneticisinin şirket bilgilerini getir
 * GET /api/company
 */
export async function getCompanyByManager(req, res) {
  try {
    const managerId = req.admin.id;
    const company = await getCompanyByManagerService(managerId);

    return res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Get company error:', error);

    if (error.message.startsWith('AUTH_ERROR:')) {
      return res.status(403).json({
        success: false,
        message: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    if (error.message.startsWith('COMPANY_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('COMPANY_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Şirket bilgileri getirilirken bir hata oluştu.'
    });
  }
}

/**
 * Şirket bilgilerini güncelle
 * PUT /api/company
 */
export async function updateCompany(req, res) {
  try {
    const managerId = req.admin.id;
    const updateData = req.body;

    const result = await updateCompanyService(managerId, updateData);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.company
    });
  } catch (error) {
    console.error('Update company error:', error);

    if (error.message.startsWith('AUTH_ERROR:')) {
      return res.status(403).json({
        success: false,
        message: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    if (error.message.startsWith('COMPANY_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('COMPANY_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Şirket bilgileri güncellenirken bir hata oluştu.'
    });
  }
}

/**
 * Şirket çalışanlarını listele
 * GET /api/company/employees
 */
export async function getCompanyEmployees(req, res) {
  try {
    const managerId = req.admin.id;
    const employees = await getCompanyEmployeesService(managerId);

    return res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Get company employees error:', error);

    if (error.message.startsWith('AUTH_ERROR:')) {
      return res.status(403).json({
        success: false,
        message: error.message.replace('AUTH_ERROR: ', '')
      });
    }

    if (error.message.startsWith('COMPANY_ERROR:')) {
      return res.status(404).json({
        success: false,
        message: error.message.replace('COMPANY_ERROR: ', '')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Şirket çalışanları listelenirken bir hata oluştu.'
    });
  }
}