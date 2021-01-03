import { createHash } from 'crypto';
import fs from 'fs';
import { asyncSend } from '../main/Communication';

function hashFile(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let shasum = createHash('sha1');
    try {
      let s = fs.createReadStream(filename);
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

const finalHashes: Map<string, Set<string>> = new Map();

function countItems<T, U>(map: Map<T, Set<U>>): number {
  let count = 0;
  for (const [, set] of map) {
    count += set.size;
  }
  return count;
}

function totalBytes(map: Map<number, Set<string>>): number {
  let total = 0;
  for (const [size, files] of map) {
    total += size * files.size;
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
  let now = Date.now();
  const pc1 = Math.round((p1 / t1) * 100);
  const pc2 = Math.round((p2 / t2) * 100);
  if (now - time > 250 || doit) {
    time = now;
    asyncSend({
      'compute-state': `${finalHashes.size} (${countItems(
        finalHashes,
      )}) duplicate files found. ${pc1}% files, ${pc2}% bytes (${toBytes(
        p2,
      )}/${toBytes(t2)})`,
    });
  }
}

export async function getHashes(
  dupes: Map<number, Set<string>>,
): Promise<Map<string, Set<string>>> {
  const total = countItems(dupes);
  const bytes = totalBytes(dupes);
  let cur = 0;
  let curBytes = 0;
  finalHashes.clear();
  for (const [size, files] of dupes) {
    // TODO: Make this parallel, probably
    const hashes: Map<string, Set<string>> = new Map();
    for (const file of files) {
      cur++;
      const hash = await hashFile(file);
      curBytes += size;
      const fileSet = hashes.get(hash);
      if (!fileSet) {
        hashes.set(hash, new Set([file]));
      } else {
        fileSet.add(file);
        finalHashes.set(hash, fileSet);
      }
      updateProgress(cur, total, curBytes, bytes);
    }
  }
  updateProgress(cur, total, curBytes, bytes, true);
  return finalHashes;
}
