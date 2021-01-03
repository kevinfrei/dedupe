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

export async function getHashes(
  dupes: Map<number, Set<string>>,
): Promise<Map<string, Set<string>>> {
  const total = countItems(dupes);
  let cur = 0;
  finalHashes.clear();
  for (const [, files] of dupes) {
    // TODO: Make this parallel, probably
    const hashes: Map<string, Set<string>> = new Map();
    for (const file of files) {
      cur++;
      const hash = await hashFile(file);
      const fileSet = hashes.get(hash);
      if (!fileSet) {
        hashes.set(hash, new Set([file]));
      } else {
        fileSet.add(file);
        finalHashes.set(hash, fileSet);
        asyncSend({
          'compute-state': `Found ${
            finalHashes.size
          } duplicated files ${Math.round((cur / total) * 100)}%`,
        });
      }
    }
  }
  asyncSend({
    'compute-state': `Finished with ${finalHashes.size} (${countItems(
      finalHashes,
    )}) duplicated files`,
  });
  return finalHashes;
}
