import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class ResidenceService {
  // Get site by site_id (string code)
  async getSiteByCode(siteCode) {
    try {
      const site = await prisma.site.findUnique({
        where: { site_id: siteCode },
        select: { id: true, site_id: true, site_name: true }
      });
      return site;
    } catch (error) {
      throw new Error(`Failed to fetch site: ${error.message}`);
    }
  }

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
      const residents = await prisma.user.findMany({
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
      const resident = await prisma.user.findUnique({
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
      console.log('🔧 [SERVICE] Creating resident with data:', JSON.stringify(data, null, 2));
      
      // Remove id field if it exists (should be auto-generated)
      const { id, ...dataWithoutId } = data;
      if (id) {
        console.log('  - WARNING: Removing id field:', id);
      }
      
      let blockId = dataWithoutId.block_id;
      
      // If block_name is provided instead of block_id, find or create the block
      if (dataWithoutId.block_name && !blockId) {
        console.log('  - Looking for block:', dataWithoutId.block_name, 'in site:', dataWithoutId.siteId);
        let block = await prisma.blocks.findFirst({
          where: {
            site_id: dataWithoutId.siteId,
            block_name: dataWithoutId.block_name
          }
        });
        
        // If block doesn't exist, create it
        if (!block) {
          console.log('  - Block not found, creating new block:', dataWithoutId.block_name);
          block = await prisma.blocks.create({
            data: {
              block_name: dataWithoutId.block_name,
              site_id: dataWithoutId.siteId
            }
          });
          console.log('  - Block created with ID:', block.id);
        } else {
          console.log('  - Block found with ID:', block.id);
        }
        
        blockId = block.id;
      }
      
      console.log('  - Creating user in database with:');
      console.log('    * full_name:', dataWithoutId.full_name);
      console.log('    * phone_number:', dataWithoutId.phone_number);
      console.log('    * block_id:', blockId);
      console.log('    * apartment_no:', dataWithoutId.apartment_no);
      console.log('    * siteId:', dataWithoutId.siteId);
      console.log('    * resident_type:', dataWithoutId.resident_type);
      
      // Validate and normalize resident_type
      let residentType = dataWithoutId.resident_type;
      if (residentType === 'active' || residentType === 'HIRER') {
        residentType = 'HIRER';
      } else if (residentType === 'inactive' || residentType === 'OWNER') {
        residentType = 'OWNER';
      } else {
        residentType = 'OWNER'; // Default
      }
      console.log('    * normalized resident_type:', residentType);
        
      // Check if phone number already exists
      const existingUser = await prisma.user.findUnique({
        where: { phone_number: dataWithoutId.phone_number }
      });
      
      if (existingUser) {
        throw new Error(`Bu telefon numarası zaten kayıtlı: ${dataWithoutId.phone_number}`);
      }
      
      // Reset sequence if needed (fix for id constraint issues)
      try {
        await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"public"."users"', 'id'), COALESCE((SELECT MAX(id) FROM "public"."users"), 1), true)`;
        console.log('  - Database sequence reset successfully');
      } catch (seqError) {
        console.log('  - Sequence reset skipped:', seqError.message);
      }
      
      const resident = await prisma.user.create({
        data: {
          full_name: dataWithoutId.full_name,
          phone_number: dataWithoutId.phone_number,
          password: dataWithoutId.password || 'defaultPassword123',
          block_id: blockId ? parseInt(blockId) : null,
          apartment_no: dataWithoutId.apartment_no,
          siteId: dataWithoutId.siteId,
          resident_count: dataWithoutId.resident_count || 1,
          plates: dataWithoutId.plates,
          resident_type: residentType,
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
        const resident = await prisma.user.findUnique({
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

      const resident = await prisma.user.update({
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
      const resident = await prisma.user.update({
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

  // Create a new block
  async createBlock(siteId, blockData) {
    try {
      const { block_name, apartment_count, description } = blockData;

      // Validation
      if (!block_name) {
        throw new Error('Blok adı gerekli');
      }

      if (!apartment_count || apartment_count < 1) {
        throw new Error('Daire sayısı gerekli ve 1\'den büyük olmalı');
      }

      // Check if block name already exists for this site
      const existingBlock = await prisma.blocks.findFirst({
        where: {
          site_id: parseInt(siteId),
          block_name: block_name,
          deleted_at: null
        }
      });

      if (existingBlock) {
        throw new Error('Bu isimde bir blok zaten mevcut');
      }

      // Create block with apartment_count
      const block = await prisma.blocks.create({
        data: {
          block_name: block_name.trim(),
          apartment_count: parseInt(apartment_count),
          site_id: parseInt(siteId),
          created_at: new Date(),
          updated_at: new Date()
        },
        select: {
          id: true,
          block_name: true,
          apartment_count: true,
          site_id: true,
          created_at: true
        }
      });

      console.log(`✅ [CREATE BLOCK] Block "${block_name}" created with ${apartment_count} apartments for site ${siteId}`);
      
      return block;
    } catch (error) {
      console.error('❌ [CREATE BLOCK] Error:', error.message);
      throw new Error(`Blok oluşturulamadı: ${error.message}`);
    }
  }

  // Get block statistics for a site
  async getBlockStats(siteId) {
    try {
      const blocks = await prisma.blocks.findMany({
        where: {
          site_id: parseInt(siteId),
          deleted_at: null
        },
        include: {
          users: {
            where: {
              deleted_at: null,
              account_status: 'ACTIVE'
            }
          }
        }
      });

      return blocks.map(block => ({
        id: block.id,
        block_name: block.block_name,
        apartment_count: block.users.length,
        resident_count: block.users.reduce((sum, user) => sum + (user.resident_count || 1), 0)
      }));
    } catch (error) {
      throw new Error(`Failed to fetch block stats: ${error.message}`);
    }
  }

  // Delete a block (soft delete - also soft deletes all users in that block)
  async deleteBlock(blockId) {
    try {
      const block = await prisma.blocks.findUnique({
        where: { id: parseInt(blockId) },
        include: {
          users: {
            where: { deleted_at: null }
          }
        }
      });

      if (!block) {
        throw new Error('Blok bulunamadı');
      }

      // Soft delete all users in this block
      if (block.users.length > 0) {
        await prisma.user.updateMany({
          where: {
            block_id: parseInt(blockId),
            deleted_at: null
          },
          data: {
            deleted_at: new Date(),
            account_status: 'DELETED',
            updated_at: new Date()
          }
        });

        console.log(`🗑️  [DELETE BLOCK] ${block.users.length} daire silindi`);
      }

      // Soft delete the block
      const deletedBlock = await prisma.blocks.update({
        where: { id: parseInt(blockId) },
        data: {
          deleted_at: new Date(),
          updated_at: new Date()
        }
      });

      console.log(`✅ [DELETE BLOCK] Block "${block.block_name}" silindi`);

      return deletedBlock;
    } catch (error) {
      console.error('❌ [DELETE BLOCK] Error:', error.message);
      throw new Error(`Blok silinemedi: ${error.message}`);
    }
  }
}

export default new ResidenceService();
