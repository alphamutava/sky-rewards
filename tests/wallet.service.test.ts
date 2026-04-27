import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletService } from '../src/services/wallet.service';
import { prisma } from '../src/lib/prisma';
import { InsufficientBalanceError, NotFoundError } from '../src/lib/errors';
import { Prisma } from '@prisma/client';

// Mock Prisma
vi.mock('../src/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(prisma)),
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
  },
}));

describe('WalletService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('debit', () => {
    it('should throw NotFoundError if user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      await expect(
        WalletService.debit({
          userId: 'user-1',
          amount: 500,
          type: 'WITHDRAWAL',
          reference: 'REF123',
          description: 'Test withdraw',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw InsufficientBalanceError if wallet balance is too low', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        walletBalance: new Prisma.Decimal(100),
      } as any);

      await expect(
        WalletService.debit({
          userId: 'user-1',
          amount: 500,
          type: 'WITHDRAWAL',
          reference: 'REF123',
          description: 'Test withdraw',
        })
      ).rejects.toThrow(InsufficientBalanceError);
    });

    it('should successfully debit the wallet and create a transaction', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        walletBalance: new Prisma.Decimal(1000),
      } as any);

      vi.mocked(prisma.transaction.create).mockResolvedValueOnce({
        id: 'txn-1',
        amount: new Prisma.Decimal(500),
      } as any);

      const result = await WalletService.debit({
        userId: 'user-1',
        amount: 500,
        type: 'WITHDRAWAL',
        reference: 'REF123',
        description: 'Test withdraw',
      });

      expect(prisma.transaction.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          walletBalance: new Prisma.Decimal(500),
        }),
      });
      expect(result.balanceBefore).toEqual(new Prisma.Decimal(1000));
      expect(result.balanceAfter).toEqual(new Prisma.Decimal(500));
    });
  });

  describe('credit', () => {
    it('should successfully credit the wallet and create a transaction', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        walletBalance: new Prisma.Decimal(1000),
        totalEarned: new Prisma.Decimal(2000),
      } as any);

      vi.mocked(prisma.transaction.create).mockResolvedValueOnce({
        id: 'txn-1',
      } as any);

      const result = await WalletService.credit({
        userId: 'user-1',
        amount: 500,
        type: 'CREATOR_PAYOUT',
        reference: 'REF123',
        description: 'Test credit',
      });

      expect(prisma.transaction.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          walletBalance: new Prisma.Decimal(1500),
          totalEarned: new Prisma.Decimal(2500), // Should increment totalEarned for CREATOR_PAYOUT
        }),
      });
      expect(result.balanceAfter).toEqual(new Prisma.Decimal(1500));
    });
  });
});
