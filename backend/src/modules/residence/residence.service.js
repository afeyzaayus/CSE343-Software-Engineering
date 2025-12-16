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
          block_name: true,
          apartment_count: true,
          resident_count: true
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
      
      const { id, ...dataWithoutId } = data;
      if (id) {
      }
      
      let blockId = dataWithoutId.block_id;
      
      // Find or create block
      if (dataWithoutId.block_name && !blockId) {
        let block = await prisma.blocks.findFirst({
          where: {
            site_id: dataWithoutId.siteId,
            block_name: dataWithoutId.block_name
          }
        });
        
        if (!block) {
          block = await prisma.blocks.create({
            data: {
              block_name: dataWithoutId.block_name,
              site_id: dataWithoutId.siteId
            }
          });
        }
        
        blockId = block.id;
      }
      
      // Normalize resident_type
      let residentType = dataWithoutId.resident_type;
      if (residentType === 'active' || residentType === 'HIRER') {
        residentType = 'HIRER';
      } else if (residentType === 'inactive' || residentType === 'OWNER') {
        residentType = 'OWNER';
      } else {
        residentType = 'OWNER';
      }
      
      // PARALLEL CHECK: Phone number ve block bilgisi paralel kontrol et
      const [existingUser, blockInfo] = await Promise.all([
        prisma.user.findUnique({
          where: { phone_number: dataWithoutId.phone_number }
        }),
        blockId ? prisma.blocks.findUnique({
          where: { id: parseInt(blockId) },
          select: { apartment_count: true, block_name: true }
        }) : Promise.resolve(null)
      ]);
      
      if (existingUser) {
        throw new Error(`Bu telefon numarasÄ± zaten kayÄ±tlÄ±: ${dataWithoutId.phone_number}`);
      }
      
      // Auto-increase block capacity if needed
      const apartmentNo = parseInt(dataWithoutId.apartment_no || 0);
      if (blockId && blockInfo && apartmentNo > (blockInfo.apartment_count || 0)) {
        await prisma.blocks.update({
          where: { id: parseInt(blockId) },
          data: { apartment_count: apartmentNo }
        });
      }
      
      // Get or create apartment
      let apartment = null;
      if (blockId && dataWithoutId.apartment_no) {
        apartment = await prisma.apartments.findUnique({
          where: {
            block_id_apartment_no: {
              block_id: parseInt(blockId),
              apartment_no: dataWithoutId.apartment_no
            }
          }
        });
        
        if (!apartment) {
          apartment = await prisma.apartments.create({
            data: {
              apartment_no: dataWithoutId.apartment_no,
              block_id: parseInt(blockId),
              resident_count: 0,
              is_occupied: false
            }
          });
        }
      }
      
      // Reset sequence if needed
      try {
        await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"public"."users"', 'id'), COALESCE((SELECT MAX(id) FROM "public"."users"), 1), true)`;
      } catch (seqError) {
      }
      
      // Create user
      const resident = await prisma.user.create({
        data: {
          full_name: dataWithoutId.full_name,
          phone_number: dataWithoutId.phone_number,
          password: dataWithoutId.password || 'defaultPassword123',
          block_id: blockId ? parseInt(blockId) : null,
          apartment_id: apartment?.id || null,
          apartment_no: dataWithoutId.apartment_no,
          siteId: dataWithoutId.siteId,
          plates: dataWithoutId.plates,
          resident_type: residentType,
          account_status: 'ACTIVE',
          updated_at: new Date()
        },
        select: {
          id: true,
          full_name: true,
          block_id: true,
          apartment_id: true,
          apartment_no: true,
          phone_number: true,
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
      
      // PARALLEL UPDATE: Apartment ve block bilgileri güncellemelerini paralel yap
      if (apartment || blockId) {
        const updates = [];
        
        if (apartment) {
          updates.push(
            prisma.user.count({
              where: {
                apartment_id: apartment.id,
                deleted_at: null
              }
            }).then(residentCount => 
              prisma.apartments.update({
                where: { id: apartment.id },
                data: {
                  resident_count: residentCount,
                  is_occupied: residentCount > 0
                }
              })
            )
          );
        }
        
        if (blockId) {
          updates.push(
            prisma.apartments.findMany({
              where: { block_id: parseInt(blockId) },
              select: { resident_count: true }
            }).then(blockApartments => {
              const totalBlockResidents = blockApartments.reduce((sum, apt) => sum + (apt.resident_count || 0), 0);
              return prisma.blocks.update({
                where: { id: parseInt(blockId) },
                data: { resident_count: totalBlockResidents }
              });
            })
          );
        }
        
        await Promise.all(updates);
      }

      // Create monthly dues for current month only for the new resident
      try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const dueDate = new Date(currentYear, currentMonth - 1, 15);
        
        let paymentStatus = 'UNPAID';
        
        if (apartment?.id) {
          const otherResidentsInApartment = await prisma.user.findMany({
            where: {
              apartment_id: apartment.id,
              id: { not: resident.id },
              deleted_at: null
            },
            select: { id: true }
          });
          
          if (otherResidentsInApartment.length > 0) {
            const otherResidentIds = otherResidentsInApartment.map(r => r.id);
            const existingDues = await prisma.monthlyDues.findFirst({
              where: {
                userId: { in: otherResidentIds },
                siteId: dataWithoutId.siteId,
                month: currentMonth,
                year: currentYear
              },
              select: { payment_status: true }
            });
            
            if (existingDues) {
              paymentStatus = existingDues.payment_status;
            }
          }
        }
        
        try {
          await prisma.monthlyDues.upsert({
            where: {
              userId_siteId_month_year: {
                userId: resident.id,
                siteId: dataWithoutId.siteId,
                month: currentMonth,
                year: currentYear
              }
            },
            create: {
              userId: resident.id,
              apartmentId: apartment?.id || null,
              siteId: dataWithoutId.siteId,
              month: currentMonth,
              year: currentYear,
              amount: 0,
              due_date: dueDate,
              payment_status: paymentStatus
            },
            update: {
              payment_status: paymentStatus,
              apartmentId: apartment?.id || null
            }
          });
        } catch (e) {
        }
      } catch (error) {
      }

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
      // Get current resident info
      const currentResident = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: { siteId: true, apartment_id: true, block_id: true }
      });

      if (!currentResident) {
        throw new Error('Sakin bulunamadÄ±');
      }

      const updateData = {
        updated_at: new Date()
      };

      // Handle block_name conversion to block_id
      if (data.block_name) {
        let block = await prisma.blocks.findFirst({
          where: {
            site_id: currentResident.siteId,
            block_name: data.block_name
          }
        });
        
        if (!block) {
          block = await prisma.blocks.create({
            data: {
              block_name: data.block_name,
              site_id: currentResident.siteId
            }
          });
        }
        
        updateData.block_id = block.id;
      } else if (data.block_id) {
        updateData.block_id = parseInt(data.block_id);
      }

      if (data.full_name) updateData.full_name = data.full_name;
      if (data.phone_number) updateData.phone_number = data.phone_number;
      
      // Handle apartment change
      let newApartmentId = null;
      if (data.apartment_no && updateData.block_id) {
        let apartment = await prisma.apartments.findUnique({
          where: {
            block_id_apartment_no: {
              block_id: updateData.block_id,
              apartment_no: data.apartment_no
            }
          }
        });
        
        if (!apartment) {
          apartment = await prisma.apartments.create({
            data: {
              apartment_no: data.apartment_no,
              block_id: updateData.block_id,
              resident_count: 0,
              is_occupied: false
            }
          });
        }
        
        newApartmentId = apartment.id;
        updateData.apartment_id = newApartmentId;
        updateData.apartment_no = data.apartment_no;
      }

      if (data.plates !== undefined) updateData.plates = data.plates;
      if (data.resident_type) updateData.resident_type = data.resident_type;

      // Update resident
      const resident = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          full_name: true,
          block_id: true,
          apartment_id: true,
          apartment_no: true,
          phone_number: true,
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

      // If apartment changed, update counts in parallel
      if (newApartmentId && newApartmentId !== currentResident.apartment_id) {
        const updates = [];

        // Decrease old apartment count
        if (currentResident.apartment_id) {
          updates.push(
            prisma.user.count({
              where: {
                apartment_id: currentResident.apartment_id,
                deleted_at: null
              }
            }).then(oldApartmentCount =>
              prisma.apartments.update({
                where: { id: currentResident.apartment_id },
                data: {
                  resident_count: oldApartmentCount,
                  is_occupied: oldApartmentCount > 0
                }
              })
            )
          );
        }

        // Increase new apartment count
        updates.push(
          prisma.user.count({
            where: {
              apartment_id: newApartmentId,
              deleted_at: null
            }
          }).then(newApartmentCount =>
            prisma.apartments.update({
              where: { id: newApartmentId },
              data: {
                resident_count: newApartmentCount,
                is_occupied: newApartmentCount > 0
              }
            })
          )
        );

        // Update block resident counts in parallel
        if (updateData.block_id && updateData.block_id !== currentResident.block_id) {
          if (currentResident.block_id) {
            updates.push(
              prisma.apartments.findMany({
                where: { block_id: currentResident.block_id },
                select: { resident_count: true }
              }).then(oldBlockApartments => {
                const oldBlockTotal = oldBlockApartments.reduce((sum, apt) => sum + (apt.resident_count || 0), 0);
                return prisma.blocks.update({
                  where: { id: currentResident.block_id },
                  data: { resident_count: oldBlockTotal }
                });
              })
            );
          }

          updates.push(
            prisma.apartments.findMany({
              where: { block_id: updateData.block_id },
              select: { resident_count: true }
            }).then(newBlockApartments => {
              const newBlockTotal = newBlockApartments.reduce((sum, apt) => sum + (apt.resident_count || 0), 0);
              return prisma.blocks.update({
                where: { id: updateData.block_id },
                data: { resident_count: newBlockTotal }
              });
            })
          );
        }

        await Promise.all(updates);
      }

      return {
        ...resident,
        block_name: resident.blocks?.block_name || null
      };
    } catch (error) {
      throw new Error(`Failed to update resident: ${error.message}`);
    }
  }

  // Delete a resident (hard delete)
  async deleteResident(id) {
    try {
      // Get resident info before deletion
      const resident = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: { apartment_id: true, block_id: true }
      });

      if (!resident) {
        throw new Error('Sakin bulunamadÄ±');
      }

      // PARALLEL DELETE: İlişkili tüm kayıtları paralel sil
      await Promise.all([
        prisma.monthlyDues.deleteMany({ where: { userId: parseInt(id) } }),
        prisma.payments.deleteMany({ where: { userId: parseInt(id) } }),
        prisma.complaints.deleteMany({ where: { userId: parseInt(id) } })
      ]);

      // Hard delete - user'ı sil
      await prisma.user.delete({
        where: { id: parseInt(id) }
      });

      // PARALLEL UPDATE: Apartment ve block güncelleme paralel yap
      const updates = [];

      if (resident.apartment_id) {
        updates.push(
          prisma.user.count({
            where: {
              apartment_id: resident.apartment_id,
              deleted_at: null
            }
          }).then(apartmentResidentCount =>
            prisma.apartments.update({
              where: { id: resident.apartment_id },
              data: {
                resident_count: apartmentResidentCount,
                is_occupied: apartmentResidentCount > 0
              }
            })
          )
        );
      }

      if (resident.block_id) {
        updates.push(
          prisma.apartments.findMany({
            where: { block_id: resident.block_id },
            select: { resident_count: true }
          }).then(blockApartments => {
            const totalBlockResidents = blockApartments.reduce((sum, apt) => sum + (apt.resident_count || 0), 0);
            return prisma.blocks.update({
              where: { id: resident.block_id },
              data: { resident_count: totalBlockResidents }
            });
          })
        );
      }

      if (updates.length > 0) {
        await Promise.all(updates);
      }

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
        throw new Error('Blok adÄ± gerekli');
      }

      if (!apartment_count || apartment_count < 1) {
        throw new Error('Daire sayÄ±sÄ± gerekli ve 1\'den bÃ¼yÃ¼k olmalÄ±');
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

      
      return block;
    } catch (error) {
      throw new Error(`Blok oluÅŸturulamadÄ±: ${error.message}`);
    }
  }

  // Get block statistics for a site
  async getBlockStats(siteId) {
    try {
      const blocks = await prisma.blocks.findMany({
        where: {
          site_id: parseInt(siteId)
        },
        include: {
          users: {
            where: {
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

  // Delete a block (hard delete - also hard deletes all users in that block)
  async deleteBlock(blockId) {
    try {
      const block = await prisma.blocks.findUnique({
        where: { id: parseInt(blockId) },
        include: {
          users: true
        }
      });

      if (!block) {
        throw new Error('Blok bulunamadÄ±');
      }

      // Hard delete all users in this block
      if (block.users.length > 0) {
        await prisma.user.deleteMany({
          where: {
            block_id: parseInt(blockId)
          }
        });

      }

      // Hard delete the block
      const deletedBlock = await prisma.blocks.delete({
        where: { id: parseInt(blockId) }
      });


      return deletedBlock;
    } catch (error) {
      throw new Error(`Blok silinemedi: ${error.message}`);
    }
  }

  async updateBlock(blockId, data) {
    try {
      const { block_name, apartment_count } = data;

      const block = await prisma.blocks.findUnique({
        where: { id: parseInt(blockId) }
      });

      if (!block) {
        throw new Error('Blok bulunamadÄ±');
      }

      const updateData = {};
      if (block_name !== undefined) {
        updateData.block_name = block_name;
      }
      if (apartment_count !== undefined) {
        updateData.apartment_count = apartment_count;
      }

      const updatedBlock = await prisma.blocks.update({
        where: { id: parseInt(blockId) },
        data: updateData
      });


      return updatedBlock;
    } catch (error) {
      throw new Error(`Blok gÃ¼ncellenemedi: ${error.message}`);
    }
  }

  // Delete an apartment (hard delete - also hard deletes all residents in that apartment)
  async deleteApartment(blockId, apartmentNo) {
    try {
      
      // First, try to find the apartment
      let apartment = await prisma.apartments.findUnique({
        where: {
          block_id_apartment_no: {
            block_id: parseInt(blockId),
            apartment_no: String(apartmentNo)
          }
        },
        include: {
          users: true
        }
      });

      // If apartment record exists, delete it and its residents
      if (apartment) {

        // Hard delete all residents in this apartment
        if (apartment.users.length > 0) {
          await prisma.user.deleteMany({
            where: {
              apartment_id: apartment.id
            }
          });

        }

        // Hard delete the apartment record
        const deletedApartment = await prisma.apartments.delete({
          where: { id: apartment.id }
        });

      } else {
        // If no apartment record (phantom apartment), just log it
      }

      // Regardless, decrement the block's apartment_count
      const block = await prisma.blocks.findUnique({
        where: { id: parseInt(blockId) }
      });

      if (!block) {
        throw new Error('Blok bulunamadÄ±');
      }

      if (block.apartment_count > 0) {
        const newCount = block.apartment_count - 1;
        await prisma.blocks.update({
          where: { id: parseInt(blockId) },
          data: { apartment_count: newCount }
        });

      }

      return { success: true, message: `Daire ${apartmentNo} baÅŸarÄ±yla silindi` };

      return deletedApartment;
    } catch (error) {
      throw new Error(`Daire silinemedi: ${error.message}`);
    }
  }
}

export default new ResidenceService();

