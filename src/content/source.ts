import type { SourceRef } from '../domain/types';
import { BOOK_SHA256 } from './inventory';

export function companionSource(sectionId: string, printedStart: number, printedEnd = printedStart): SourceRef {
  return {
    sectionId,
    printedStart: String(printedStart),
    printedEnd: String(printedEnd),
    pdfPageStart: printedStart + 40,
    pdfPageEnd: printedEnd + 40,
    sourceHash: BOOK_SHA256,
    companionCreated: true,
  };
}
