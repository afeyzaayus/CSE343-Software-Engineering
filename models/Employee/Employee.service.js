import Employee from "../models/Employee.model.js";

class EmployeeService {
    constructor() {
        this.employees = [];
        this.nextId = 1;
    }

    // Employee Management

    createEmployee(fullName, email, password, role = "staff", assignedSite = null) {
        // Check if email already exists
        if (this.findEmployeeByEmail(email)) {
            throw new Error('Employee with this email already exists');
        }

        const newEmployee = new Employee(
            this.nextId++,
            fullName,
            email,
            password,
            role,
            assignedSite
        );
        
        this.employees.push(newEmployee);
        return newEmployee;
    }

    findEmployeeById(id) {
        return this.employees.find(employee => employee.id === id);
    }

    findEmployeeByEmail(email) {
        return this.employees.find(employee => 
            employee.email.toLowerCase() === email.toLowerCase()
        );
    }

    updateEmployee(id, updateData) {
        const employee = this.findEmployeeById(id);
        if (!employee) {
            throw new Error('Employee not found');
        }

        // Check if email is being changed and if it's already taken
        if (updateData.email && updateData.email !== employee.email) {
            const existingEmployee = this.findEmployeeByEmail(updateData.email);
            if (existingEmployee) {
                throw new Error('Email already taken by another employee');
            }
        }

        // Update employee fields
        Object.keys(updateData).forEach(key => {
            if (key !== 'id' && employee.hasOwnProperty(key)) {
                employee[key] = updateData[key];
            }
        });

        return employee;
    }

    deleteEmployee(id, requestingEmployee) {
        const employee = this.findEmployeeById(id);
        if (!employee) {
            throw new Error('Employee not found');
        }

        // Authorization check - only admins can delete employees
        if (requestingEmployee.role !== 'admin') {
            throw new Error('Only admins can delete employees');
        }

        // Prevent self-deletion
        if (employee.id === requestingEmployee.id) {
            throw new Error('Cannot delete your own account');
        }

        const index = this.employees.findIndex(emp => emp.id === id);
        return this.employees.splice(index, 1)[0];
    }

    // Authentication and Authorization

    authenticateEmployee(email, password) {
        const employee = this.findEmployeeByEmail(email);
        if (employee && employee.password === password) {
            return employee;
        }
        return null;
    }

    changePassword(employeeId, currentPassword, newPassword) {
        const employee = this.findEmployeeById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        if (employee.password !== currentPassword) {
            throw new Error('Current password is incorrect');
        }

        employee.password = newPassword;
        return employee;
    }

    resetPassword(employeeId, newPassword, requestingEmployee) {
        const employee = this.findEmployeeById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        // Only admins or the employee themselves can reset password
        if (requestingEmployee.role !== 'admin' && requestingEmployee.id !== employeeId) {
            throw new Error('Not authorized to reset this password');
        }

        employee.password = newPassword;
        return employee;
    }

    // Role and Permission Management

    promoteEmployee(employeeId, newRole, requestingEmployee) {
        if (requestingEmployee.role !== 'admin') {
            throw new Error('Only admins can promote employees');
        }

        const validRoles = ['staff', 'manager', 'admin'];
        if (!validRoles.includes(newRole)) {
            throw new Error('Invalid role');
        }

        const employee = this.findEmployeeById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        employee.role = newRole;
        return employee;
    }

    demoteEmployee(employeeId, newRole, requestingEmployee) {
        if (requestingEmployee.role !== 'admin') {
            throw new Error('Only admins can demote employees');
        }

        const employee = this.findEmployeeById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        // Prevent self-demotion from admin
        if (employeeId === requestingEmployee.id && employee.role === 'admin') {
            throw new Error('Cannot demote yourself from admin role');
        }

        employee.role = newRole;
        return employee;
    }

    assignToSite(employeeId, site, requestingEmployee) {
        if (requestingEmployee.role !== 'admin' && requestingEmployee.role !== 'manager') {
            throw new Error('Not authorized to assign employees to sites');
        }

        const employee = this.findEmployeeById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        employee.assignedSite = site;
        return employee;
    }

    unassignFromSite(employeeId, requestingEmployee) {
        if (requestingEmployee.role !== 'admin' && requestingEmployee.role !== 'manager') {
            throw new Error('Not authorized to unassign employees from sites');
        }

        const employee = this.findEmployeeById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        employee.assignedSite = null;
        return employee;
    }

    // Filtering and Search

    getEmployeesByRole(role) {
        return this.employees.filter(employee => employee.role === role);
    }

    getEmployeesBySite(siteId) {
        return this.employees.filter(employee => 
            employee.assignedSite && employee.assignedSite.id === siteId
        );
    }

