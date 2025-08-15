// src/directoryScanner.ts

import { promises as fs } from 'fs';
import path from 'path';

// --- Define the shape of our data ---

export interface Subitem {
  subitemId: string;
  status: 'Finished' | 'Not Processed';
  masterFile: string;
  mezzanineFile: string;
}

export interface Item {
  itemId: string;
  status: 'Finished' | 'Partially Finished' | 'Not Processed';
  subitems: Subitem[];
  processedCount: number;
  totalCount: number; 

}

export interface CollectionState {
  collectionPath: string;
  isValid: boolean;
  error?: string;
  items: Item[];
}

export async function scanCollection(collectionPath: string): Promise<CollectionState> {
  const mastersPath = path.join(collectionPath, 'Masters');
  const mezzaninesPath = path.join(collectionPath, 'Mezzanines');

  // 1. Validate the folder structure
  try {
    const mastersStat = await fs.stat(mastersPath);
    const mezzaninesStat = await fs.stat(mezzaninesPath);
    if (!mastersStat.isDirectory() || !mezzaninesStat.isDirectory()) {
      throw new Error('Masters or Mezzanines is not a directory.');
    }
  } catch (err) {
    return {
      collectionPath,
      isValid: false,
      error: 'Collection is invalid. It must contain "Masters" and "Mezzanines" subfolders.',
      items: []
    };
  }

  // 2. Read contents of both directories
  const masterFiles = await fs.readdir(mastersPath);
  const mezzanineFiles = await fs.readdir(mezzaninesPath);
  const mezzaninesSet = new Set(mezzanineFiles);

  // Use a Map to group subitems by their parent item ID
  const itemsMap = new Map<string, Subitem[]>();

  // This regex will capture the itemid and subitemid from the master filename
  const filenameRegex = /-(\d+)-(\d+)_master\.tif$/;

  // 3. Parse master files and determine subitem status
  for (const masterFile of masterFiles) {
    const match = masterFile.match(filenameRegex);
    if (match) {
      const [, itemId, subitemId] = match;
      const mezzanineFile = masterFile.replace('_master.tif', '_mezz.tif');

      const subitem: Subitem = {
        subitemId,
        masterFile,
        mezzanineFile,
        status: mezzaninesSet.has(mezzanineFile) ? 'Finished' : 'Not Processed'
      };

      if (!itemsMap.has(itemId)) {
        itemsMap.set(itemId, []);
      }
      itemsMap.get(itemId)?.push(subitem);
    }
  }

  // 4. Aggregate subitems into items and determine overall item status
  const finalItems: Item[] = [];
  for (const [itemId, subitems] of itemsMap.entries()) {
    subitems.sort((a, b) => parseInt(a.subitemId, 10) - parseInt(b.subitemId, 10));
    const totalSubitems = subitems.length;
    const finishedSubitems = subitems.filter(s => s.status === 'Finished').length;


    const totalCount = subitems.length;
    const processedCount = subitems.filter(s => s.status === 'Finished').length;

    let status: Item['status'] = 'Not Processed';
    if (finishedSubitems === totalSubitems) {
      status = 'Finished';
    } else if (finishedSubitems > 0) {
      status = 'Partially Finished';
    }

    finalItems.push({ itemId, status, subitems, processedCount, totalCount });
  }

  // 5. Sort items to show unfinished ones first, then by ID
  finalItems.sort((a, b) => {
    const statusOrder = { 'Not Processed': 0, 'Partially Finished': 0, 'Finished': 2 };
    if (a.status !== b.status) {
      // Primary sort by status
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return parseInt(a.itemId, 10) - parseInt(b.itemId, 10);
  });


  return {
    collectionPath,
    isValid: true,
    items: finalItems
  };
}