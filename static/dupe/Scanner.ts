import { MakeError } from '@freik/core-utils';
import { promises as fsp } from 'fs';
import path from 'path';
import { asyncSend } from '../main/Communication';
import { getHashes } from './Hashing';
import { GetFileSizes, WaitForSources } from './WatchSources';

const err = MakeError('Scanner-err');

const abortRequests: Set<string> = new Set();

export function requestAbort(fldr: string) {
  abortRequests.add(fldr);
}

export function clearAbort(fldr: string) {
  abortRequests.delete(fldr);
}

function shouldAbort(fldr: string): boolean {
  return abortRequests.has(fldr);
}

// Get a map of file names to file sizes, with an abort request possible
export async function getSizes(
  folder: string,
): Promise<Map<string, number> | void> {
  clearAbort(folder);
  const sizes: Map<string, number> = new Map();
  const queue: string[] = [folder];
  while (queue.length !== 0) {
    if (shouldAbort(folder)) {
      err(`Aborting ${folder}`);
      return;
    }
    const item = queue.pop();
    if (!item) continue;
    try {
      const stat = await fsp.stat(item);
      if (stat.isDirectory()) {
        // Push all the child folders into the queue
        try {
          const children = await fsp.readdir(item);
          for (const child of children) {
            queue.push(path.join(item, child));
          }
        } catch (e) {
          err(`Failed reading directory ${item}`);
          err(e);
          continue;
        }
      } else {
        sizes.set(item, stat.size);
      }
    } catch (e) {
      err(`Failed to stat(${item})`);
      err(e);
      continue;
    }
  }
  return sizes;
}

export async function startScan(): Promise<void> {
  await WaitForSources();
  asyncSend({ 'compute-state': 'Looking for duplicate files' });
  const allFiles = GetFileSizes();
  const sizes: Map<number, Set<string>> = new Map();
  for (const aMap of allFiles.values()) {
    for (const [file, size] of aMap) {
      let theSet = sizes.get(size);
      if (!theSet) {
        sizes.set(size, new Set([file]));
      } else {
        theSet.add(file);
      }
    }
  }
  const uniqueFileSizes = sizes.size;
  asyncSend({ 'compute-state': `${uniqueFileSizes} unique file sizes found` });
  let removed = 0;
  for (const val of [...sizes.keys()]) {
    if (sizes.get(val) && sizes.get(val)!.size === 1) {
      sizes.delete(val);
      removed++;
    }
  }
  const dupFileSizes = sizes.size;
  asyncSend({ 'compute-state': `${uniqueFileSizes} down to ${dupFileSizes}` });
  if (uniqueFileSizes - removed !== dupFileSizes) {
    asyncSend({
      'compute-state': `${uniqueFileSizes} !== ${dupFileSizes} + ${removed}`,
    });
  }
  const hashes = await getHashes(sizes);
  // This keeps stuff disabled, but hides the modal dialog
  asyncSend({ 'compute-state': ' ' });
  asyncSend({ 'dupe-files': [...hashes.values()] });
}
