import prisma from '../../prismaClient.js';

/**
 * Blok isimleri oluşturma helper
 * A, B, C, D... şeklinde blok isimleri üretir
 */
export function generateBlockNames(count) {
  const blocks = [];
  for (let i = 0; i < count; i++) {
    blocks.push(String.fromCharCode(65 + i)); // A, B, C, ...
  }
  return blocks;
}

/**
 * Site için blokları otomatik oluştur
 */
export async function createBlocksForSite(site_id, block_count, transaction = null) {
  const prismaClient = transaction || prisma;
  
  if (!block_count || block_count <= 0) {
    return [];
  }

  const blockNames = generateBlockNames(block_count);
  const blocks = [];

  for (const blockName of blockNames) {
    const block = await prismaClient.block.create({
      data: {
        block_name: blockName,
        site_id: site_id
      }
    });
    blocks.push(block);
  }

  return blocks;
}

/**
 * Site'ın tüm bloklarını getir
 */
export async function getBlocksBySiteService(site_id) {
  const site = await prisma.site.findUnique({
    where: { site_id },
    select: { id: true }
  });

  if (!site) throw new Error('SITE_ERROR: Site bulunamadı.');

  const blocks = await prisma.block.findMany({
    where: {
      site_id: site_id,
      deleted_at: null
    },
    orderBy: {
      block_name: 'asc'
    }
  });

  return blocks;
}

/**
 * Blok güncelleme
 */
export async function updateBlockService(blockId, updateData) {
  const { block_name } = updateData;

  const block = await prisma.block.findUnique({
    where: { id: blockId }
  });

  if (!block) throw new Error('BLOCK_ERROR: Blok bulunamadı.');

  const updatedBlock = await prisma.block.update({
    where: { id: blockId },
    data: {
      block_name: block_name || block.block_name,
      updated_at: new Date()
    }
  });

  return {
    message: 'Blok başarıyla güncellendi.',
    block: updatedBlock
  };
}

/**
 * Blok silme (soft delete)
 */
export async function deleteBlockService(blockId) {
  const block = await prisma.block.findUnique({
    where: { id: blockId }
  });

  if (!block) throw new Error('BLOCK_ERROR: Blok bulunamadı.');

  await prisma.block.update({
    where: { id: blockId },
    data: {
      deleted_at: new Date()
    }
  });

  return {
    message: 'Blok başarıyla silindi.'
  };
}

/**
 * Site bloklarını yeniden oluştur (mevcut blokları siler, yenilerini ekler)
 */
export async function recreateBlocksForSite(site_id, block_count, transaction = null) {
  const prismaClient = transaction || prisma;

  // Eski blokları soft delete
  await prismaClient.block.updateMany({
    where: { site_id },
    data: { deleted_at: new Date() }
  });

  // Yeni blokları oluştur
  if (block_count > 0) {
    return await createBlocksForSite(site_id, block_count, prismaClient);
  }

  return [];
}