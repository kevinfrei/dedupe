import { MakeError, MakeLogger, SeqNum, Type } from '@freik/core-utils';
import { CallMain, InvokeMain } from './MyWindow';

const log = MakeLogger('ipc');
const err = MakeError('ipc-err');

export async function ReadFromStorage(key: string): Promise<string | void> {
  return await CallMain('read-from-storage', key, Type.isString);
}

export async function WriteToStorage(key: string, data: string): Promise<void> {
  await InvokeMain('write-to-storage', [key, data]);
}

export async function TrashFiles(files: string | string[]): Promise<void> {
  await InvokeMain('trash-file', files);
}

export type ListenKey = { key: string; id: string };
export type MessageHandler = (val: unknown) => void;

const sn = SeqNum('Listen');

// map of message names to map of id's to funtions
const listeners = new Map<string, Map<string, MessageHandler>>();

// Subscribe to the message
export function Subscribe(
  key: string,
  handler: (val: unknown) => void,
): ListenKey {
  const theKey = { key, id: sn() };
  let handlerMap: Map<string, MessageHandler> | void = listeners.get(key);
  if (!handlerMap) {
    handlerMap = new Map<string, MessageHandler>();
    listeners.set(key, handlerMap);
  }
  handlerMap.set(theKey.id, handler);
  return theKey;
}

// Remove listener from the message
export function Unsubscribe(listenKey: ListenKey): void {
  const listener = listeners.get(listenKey.key);
  if (listener) {
    listener.delete(listenKey.id);
  }
}

// Called when an async message comes in from the main process
// Ideally, these should just be subscribed to as part of an AtomEffect
export function HandleMessage(message: unknown): void {
  // Walk the list of ID's to see if we've got anything with a format of:
  // { "id" : data }
  // This has an interesting side effect of letting the server process
  // send multiple "messages" in a single message:
  // { artists: ..., albums: ..., songs: ... } will invoke listeners for
  // all three of those 'messages'
  let handled = false;
  if (Type.isObjectNonNull(message)) {
    for (const id in message) {
      if (Type.isString(id) && Type.has(message, id)) {
        const listener = listeners.get(id);
        if (listener) {
          for (const handler of listener.values()) {
            handled = true;
            log(`Handling message: ${id}`);
            handler(message[id]);
          }
        }
      }
    }
  }
  if (!handled) {
    err('**********');
    err(`Unhandled message:`);
    err(message);
    err('**********');
  }
}
