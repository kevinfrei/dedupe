import { FTON, MakeError, MakeLogger, Type } from '@freik/core-utils';
import { asyncSend } from '../main/Communication';
import * as persist from '../main/persist';
import { clearAbort, getSizes, requestAbort } from './Scanner';

const log = MakeLogger('WatchSources', true);
const err = MakeError('WatchSources-err');

// This is invoked whenever the sources list is changed
const currentlyScanning: Set<string> = new Set();
const completedScanning: Map<string, Map<string, number>> = new Map();

export function WatchSources(foldersFTON: string): boolean {
  log('Watching these sources:');
  log(foldersFTON);
  const folders = FTON.parse(foldersFTON);
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
              asyncSend({ 'folder-size': { name: fldr, size: val.size } });
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

export async function WaitForSources(): Promise<void> {
  const folders = await persist.getItemAsync('folders');
  if (Type.isString(folders)) {
    while (!WatchSources(folders)) {
      await wait(500);
    }
    // Now, just to make sure, send the folder-size commands
    for (const [key, val] of completedScanning) {
      asyncSend({ 'folder-size': { name: key, size: val.size } });
    }
  }
}

export function GetFileSizes(): Map<string, Map<string, number>> {
  return completedScanning;
}
