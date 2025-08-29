import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/v1/modules/route';
import { GET as getModule, PUT, DELETE } from '../../app/api/v1/modules/[moduleId]/route';

// Mock the module helpers
vi.mock('../../lib/module-helpers', () => ({
  initializeModuleSystem: vi.fn(),
  getModuleRegistry: vi.fn(),
}));

vi.mock('../../modules', () => ({
  getAllAvailableModules: vi.fn(),
  getModuleById: vi.fn(),
}));

// Mock prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {}
}));

describe('Module API Routes', () => {
  let mockRegistry: any;

  beforeEach(async () => {
    mockRegistry = {
      getModules: vi.fn(),
      getModuleState: vi.fn(),
      register: vi.fn(),
      unregister: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      updateConfig: vi.fn(),
      getModule: vi.fn(),
    };

    // Mock the helpers to return our mock registry
    const { initializeModuleSystem } = await import('../../lib/module-helpers');
    initializeModuleSystem.mockResolvedValue(mockRegistry);
    
    vi.clearAllMocks();
  });

  describe('GET /api/v1/modules', () => {
    it('should return all modules', async () => {
      const mockModules = [
        { id: 'fitness', name: 'Fitness', version: '1.0.0' },
        { id: 'learning', name: 'Learning', version: '1.0.0' }
      ];

      mockRegistry.getModules.mockReturnValue(mockModules);
      mockRegistry.getModuleState.mockReturnValue({ status: 'enabled' });

      const request = new NextRequest('http://localhost:3000/api/v1/modules');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter modules by enabled status', async () => {
      const mockModules = [
        { id: 'fitness', name: 'Fitness', version: '1.0.0' }
      ];

      mockRegistry.getModules.mockReturnValue(mockModules);
      mockRegistry.getModuleState.mockReturnValue({ status: 'enabled' });

      const request = new NextRequest('http://localhost:3000/api/v1/modules?enabled=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockRegistry.getModules).toHaveBeenCalledWith({ enabled: true });
    });

    it('should handle search queries', async () => {
      mockRegistry.getModules.mockReturnValue([]);
      mockRegistry.getModuleState.mockReturnValue({ status: 'enabled' });

      const request = new NextRequest('http://localhost:3000/api/v1/modules?search=fitness');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockRegistry.getModules).toHaveBeenCalledWith({ search: 'fitness' });
    });

    it('should handle registry initialization errors', async () => {
      const { initializeModuleSystem } = await import('../../lib/module-helpers');
      initializeModuleSystem.mockRejectedValue(new Error('Initialization failed'));

      const request = new NextRequest('http://localhost:3000/api/v1/modules');
      const response = await GET(request);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch modules');
    });
  });

  describe('POST /api/v1/modules', () => {
    it('should install a new module', async () => {
      const { getModuleById } = await import('../../modules');
      const mockModule = {
        id: 'fitness',
        name: 'Fitness',
        version: '1.0.0'
      };

      getModuleById.mockReturnValue(mockModule);
      mockRegistry.register.mockResolvedValue({
        success: true,
        moduleId: 'fitness'
      });

      const request = new NextRequest('http://localhost:3000/api/v1/modules', {
        method: 'POST',
        body: JSON.stringify({
          moduleId: 'fitness',
          config: { setting: 'value' },
          autoEnable: true
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockRegistry.register).toHaveBeenCalledWith(mockModule, {
        config: { setting: 'value' },
        autoEnable: true
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 400 for missing moduleId', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/modules', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Module ID is required');
    });

    it('should return 404 for unknown module', async () => {
      const { getModuleById } = await import('../../modules');
      getModuleById.mockReturnValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/v1/modules', {
        method: 'POST',
        body: JSON.stringify({
          moduleId: 'unknown_module'
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should handle registration failures', async () => {
      const { getModuleById } = await import('../../modules');
      const mockModule = { id: 'fitness' };

      getModuleById.mockReturnValue(mockModule);
      mockRegistry.register.mockResolvedValue({
        success: false,
        error: 'Module already exists'
      });

      const request = new NextRequest('http://localhost:3000/api/v1/modules', {
        method: 'POST',
        body: JSON.stringify({
          moduleId: 'fitness'
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Module already exists');
    });
  });

  describe('GET /api/v1/modules/[moduleId]', () => {
    it('should return specific module information', async () => {
      const mockModule = {
        id: 'fitness',
        name: 'Fitness',
        version: '1.0.0'
      };
      const mockState = {
        status: 'enabled',
        version: '1.0.0'
      };

      mockRegistry.getModule.mockReturnValue(mockModule);
      mockRegistry.getModuleState.mockReturnValue(mockState);

      const request = new NextRequest('http://localhost:3000/api/v1/modules/fitness');
      const response = await getModule(request, { params: { moduleId: 'fitness' } });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('fitness');
      expect(data.data.state).toEqual(mockState);
    });

    it('should return 404 for non-existent module', async () => {
      mockRegistry.getModule.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/v1/modules/unknown');
      const response = await getModule(request, { params: { moduleId: 'unknown' } });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('PUT /api/v1/modules/[moduleId]', () => {
    it('should update module configuration', async () => {
      const newConfig = { setting: 'new_value' };

      mockRegistry.updateConfig.mockResolvedValue({
        success: true,
        moduleId: 'fitness'
      });

      const request = new NextRequest('http://localhost:3000/api/v1/modules/fitness', {
        method: 'PUT',
        body: JSON.stringify({ config: newConfig })
      });

      const response = await PUT(request, { params: { moduleId: 'fitness' } });

      expect(response.status).toBe(200);
      expect(mockRegistry.updateConfig).toHaveBeenCalledWith('fitness', newConfig);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 400 for invalid config', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/modules/fitness', {
        method: 'PUT',
        body: JSON.stringify({ config: null })
      });

      const response = await PUT(request, { params: { moduleId: 'fitness' } });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Valid configuration object is required');
    });

    it('should handle update failures', async () => {
      mockRegistry.updateConfig.mockResolvedValue({
        success: false,
        error: 'Update failed'
      });

      const request = new NextRequest('http://localhost:3000/api/v1/modules/fitness', {
        method: 'PUT',
        body: JSON.stringify({ config: { setting: 'value' } })
      });

      const response = await PUT(request, { params: { moduleId: 'fitness' } });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Update failed');
    });
  });

  describe('DELETE /api/v1/modules/[moduleId]', () => {
    it('should uninstall a module', async () => {
      mockRegistry.unregister.mockResolvedValue({
        success: true,
        moduleId: 'fitness'
      });

      const request = new NextRequest('http://localhost:3000/api/v1/modules/fitness', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { moduleId: 'fitness' } });

      expect(response.status).toBe(200);
      expect(mockRegistry.unregister).toHaveBeenCalledWith('fitness');

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle uninstall failures', async () => {
      mockRegistry.unregister.mockResolvedValue({
        success: false,
        error: 'Module has dependencies'
      });

      const request = new NextRequest('http://localhost:3000/api/v1/modules/fitness', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { moduleId: 'fitness' } });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Module has dependencies');
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockRegistry.getModules.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/v1/modules');
      const response = await GET(request);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch modules');
    });

    it('should include timestamps in all responses', async () => {
      mockRegistry.getModules.mockReturnValue([]);
      mockRegistry.getModuleState.mockReturnValue({ status: 'enabled' });

      const request = new NextRequest('http://localhost:3000/api/v1/modules');
      const response = await GET(request);

      const data = await response.json();
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });
  });
});