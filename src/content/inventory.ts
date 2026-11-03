import inventory from './generated-inventory.json';
import type { CurriculumInventory } from '../domain/types';

export const BOOK_SHA256 = '93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56';
export const curriculumInventory = inventory as CurriculumInventory;
