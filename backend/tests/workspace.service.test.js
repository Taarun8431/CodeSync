'use strict';

/**
 * Workspace Service Tests
 *
 * Tests cover:
 *   - getWorkspaces (user sees owned + member workspaces — the main bug fix)
 *   - getWorkspaceById (owner can view, non-member gets 403, member gets access)
 *   - createWorkspace
 *   - updateWorkspace (only owner can update)
 *   - deleteWorkspace (only owner can delete)
 */

jest.mock('../src/lib/prisma', () => ({
  workspace: {
    findMany:   jest.fn(),
    findUnique: jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
  },
  project: {
    findFirst: jest.fn(),
  },
}));

const prisma = require('../src/lib/prisma');
const workspaceService = require('../src/modules/workspaces/services/workspace.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mockWorkspace = (overrides = {}) => ({
  id:       'ws-123',
  name:     'My Workspace',
  ownerId:  'user-owner',
  projects: [],
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

// ─── getWorkspaces ────────────────────────────────────────────────────────────

describe('workspaceService.getWorkspaces', () => {
  it('should query with OR condition for owner AND project member', async () => {
    prisma.workspace.findMany.mockResolvedValue([mockWorkspace()]);

    const result = await workspaceService.getWorkspaces('user-owner');

    // Verify the OR clause is present (member visibility fix)
    expect(prisma.workspace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { ownerId: 'user-owner' },
            expect.objectContaining({
              projects: expect.objectContaining({
                some: expect.objectContaining({
                  members: { some: { userId: 'user-owner' } },
                }),
              }),
            }),
          ]),
        }),
      })
    );
    expect(result).toHaveLength(1);
  });
});

// ─── getWorkspaceById ─────────────────────────────────────────────────────────

describe('workspaceService.getWorkspaceById', () => {
  it('should return workspace if user is owner', async () => {
    prisma.workspace.findUnique.mockResolvedValue(mockWorkspace({ ownerId: 'user-owner' }));

    const result = await workspaceService.getWorkspaceById('user-owner', 'ws-123');
    expect(result).toHaveProperty('id', 'ws-123');
  });

  it('should return workspace if user is a project member (the visibility fix)', async () => {
    // User is NOT the owner
    prisma.workspace.findUnique.mockResolvedValue(mockWorkspace({ ownerId: 'someone-else' }));
    // But user IS a project member in a project within this workspace
    prisma.project.findFirst.mockResolvedValue({ id: 'proj-123' });

    const result = await workspaceService.getWorkspaceById('user-member', 'ws-123');
    expect(result).toHaveProperty('id', 'ws-123');
    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: 'ws-123',
          members: { some: { userId: 'user-member' } },
        }),
      })
    );
  });

  it('should throw 403 if user is neither owner nor project member', async () => {
    prisma.workspace.findUnique.mockResolvedValue(mockWorkspace({ ownerId: 'someone-else' }));
    prisma.project.findFirst.mockResolvedValue(null); // not a member either

    await expect(
      workspaceService.getWorkspaceById('random-user', 'ws-123')
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('should throw 404 for non-existent workspace', async () => {
    prisma.workspace.findUnique.mockResolvedValue(null);

    await expect(
      workspaceService.getWorkspaceById('user-owner', 'nonexistent')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── updateWorkspace ──────────────────────────────────────────────────────────

describe('workspaceService.updateWorkspace', () => {
  it('should update if user is owner', async () => {
    prisma.workspace.findUnique.mockResolvedValue(mockWorkspace({ ownerId: 'user-owner' }));
    prisma.workspace.update.mockResolvedValue(mockWorkspace({ name: 'Updated Name' }));

    const result = await workspaceService.updateWorkspace('user-owner', 'ws-123', { name: 'Updated Name' });
    expect(result.name).toBe('Updated Name');
  });

  it('should throw 403 if non-owner tries to update', async () => {
    prisma.workspace.findUnique.mockResolvedValue(mockWorkspace({ ownerId: 'user-owner' }));

    await expect(
      workspaceService.updateWorkspace('other-user', 'ws-123', { name: 'Hacked' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── deleteWorkspace ──────────────────────────────────────────────────────────

describe('workspaceService.deleteWorkspace', () => {
  it('should delete if user is owner', async () => {
    prisma.workspace.findUnique.mockResolvedValue(mockWorkspace({ ownerId: 'user-owner' }));
    prisma.workspace.delete.mockResolvedValue({});

    await expect(
      workspaceService.deleteWorkspace('user-owner', 'ws-123')
    ).resolves.toBeUndefined();
  });

  it('should throw 403 if non-owner tries to delete', async () => {
    prisma.workspace.findUnique.mockResolvedValue(mockWorkspace({ ownerId: 'user-owner' }));

    await expect(
      workspaceService.deleteWorkspace('other-user', 'ws-123')
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
