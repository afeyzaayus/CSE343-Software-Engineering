import {
  getCompanyByManagerService,
  updateCompanyService,
  getCompanyEmployeesService,
  suspendEmployeeService,
  activateEmployeeService,
  deleteEmployeeService
} from '../../../index.js';

/**
 * Şirket bilgilerini getir
 * @route GET /api/company
 */
export const getCompanyByManager = async (req, res) => {
  try {
    const managerId = req.admin?.id;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        error: "AUTH_ERROR: Manager ID bulunamadı"
      });
    }

    const company = await getCompanyByManagerService(managerId);

    return res.status(200).json({
      success: true,
      message: 'Şirket bilgileri başarıyla getirildi.',
      data: company
    });

  } catch (error) {
    console.error('❌ getCompanyByManager controller hatası:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Şirket bilgileri getirilirken hata oluştu.'
    });
  }
};


/**
 * Şirket bilgilerini güncelle
 * @route PUT /api/company
 */
export const updateCompany = async (req, res) => {
  try {
    const managerId = req.admin?.id;
    const { company_name, company_address } = req.body;

    if (!company_name && !company_address) {
      return res.status(400).json({
        success: false,
        error: 'En az bir alan güncellenmelidir'
      });
    }

    const result = await updateCompanyService(managerId, { company_name, company_address });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.company
    });

  } catch (error) {
    console.error('❌ updateCompany controller hatası:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Şirket güncellenirken bir hata oluştu.'
    });
  }
};


/**
 * Şirket çalışanlarını getir
 * @route GET /api/company/employees
 */
export const getCompanyEmployees = async (req, res) => {
  try {
    console.log("🚀 getCompanyEmployees çalıştı");
    const managerId = req.admin?.id;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        error: "AUTH_ERROR: Manager ID bulunamadı"
      });
    }

    const result = await getCompanyEmployeesService(managerId);

    return res.status(200).json({
      success: true,
      data: {
        company: result.company,
        employees: result.employees,
        total: result.total
      }
    });

  } catch (error) {
    console.error("❌ getCompanyEmployees hata:", error);

    return res.status(500).json({
      success: false,
      error: "Çalışanlar getirilirken bir hata oluştu.",
      details: error.message
    });
  }
};


/**
 * Çalışanı askıya al
 * @route PUT /api/company/employees/:id/suspend
 */
export const suspendEmployee = async (req, res) => {
  try {
    const managerId = req.admin?.id;
    const employeeId = Number(req.params.id);

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz çalışan ID'
      });
    }

    const result = await suspendEmployeeService(managerId, employeeId);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.employee
    });

  } catch (error) {
    console.error('❌ suspendEmployee controller hatası:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Çalışan askıya alınırken bir hata oluştu'
    });
  }
};


/**
 * Çalışanı aktif et
 * @route PUT /api/company/employees/:id/activate
 */
export const activateEmployee = async (req, res) => {
  try {
    const managerId = req.admin?.id;
    const employeeId = Number(req.params.id);

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz çalışan ID'
      });
    }

    const result = await activateEmployeeService(managerId, employeeId);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.employee
    });

  } catch (error) {
    console.error('❌ activateEmployee controller hatası:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Çalışan aktif edilirken hata oluştu'
    });
  }
};


/**
 * Çalışanı sil
 * @route DELETE /api/company/employees/:id
 */
export const deleteEmployee = async (req, res) => {
  try {
    const managerId = req.admin?.id;
    const employeeId = Number(req.params.id);

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz çalışan ID'
      });
    }

    const result = await deleteEmployeeService(managerId, employeeId);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.employee
    });

  } catch (error) {
    console.error('❌ deleteEmployee controller hatası:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Çalışan silinirken bir hata oluştu'
    });
  }
};
