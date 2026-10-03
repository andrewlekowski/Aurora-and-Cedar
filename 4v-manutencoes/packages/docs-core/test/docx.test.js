import { describe, it, expect } from 'vitest';
import * as D from 'docx';
import { buildBlocks, buildDocx, DOC_TYPES } from '../src/index.js';
import { CO, FULL } from './fixtures.js';

const PNG_1PX = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));

describe('buildDocx()', () => {
  for (const type of DOC_TYPES) {
    it(`${type} packs into a non-empty .docx`, async () => {
      const doc = buildDocx(D, buildBlocks(type, FULL[type], 'pt', CO), 'pt', CO, PNG_1PX);
      const buf = await D.Packer.toBuffer(doc);
      expect(buf.length).toBeGreaterThan(5000);
      expect(buf.subarray(0, 2).toString()).toBe('PK');
    });
  }
});