    getUnassignedEmployees() {
        return this.employees.filter(employee => !employee.assignedSite);
    }

    searchEmployees(query) {
        const searchTerm = query.toLowerCase();
        return this.employees.filter(employee => 
            employee.fullName.toLowerCase().includes(searchTerm) ||
            employee.email.toLowerCase().includes(searchTerm) ||
            (employee.assignedSite && employee.assignedSite.name.toLowerCase().includes(searchTerm))
        );
    }

    getActiveEmployees() {
        return this.employees; // In a real app, you might have an 'active' field
    }

    // Reports and Statistics

    getEmployeeStatistics() {
        const totalEmployees = this.employees.length;
        const roleCounts = {
            admin: this.getEmployeesByRole('admin').length,
            manager: this.getEmployeesByRole('manager').length,
            staff: this.getEmployeesByRole('staff').length
        };

        const assignedEmployees = this.employees.filter(emp => emp.assignedSite).length;
        const unassignedEmployees = totalEmployees - assignedEmployees;

        return {
            totalEmployees,
            roleDistribution: roleCounts,
            assignedEmployees,
            unassignedEmployees,
            assignmentRate: totalEmployees > 0 ? (assignedEmployees / totalEmployees) * 100 : 0
        };
    }

    getSiteEmployeeSummary(siteId) {
        const siteEmployees = this.getEmployeesBySite(siteId);
        const roleCounts = {
            admin: siteEmployees.filter(emp => emp.role === 'admin').length,
            manager: siteEmployees.filter(emp => emp.role === 'manager').length,
            staff: siteEmployees.filter(emp => emp.role === 'staff').length
        };

        return {
            siteId,
            totalEmployees: siteEmployees.length,
            roleDistribution: roleCounts,
            employees: siteEmployees.map(emp => emp.getEmployeeInfo())
        };
    }

    getRoleCapabilities(role) {
        const capabilities = {
            admin: {
                canCreateAnnouncement: true,
                canEditAllAnnouncements: true,
                canDeleteAnnouncement: true,
                canManageEmployees: true,
                canAssignSites: true,
                canViewAllData: true
            },
            manager: {
                canCreateAnnouncement: true,
                canEditAllAnnouncements: false,
                canDeleteAnnouncement: true,
                canManageEmployees: false,
                canAssignSites: true,
                canViewAllData: false
            },
            staff: {
                canCreateAnnouncement: false,
                canEditAllAnnouncements: false,
                canDeleteAnnouncement: false,
                canManageEmployees: false,
                canAssignSites: false,
                canViewAllData: false
            }
        };

        return capabilities[role] || capabilities.staff;
    }

    // Bulk Operations

    bulkAssignToSite(employeeIds, site, requestingEmployee) {
        if (requestingEmployee.role !== 'admin' && requestingEmployee.role !== 'manager') {
            throw new Error('Not authorized to assign employees to sites');
        }

        const results = [];
        employeeIds.forEach(employeeId => {
            try {
                const employee = this.assignToSite(employeeId, site, requestingEmployee);
                results.push({ employeeId, success: true, employee });
            } catch (error) {
                results.push({ employeeId, success: false, error: error.message });
            }
        });
        return results;
    }

    bulkUpdateRoles(employeeIds, newRole, requestingEmployee) {
        if (requestingEmployee.role !== 'admin') {
            throw new Error('Only admins can update roles in bulk');
        }

        const results = [];
        employeeIds.forEach(employeeId => {
            try {
                const employee = this.promoteEmployee(employeeId, newRole, requestingEmployee);
                results.push({ employeeId, success: true, employee });
            } catch (error) {
                results.push({ employeeId, success: false, error: error.message });
            }
        });
        return results;
    }

    // Data Export

    exportEmployees(format = 'json') {
        const employeesData = this.employees.map(employee => 
            employee.getEmployeeInfo()
        );

        if (format === 'json') {
            return JSON.stringify(employeesData, null, 2);
        }

        return employeesData;
    }

    getAllEmployeesWithDetails() {
        return this.employees.map(employee => employee.getEmployeeInfo());
    }

    // Validation and Utilities

    validateEmployeeData(employeeData) {
        const requiredFields = ['fullName', 'email', 'password'];
        const missingFields = requiredFields.filter(field => !employeeData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        if (employeeData.email && !this.isValidEmail(employeeData.email)) {
            throw new Error('Invalid email format');
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Get employees with specific capabilities
    getEmployeesWithCapability(capability) {
        return this.employees.filter(employee => {
            const capabilities = this.getRoleCapabilities(employee.role);
            return capabilities[capability];
        });
    }
}

export default new EmployeeService();