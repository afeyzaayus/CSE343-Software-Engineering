import Site from "./Site.model.js";
import Apartment from "../Apartment/Apartment.model.js";

class SiteService {
    constructor() {
        this.sites = [];
        this.nextId = 1;
        this.nextApartmentId = 1;
    }

    // Site Management

    createSite(name, securityCode) {
        const newSite = new Site(
            this.nextId++,
            name,
            securityCode
        );
        
        if (!newSite.isValid()) {
            throw new Error('Invalid site data');
        }
        
        this.sites.push(newSite);
        return newSite;
    }

    findSiteById(id) {
        return this.sites.find(site => site.id === id);
    }

    findSiteByName(name) {
        return this.sites.find(site => 
            site.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    findSiteBySecurityCode(securityCode) {
        return this.sites.find(site => site.securityCode === securityCode);
    }

    updateSite(id, updateData) {
        const site = this.findSiteById(id);
        if (!site) {
            throw new Error('Site not found');
        }

        Object.keys(updateData).forEach(key => {
            if (key !== 'id' && site.hasOwnProperty(key)) {
                site[key] = updateData[key];
            }
        });

        return site;
    }

    deleteSite(id) {
        const site = this.findSiteById(id);
        if (!site) {
            throw new Error('Site not found');
        }

        const index = this.sites.findIndex(s => s.id === id);
        return this.sites.splice(index, 1)[0];
    }

    deactivateSite(id) {
        const site = this.findSiteById(id);
        if (site) {
            site.isActive = false;
            return site;
        }
        return null;
    }

    activateSite(id) {
        const site = this.findSiteById(id);
        if (site) {
            site.isActive = true;
            return site;
        }
        return null;
    }

    // Apartment Management

    addApartment(siteId, number, block, floor, capacity = 4) {
        const site = this.findSiteById(siteId);
        if (!site) {
            throw new Error('Site not found');
        }

        // Check if apartment number already exists in this site
        const existingApartment = site.getApartmentByNumber(number);
        if (existingApartment) {
            throw new Error('Apartment number already exists in this site');
        }

        const newApartment = new Apartment(
            this.nextApartmentId++,
            number,
            block,
            floor,
            null,
            0,
            capacity
        );

        if (!newApartment.isValid()) {
            throw new Error('Invalid apartment data');
        }

        site.apartments.push(newApartment);
        return newApartment;
    }

    assignResidentToApartment(siteId, apartmentNumber, resident) {
        const site = this.findSiteById(siteId);
        if (!site) {
            throw new Error('Site not found');
        }

        const apartment = site.getApartmentByNumber(apartmentNumber);
        if (!apartment) {
            throw new Error('Apartment not found');
        }

        if (apartment.isOccupied) {
            throw new Error('Apartment is already occupied');
        }

        apartment.assignResident(resident);
        return apartment;
    }

    removeResidentFromApartment(siteId, apartmentNumber) {
        const site = this.findSiteById(siteId);
        if (!site) {
            throw new Error('Site not found');
        }

        const apartment = site.getApartmentByNumber(apartmentNumber);
        if (!apartment) {
            throw new Error('Apartment not found');
        }

        apartment.removeResident();
        return apartment;
    }

    getApartment(siteId, apartmentNumber) {
        const site = this.findSiteById(siteId);
        return site ? site.getApartmentByNumber(apartmentNumber) : null;
    }

    // Resource Management

    addSocialFacility(siteId, socialFacility) {
        const site = this.findSiteById(siteId);
        if (site) {
            site.socialFacilities.push(socialFacility);
            return site;
        }
        return null;
    }

    addAnnouncement(siteId, announcement) {
        const site = this.findSiteById(siteId);
        if (site) {
            site.announcements.push(announcement);
            return site;
        }
        return null;
    }

    addMaintenanceRequest(siteId, maintenanceRequest) {
        const site = this.findSiteById(siteId);
        if (site) {
            site.maintenanceRequests.push(maintenanceRequest);
            return site;
        }
        return null;
    }

    addFee(siteId, fee) {
        const site = this.findSiteById(siteId);
        if (site) {
            site.fees.push(fee);
            return site;
        }
        return null;
    }

    // Filtering and Search

    getActiveSites() {
        return this.sites.filter(site => site.isActive);
    }

    getSitesByCapacity(minCapacity) {
        return this.sites.filter(site => 
            site.getTotalCapacity() >= minCapacity
        );
    }

    getSitesWithVacancies() {
        return this.sites.filter(site => site.getVacancyRate() > 0);
    }

    getSitesWithHighOccupancy(threshold = 80) {
        return this.sites.filter(site => 
            site.getOccupancyPercentage() >= threshold
        );
    }

    searchSites(query) {
        const searchTerm = query.toLowerCase();
        return this.sites.filter(site => 
            site.name.toLowerCase().includes(searchTerm) ||
            site.securityCode.toLowerCase().includes(searchTerm)
        );
    }

    // Statistics and Reports

    getOverallStatistics() {
        const totalSites = this.sites.length;
        const activeSites = this.getActiveSites().length;
        const totalApartments = this.sites.reduce((sum, site) => sum + site.apartments.length, 0);
        const totalResidents = this.sites.reduce((sum, site) => sum + site.calculatePopulation(), 0);
        const totalCapacity = this.sites.reduce((sum, site) => sum + site.getTotalCapacity(), 0);

        const totalRevenue = this.sites.reduce((sum, site) => 
            sum + site.calculateCollectedFee(), 0
        );

        const totalOutstanding = this.sites.reduce((sum, site) => 
            sum + site.getTotalOutstandingAmount(), 0
        );

        const averageOccupancy = totalSites > 0 ? 
            this.sites.reduce((sum, site) => sum + site.getOccupancyPercentage(), 0) / totalSites : 0;

        return {
            totalSites,
            activeSites,
            totalApartments,
            totalResidents,
            totalCapacity,
            totalRevenue,
            totalOutstanding,
            averageOccupancy: Math.round(averageOccupancy * 100) / 100,
            overallOccupancyRate: totalCapacity > 0 ? (totalResidents / totalCapacity) * 100 : 0
        };
    }

    getSitePerformanceReport(siteId) {
        const site = this.findSiteById(siteId);
        if (!site) return null;

        const statistics = site.getSiteStatistics();
        const monthlyRevenue = {};
        
        // Calculate revenue for last 6 months
        const months = ['January', 'February', 'March', 'April', 'May', 'June'];
        months.forEach(month => {
            monthlyRevenue[month] = site.getMonthlyRevenue(month);
        });

        return {
            site: site.getSiteDetails(),
            statistics,
            monthlyRevenue,
            performance: {
                financialHealth: statistics.collectionRate > 80 ? 'good' : statistics.collectionRate > 60 ? 'fair' : 'poor',
                occupancyHealth: statistics.vacancyRate < 10 ? 'good' : statistics.vacancyRate < 30 ? 'fair' : 'poor',
                maintenanceHealth: statistics.activeMaintenanceRequests < 5 ? 'good' : statistics.activeMaintenanceRequests < 15 ? 'fair' : 'poor'
            }
        };
    }

    getComparativeAnalysis() {
        const sitesData = this.sites.map(site => ({
            name: site.name,
            statistics: site.getSiteStatistics(),
            details: site.getSiteDetails()
        }));

        // Sort by collection rate (best first)
        sitesData.sort((a, b) => b.statistics.collectionRate - a.statistics.collectionRate);

        return {
            bestPerforming: sitesData[0],
            worstPerforming: sitesData[sitesData.length - 1],
            averageCollectionRate: sitesData.reduce((sum, site) => sum + site.statistics.collectionRate, 0) / sitesData.length,
            averageOccupancy: sitesData.reduce((sum, site) => sum + (100 - site.statistics.vacancyRate), 0) / sitesData.length,
            sites: sitesData
        };
    }

    // Bulk Operations

    bulkAddApartments(siteId, apartmentsData) {
        const site = this.findSiteById(siteId);
        if (!site) {
            throw new Error('Site not found');
        }

        const results = [];
        apartmentsData.forEach(aptData => {
            try {
                const apartment = this.addApartment(
                    siteId, 
                    aptData.number, 
                    aptData.block, 
                    aptData.floor, 
                    aptData.capacity
                );
                results.push({ apartment: aptData.number, success: true, data: apartment });
            } catch (error) {
                results.push({ apartment: aptData.number, success: false, error: error.message });
            }
        });

        return results;
    }

    bulkUpdateSiteStatus(siteIds, isActive) {
        const results = [];
        siteIds.forEach(siteId => {
            try {
                const site = isActive ? this.activateSite(siteId) : this.deactivateSite(siteId);
                results.push({ siteId, success: !!site, site });
            } catch (error) {
                results.push({ siteId, success: false, error: error.message });
            }
        });
        return results;
    }

    // Data Management

    exportSiteData(siteId, format = 'json') {
        const site = this.findSiteById(siteId);
        if (!site) return null;

        const siteData = {
            ...site.getSiteDetails(),
            apartments: site.apartments.map(apt => apt.getApartmentDetails()),
            socialFacilities: site.socialFacilities.map(facility => facility.getFacilityDetails()),
            statistics: site.getSiteStatistics()
        };

        if (format === 'json') {
            return JSON.stringify(siteData, null, 2);
        }

        return siteData;
    }

    getAllSitesWithDetails() {
        return this.sites.map(site => site.getSiteDetails());
    }

    getSiteWithFullDetails(siteId) {
        const site = this.findSiteById(siteId);
        if (!site) return null;

        return {
            ...site.getSiteDetails(),
            apartments: site.apartments.map(apt => apt.getApartmentDetails()),
            socialFacilities: site.socialFacilities.map(facility => facility.getFacilityDetails()),
            announcements: site.announcements.map(ann => ann.getAnnouncementDetails()),
            maintenanceRequests: site.maintenanceRequests.map(req => req.getDetails()),
            fees: site.fees.map(fee => fee.getDetails())
        };
    }

    // Validation and Utilities

    validateSiteData(siteData) {
        const requiredFields = ['name', 'securityCode'];
        const missingFields = requiredFields.filter(field => !siteData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        if (siteData.securityCode && siteData.securityCode.length < 3) {
            throw new Error('Security code must be at least 3 characters long');
        }

        return true;
    }

    // Search across all sites
    globalSearch(query) {
        const searchTerm = query.toLowerCase();
        const results = {
            sites: [],
            apartments: [],
            residents: []
        };

        this.sites.forEach(site => {
            // Search in site name and security code
            if (site.name.toLowerCase().includes(searchTerm) || 
                site.securityCode.toLowerCase().includes(searchTerm)) {
                results.sites.push(site.getSiteDetails());
            }

            // Search in apartments
            site.apartments.forEach(apartment => {
                if (apartment.number.toLowerCase().includes(searchTerm) ||
                    apartment.block.toLowerCase().includes(searchTerm)) {
                    results.apartments.push({
                        site: site.name,
                        ...apartment.getApartmentDetails()
                    });
                }
            });

            // Search in residents
            site.apartments.forEach(apartment => {
                if (apartment.resident && 
                    (apartment.resident.fullName.toLowerCase().includes(searchTerm) ||
                     apartment.resident.email.toLowerCase().includes(searchTerm))) {
                    results.residents.push({
                        site: site.name,
                        apartment: apartment.number,
                        resident: apartment.resident
                    });
                }
            });
        });

        return results;
    }
}

export default new SiteService();