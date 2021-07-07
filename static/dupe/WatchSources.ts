import { MakeError, MakeLogger, Type, Unpickle } from '@freik/core-utils';
import { AsyncSend } from '../main/Communication';
import { Persistence } from '../main/persist';
import { clearAbort, getSizes, requestAbort } from './Scanner';

const log = MakeLogger('WatchSources', true);
const err = MakeError('WatchSources-err');

// This is invoked whenever the sources list is changed
const currentlyScanning: Set<string> = new Set();
const completedScanning: Map<string, Map<string, number>> = new Map();

export function WatchSources(foldersPickled: string): boolean {
  log('Watching these sources:');
  log(foldersPickled);
  const folders = Unpickle(foldersPickled);
  log(folders);
  if (!folders) {
    err('Bailing WatchSources');
    return false;
  }
  if (Type.isArrayOfString(folders)) {
    const fldrs = new Set(folders);
    // Stop anything 'mid-scan'
    for (const curScan of currentlyScanning) {
      if (!fldrs.has(curScan)) {
        requestAbort(curScan);
      }
    }
    for (const fldr of folders) {
      if (!currentlyScanning.has(fldr) && !completedScanning.has(fldr)) {
        currentlyScanning.add(fldr);
        getSizes(fldr)
          .then((val: void | Map<string, number>) => {
            currentlyScanning.delete(fldr);
            clearAbort(fldr);
            if (val) {
              completedScanning.set(fldr, val);
              // Send data back to render
              AsyncSend({ 'folder-size': { name: fldr, size: val.size } });
            }
          })
          .catch((reason) => {
            err(`Scan for ${fldr} failed`);
            err(reason);
          });
      }
    }
    return completedScanning.size === folders.length;
  } else {
    err('Bailing for bad type of input');
  }
  return false;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function countItems<T, U, V>(map: Map<T, Map<U, V>>): number {
  let count = 0;
  for (const [, mp] of map) {
    count += mp.size;
  }
  return count;
}

export async function WaitForSources(): Promise<void> {
  const folders = await Persistence.getItemAsync('folders');
  if (Type.isString(folders)) {
    while (!WatchSources(folders)) {
      await wait(500);
      AsyncSend({
        'compute-state': `Looking for same-sized files ${countItems(
          completedScanning,
        )}`,
      });
    }
    // Now, just to make sure, send the folder-size commands
    for (const [key, val] of completedScanning) {
      AsyncSend({ 'folder-size': { name: key, size: val.size } });
    }
  }
}

export function GetFileSizes(): Map<string, Map<string, number>> {
  return completedScanning;
}
