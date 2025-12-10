const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ResidenceService {
  // Get unique blocks for a specific site
  async getBlocksBySiteId(siteId) {
    try {
      const blocks = await prisma.blocks.findMany({
        where: {
          site_id: parseInt(siteId)
        },
        select: {
          id: true,
          block_name: true
        },
        orderBy: {
          block_name: 'asc'
        }
      });

      // Return array of block objects with id and name
      return blocks;
    } catch (error) {
      throw new Error(`Failed to fetch blocks: ${error.message}`);
    }
  }

  // Get all residents for a specific site
  async getResidentsBySiteId(siteId) {
    try {
      const residents = await prisma.users.findMany({
        where: {
          siteId: parseInt(siteId),
          account_status: 'ACTIVE',
          deleted_at: null
        },
        select: {
          id: true,
          full_name: true,
          block_id: true,
          apartment_no: true,
          phone_number: true,
          resident_count: true,
          plates: true,
          resident_type: true,
          created_at: true,
          blocks: {
            select: {
              id: true,
              block_name: true
            }
          }
        },
        orderBy: [
          { block_id: 'asc' },
          { apartment_no: 'asc' }
        ]
      });

      // Map to include block_name at root level
      return residents.map(r => ({
        ...r,
        block_name: r.blocks?.block_name || null
      }));
    } catch (error) {
      throw new Error(`Failed to fetch residents: ${error.message}`);
    }
  }

  // Get a single resident by ID
  async getResidentById(id) {
    try {
      const resident = await prisma.users.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          full_name: true,
          block_id: true,
          apartment_no: true,
          phone_number: true,
          resident_count: true,
          plates: true,
          resident_type: true,
          siteId: true,
          created_at: true,
          updated_at: true,
          blocks: {
            select: {
              id: true,
              block_name: true
            }
          }
        }
      });

      if (!resident) return null;

      return {
        ...resident,
        block_name: resident.blocks?.block_name || null
      };
    } catch (error) {
      throw new Error(`Failed to fetch resident: ${error.message}`);
    }
  }

  // Create a new resident
  async createResident(data) {
    try {
      let blockId = data.block_id;
      
      // If block_name is provided instead of block_id, find or create the block
      if (data.block_name && !blockId) {
        let block = await prisma.blocks.findFirst({
          where: {
            site_id: data.siteId,
            block_name: data.block_name
          }
        });
        
        // If block doesn't exist, create it
        if (!block) {
          block = await prisma.blocks.create({
            data: {
              block_name: data.block_name,
              site_id: data.siteId
            }
          });
        }
        
        blockId = block.id;
      }
      
      const resident = await prisma.users.create({
        data: {
          full_name: data.full_name,
          phone_number: data.phone_number,
          password: data.password || 'defaultPassword123',
          block_id: blockId ? parseInt(blockId) : null,
          apartment_no: data.apartment_no,
          siteId: data.siteId,
          resident_count: data.resident_count || 1,
          plates: data.plates,
          resident_type: data.resident_type,
          updated_at: new Date()
        },
        select: {
          id: true,
          full_name: true,
          block_id: true,
          apartment_no: true,
          phone_number: true,
          resident_count: true,
          plates: true,
          resident_type: true,
          blocks: {
            select: {
              id: true,
              block_name: true
            }
          }
        }
      });

      return {
        ...resident,
        block_name: resident.blocks?.block_name || null
      };
    } catch (error) {
      throw new Error(`Failed to create resident: ${error.message}`);
    }
  }

  // Update a resident
  async updateResident(id, data) {
    try {
      const updateData = {
        updated_at: new Date()
      };

      // Handle block_name conversion to block_id
      if (data.block_name) {
        const resident = await prisma.users.findUnique({
          where: { id: parseInt(id) },
          select: { siteId: true }
        });
        
        if (resident) {
          let block = await prisma.blocks.findFirst({
            where: {
              site_id: resident.siteId,
              block_name: data.block_name
            }
          });
          
          if (!block) {
            block = await prisma.blocks.create({
              data: {
                block_name: data.block_name,
                site_id: resident.siteId
              }
            });
          }
          
          updateData.block_id = block.id;
        }
      } else if (data.block_id) {
        updateData.block_id = parseInt(data.block_id);
      }

      if (data.full_name) updateData.full_name = data.full_name;
      if (data.phone_number) updateData.phone_number = data.phone_number;
      if (data.apartment_no) updateData.apartment_no = data.apartment_no;
      if (data.resident_count) updateData.resident_count = parseInt(data.resident_count);
      if (data.plates !== undefined) updateData.plates = data.plates;
      if (data.resident_type) updateData.resident_type = data.resident_type;

      const resident = await prisma.users.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          full_name: true,
          block_id: true,
          apartment_no: true,
          phone_number: true,
          resident_count: true,
          plates: true,
          resident_type: true,
          blocks: {
            select: {
              id: true,
              block_name: true
            }
          }
        }
      });

      return {
        ...resident,
        block_name: resident.blocks?.block_name || null
      };
    } catch (error) {
      throw new Error(`Failed to update resident: ${error.message}`);
    }
  }

  // Delete a resident (soft delete)
  async deleteResident(id) {
    try {
      const resident = await prisma.users.update({
        where: { id: parseInt(id) },
        data: {
          deleted_at: new Date(),
          account_status: 'DELETED',
          updated_at: new Date()
        }
      });

      return resident;
    } catch (error) {
      throw new Error(`Failed to delete resident: ${error.message}`);
    }
  }
}

module.exports = new ResidenceService();
