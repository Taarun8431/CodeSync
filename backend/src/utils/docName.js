'use strict';

/**
 * Standardized WebSocket Document Name Parser
 *
 * Supported formats:
 *   1. Project Chat:
 *      - Standard:    "project-chat:<projectId>"
 *      - Legacy 1:    "project-<projectId>-chat"
 *      - Legacy 2:    "project-<projectId>"
 *   2. File Editor:
 *      - Standard:    "file:<fileId>"
 *      - Legacy:      "<fileId>" (UUID or string)
 */
const parseDocName = (rawDocName = '') => {
  const decoded = decodeURIComponent(rawDocName);

  if (decoded.startsWith('project-chat:')) {
    return {
      type: 'chat',
      projectId: decoded.slice('project-chat:'.length),
    };
  }

  if (decoded.startsWith('file:')) {
    return {
      type: 'file',
      fileId: decoded.slice('file:'.length),
    };
  }

  // Legacy format fallback: "project-<projectId>-chat"
  if (decoded.startsWith('project-') && decoded.endsWith('-chat')) {
    const projectId = decoded.slice('project-'.length, -'-chat'.length);
    return {
      type: 'chat',
      projectId,
    };
  }

  // Legacy format fallback: "project-<projectId>"
  if (decoded.startsWith('project-')) {
    return {
      type: 'chat',
      projectId: decoded.slice('project-'.length),
    };
  }

  // Legacy format fallback: raw "<fileId>"
  return {
    type: 'file',
    fileId: decoded,
  };
};

module.exports = { parseDocName };
