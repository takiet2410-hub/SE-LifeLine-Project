import { AuditLogger } from './audit-logger';
import { AuditLog } from './audit-log.model';

jest.mock('./audit-log.model');

describe('AuditLogger', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should successfully save audit log and write structured log to stdout', async () => {
    const mockSave = jest.fn().mockResolvedValue({
      _id: 'mock-log-id',
    });
    
    (AuditLog as unknown as jest.Mock).mockImplementation(() => {
      return {
        save: mockSave,
      };
    });

    const params = {
      actorId: 'user-123',
      action: 'CREATE_CAMPAIGN',
      targetId: 'campaign-456',
      targetType: 'Campaign',
      details: { name: 'Test Campaign' },
    };

    await AuditLogger.log(params);

    expect(AuditLog).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
    
    const consoleOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(consoleOutput.level).toBe('info');
    expect(consoleOutput.msg).toBe('Audit log recorded: CREATE_CAMPAIGN');
    expect(consoleOutput.audit.actorId).toBe('user-123');
    expect(consoleOutput.audit.action).toBe('CREATE_CAMPAIGN');
    expect(consoleOutput.audit.targetId).toBe('campaign-456');
    expect(consoleOutput.audit.targetType).toBe('Campaign');
    expect(consoleOutput.audit.details.name).toBe('Test Campaign');
    expect(consoleOutput.audit.timestamp).toBeDefined();
  });

  it('should handle database errors gracefully without throwing', async () => {
    const mockSave = jest.fn().mockRejectedValue(new Error('DB write failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    (AuditLog as unknown as jest.Mock).mockImplementation(() => {
      return {
        save: mockSave,
      };
    });

    const params = {
      actorId: 'user-123',
      action: 'CREATE_CAMPAIGN',
      targetType: 'Campaign',
    };

    await expect(AuditLogger.log(params)).resolves.not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to write audit log:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});
