'use strict';

const { parseDocName } = require('../src/utils/docName');

describe('WebSocket Document Name Standardization (parseDocName)', () => {
  describe('Standardized Formats', () => {
    it('should parse standardized project chat document "project-chat:<projectId>"', () => {
      const result = parseDocName('project-chat:proj-123e4567-e89b-12d3');
      expect(result).toEqual({
        type: 'chat',
        projectId: 'proj-123e4567-e89b-12d3',
      });
    });

    it('should parse URL-encoded standardized chat document', () => {
      const result = parseDocName('project-chat%3Aproj-special-id');
      expect(result).toEqual({
        type: 'chat',
        projectId: 'proj-special-id',
      });
    });

    it('should parse standardized file document "file:<fileId>"', () => {
      const result = parseDocName('file:file-9876-uuid');
      expect(result).toEqual({
        type: 'file',
        fileId: 'file-9876-uuid',
      });
    });

    it('should parse URL-encoded standardized file document', () => {
      const result = parseDocName('file%3Afile-abc-123');
      expect(result).toEqual({
        type: 'file',
        fileId: 'file-abc-123',
      });
    });
  });

  describe('Legacy Backward Compatibility Formats', () => {
    it('should parse legacy chat document "project-<projectId>-chat" correctly extracting only projectId', () => {
      const result = parseDocName('project-proj-999-chat');
      expect(result).toEqual({
        type: 'chat',
        projectId: 'proj-999',
      });
    });

    it('should parse legacy chat document "project-<projectId>"', () => {
      const result = parseDocName('project-proj-888');
      expect(result).toEqual({
        type: 'chat',
        projectId: 'proj-888',
      });
    });

    it('should fallback to file document for raw UUIDs or file IDs', () => {
      const result = parseDocName('c4a5b6c7-d8e9-f012-3456-789abcdef012');
      expect(result).toEqual({
        type: 'file',
        fileId: 'c4a5b6c7-d8e9-f012-3456-789abcdef012',
      });
    });
  });
});
