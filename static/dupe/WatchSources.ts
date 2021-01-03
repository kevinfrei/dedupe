import { FTON, MakeError, MakeLogger, Type } from '@freik/core-utils';
import { clearAbort, getSizes, requestAbort } from './Scanner';

const log = MakeLogger('WatchSources', true);
const err = MakeError('WatchSources-err');

// This is invoked whenever the sources list is changed
const currentlyScanning: Set<string> = new Set();
const completedScanning: Map<string, Map<string, number>> = new Map();

type FolderSummary = { name: string; size?: number };

export function WatchSources(foldersFTON: string) {
  log('Watching these sources:');
  log(foldersFTON);
  const folders = FTON.parse(foldersFTON);
  log(folders);
  if (!folders) {
    err('Bailing WatchSources');
    return;
  }
  if (
    Type.isArrayOf(folders, (obj): obj is FolderSummary =>
      Type.hasStr(obj, 'name'),
    )
  ) {
    const fldrs = new Set(folders.map((f) => f.name));
    // Stop anything 'mid-scan'
    for (const curScan of currentlyScanning) {
      if (!fldrs.has(curScan)) {
        requestAbort(curScan);
      }
    }
    for (const fldr of folders) {
      if (
        !currentlyScanning.has(fldr.name) &&
        !completedScanning.has(fldr.name)
      ) {
        currentlyScanning.add(fldr.name);
        getSizes(fldr.name)
          .then((val: void | Map<string, number>) => {
            currentlyScanning.delete(fldr.name);
            clearAbort(fldr.name);
            if (val) {
              completedScanning.set(fldr.name, val);
              fldr.size = val.size;
              // TODO: Send data back to render
            }
          })
          .catch((reason) => {
            err(`Scan for ${fldr.name} failed`);
            err(reason);
          });
      }
    }
  } else {
    err('Bailing for bad type of input');
  }
}
