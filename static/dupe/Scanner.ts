import { MakeError } from '@freik/core-utils';
import { promises as fsp } from 'fs';
import path from 'path';
import { asyncSend } from '../main/Communication';
import { WaitForSources } from './WatchSources';

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
}
