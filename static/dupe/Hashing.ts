import { MakeMultiMap, MultiMap } from '@freik/core-utils';
import { createHash } from 'crypto';
import fs from 'fs';
import { AsyncSend } from '../main/Communication';

function hashFile(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const shasum = createHash('sha1');
    try {
      const s = fs.createReadStream(filename);
      s.on('data', function (data) {
        shasum.update(data);
      });
      // making digest
      s.on('end', function () {
        const hash = shasum.digest('hex');
        return resolve(hash);
      });
    } catch (error) {
      return reject(`Hash failure for ${filename}`);
    }
  });
}

const finalHashes = MakeMultiMap<string, string>();

function iterSize<U>(iter: IterableIterator<U>): number {
  let count = 0;
  for (const i of iter) {
    count++;
  }
  return count;
}

function countItems<T, U>(map: MultiMap<T, U>): number {
  let count = 0;
  for (const [, set] of map) {
    count += iterSize(set);
  }
  return count;
}

function totalBytes(map: MultiMap<number, string>): number {
  let total = 0;
  for (const [size, files] of map) {
    total += size * iterSize(files);
  }
  return total;
}

const suffix = ['KB', 'MB', 'GB', 'TB', 'PB'];
function toBytes(total: number): string {
  let sfx = '';
  let pos = 0;
  while (total > 1024 && pos < suffix.length) {
    total /= 1024;
    sfx = suffix[pos];
    pos++;
  }
  return `${Math.round(total * 100) / 100}${sfx}`;
}

let time = 0;

function updateProgress(
  p1: number,
  t1: number,
  p2: number,
  t2: number,
  doit?: boolean,
) {
  const now = Date.now();
  const pc1 = Math.round((p1 / t1) * 100);
  const pc2 = Math.round((p2 / t2) * 100);
  if (now - time > 250 || doit) {
    time = now;
    AsyncSend({
      'compute-state': `${finalHashes.size()} (${countItems(
        finalHashes,
      )}) duplicate files found. ${pc1}% files, ${pc2}% bytes (${toBytes(
        p2,
      )}/${toBytes(t2)})`,
    });
  }
}

export async function getHashes(
  dupes: MultiMap<number, string>,
): Promise<MultiMap<string, string>> {
  const total = countItems(dupes);
  const bytes = totalBytes(dupes);
  let cur = 0;
  let curBytes = 0;
  finalHashes.clear();
  for (const [size, files] of dupes) {
    // TODO: Make this parallel, probably
    const hashes = MakeMultiMap<string, string>();
    for (const file of files) {
      cur++;
      const hash = await hashFile(file);
      curBytes += size;
      hashes.set(hash, file);
      updateProgress(cur, total, curBytes, bytes);
    }
  }
  updateProgress(cur, total, curBytes, bytes, true);
  return finalHashes;
}
