import {
  MakeError,
  MakeLogger,
  Pickle,
  Type,
  Unpickle,
} from '@freik/core-utils';
import { Suspense, useEffect, useState } from 'react';
import {
  AtomEffect,
  DefaultValue,
  RecoilState,
  SetterOrUpdater,
  useRecoilCallback,
  useRecoilState,
} from 'recoil';
import {
  ListenKey,
  ReadFromStorage,
  Subscribe,
  Unsubscribe,
  WriteToStorage,
} from '../ipc';
import logo from '../logo.svg';
import { InitialWireUp } from '../MyWindow';
import { computeState, dupeFilesState, folderFileCountFamily } from './State';

export type StatePair<T> = [T, SetterOrUpdater<T>];

// [state, show (set true), hide (set false)]
export type BoolState = [boolean, () => void, () => void];

export type DialogData = [boolean, () => void];
// A simplifier for dialogs: [0] shows the dialog, [1] is used in the dialog
export type DialogState = [() => void, DialogData];

const log = MakeLogger('helpers');
const err = MakeError('helpers-err');

/**
 * A short cut for on/off states to make some things (like dialogs) cleaner
 *
 * @returns {BoolState} [state, trueSetter(), falseSetter()]
 */
export function useBoolState(initial: boolean): BoolState {
  const [state, setState] = useState(initial);
  return [state, () => setState(false), () => setState(true)];
}

export function useBoolRecoilState(atom: RecoilState<boolean>): BoolState {
  const [state, setState] = useRecoilState(atom);
  return [state, () => setState(false), () => setState(true)];
}

export function useDialogState(): DialogState {
  const [isHidden, setHidden] = useState(true);
  return [() => setHidden(false), [isHidden, () => setHidden(true)]];
}

export type AtomEffectParams<T> = {
  node: RecoilState<T>;
  trigger: 'get' | 'set';
  // Callbacks to set or reset the value of the atom.
  // This can be called from the atom effect function directly to initialize the
  // initial value of the atom, or asynchronously called later to change it.
  setSelf: (
    newVal:
      | T
      | DefaultValue
      | Promise<T | DefaultValue> // Only allowed for initialization at this time
      | ((curVal: T | DefaultValue) => T | DefaultValue),
  ) => void;
  resetSelf: () => void;

  // Subscribe to changes in the atom value.
  // The callback is not called due to changes from this effect's own setSelf().
  onSet: (
    func: (newValue: T | DefaultValue, oldValue: T | DefaultValue) => void,
  ) => void;
};

export function translateToMainEffect<T>(
  toString: (input: T) => string,
  fromString: (input: string) => T | void,
) {
  return ({ node, trigger, setSelf, onSet }: AtomEffectParams<T>): void => {
    if (trigger === 'get') {
      ReadFromStorage(node.key)
        .then((value) => {
          if (value) {
            const data = fromString(value);
            if (data) {
              setSelf(data);
            }
          }
        })
        .catch((rej) => {
          err(`${node.key} Get failed in translateToMainEffect`);
          err(rej);
        });
    }
    onSet((newVal, oldVal) => {
      if (newVal instanceof DefaultValue) {
        return;
      }
      const newStr = toString(newVal);
      if (oldVal instanceof DefaultValue || newStr !== toString(oldVal))
        WriteToStorage(node.key, newStr).catch((reason) => {
          err(`${node.key} save to main failed`);
        });
    });
  };
}

/**
 * An Atom effect to acquire the value from main, and save it back when
 * modified, after processing it from the original type to JSON using Pickling.
 *
 * @param {boolean} asyncUpdates
 * Optionally true if you also need to actively respond to server changes
 *
 * @returns an AtomEffect<T>
 */
export function bidirectionalSyncWithTranslateEffect<T>(
  toPickleable: (val: T) => unknown,
  fromUnpickled: (val: unknown) => T | void,
  asyncUpdates?: boolean,
): AtomEffect<T> {
  return ({
    node,
    trigger,
    setSelf,
    onSet,
  }: AtomEffectParams<T>): (() => void) | void => {
    if (trigger === 'get') {
      log(`Get trigger for ${node.key}`);
      ReadFromStorage(node.key)
        .then((value) => {
          log(`Got a value from the server for ${node.key}`);
          if (value) {
            log(value);
            log('***');
            const data = fromUnpickled(Unpickle(value));
            log(data);
            if (data) {
              log(`Setting Self for ${node.key}`);
              setSelf(data);
            }
          }
        })
        .catch(onRejected(`${node.key} Get failed in bidirectional sync`));
    }
    let lKey: ListenKey | null = null;
    if (asyncUpdates) {
      lKey = Subscribe(node.key, (val: unknown) => {
        const theRightType = fromUnpickled(val);
        if (theRightType) {
          log(`Async data for ${node.key}:`);
          log(theRightType);
          setSelf(theRightType);
        } else {
          err(`Async invalid data received for ${node.key}:`);
          err(val);
        }
      });
    }
    onSet((newVal, oldVal) => {
      if (newVal instanceof DefaultValue) {
        return;
      }
      const newPickled = Pickle(toPickleable(newVal));
      if (
        oldVal instanceof DefaultValue ||
        Pickle(toPickleable(oldVal)) !== newPickled
      ) {
        log(`Saving ${node.key} back to server...`);
        WriteToStorage(node.key, newPickled)
          .then(() => log(`${node.key} saved properly`))
          .catch(onRejected(`${node.key} save to main failed`));
      }
    });

    if (asyncUpdates) {
      return () => {
        if (lKey) {
          log(`Unsubscribing listener for ${node.key}`);
          Unsubscribe(lKey);
        }
      };
    }
  };
}

export function syncWithMainEffect<T>(asyncUpdates?: boolean): AtomEffect<T> {
  return bidirectionalSyncWithTranslateEffect<T>(
    (a) => a as unknown,
    (a) => a as T,
    asyncUpdates,
  );
}

/*
To get off of the AtomEffects API, I need three things:
1. a 'get' mechanism to initialize backing atoms
2. a 'set' mechanism to send data back to the server when it's changed (for RW atoms)
3. an async update mechanism to update backing atoms

#1 can be accomplished by using a helper component with an effect to pull the value
from the server, and store it back to the backing atom

#2 should just work with selectors, no magic involved, really

#3 can be in the same helper component for #1
*/

// Initial value 'getter' effect:
// for each atom that's registered, queue up a query to load the initial value
// Set up handlers so that those values update the backing atoms

const registeredAtoms: RecoilState<unknown>[] = [];

export function getAtomValuesEffect(): void {
  for (const theAtom of registeredAtoms) {
    log('Registered Atom:');
    log(theAtom);
  }
}

// This is a react component to enable the IPC subsystem to talk to the store,
// keep track of which mode we're in, and generally deal with "global" silliness
export function Utilities(): JSX.Element {
  useEffect(InitialWireUp);
  const onFolderSize = useRecoilCallback(({ set }) => (val: unknown) => {
    log('Got folder-size message:');
    log(val);
    if (
      Type.hasStr(val, 'name') &&
      Type.has(val, 'size') &&
      Type.isNumber(val.size)
    ) {
      set(folderFileCountFamily(val.name), val.size);
    }
  });
  const onStateUpdate = useRecoilCallback(({ set }) => (val: unknown) => {
    if (Type.isString(val)) {
      set(computeState, val);
    }
  });
  const onDupeFiles = useRecoilCallback(({ set }) => (val: unknown) => {
    if (Type.isMapOf(val, Type.isString, Type.isSetOfString)) {
      set(dupeFilesState, val);
    }
  });
  useEffect(() => {
    const key = Subscribe('main-process-status', (val: unknown) => {
      if (Type.isString(val)) {
        log(`Main status: ${val}`);
      } else {
        err('Invalid value in main-process-status:');
        err(val);
      }
    });
    const folderSizeKey = Subscribe('folder-size', onFolderSize);
    const setStateKey = Subscribe('compute-state', onStateUpdate);
    const setDupesKey = Subscribe('dupe-files', onDupeFiles);
    return () => {
      Unsubscribe(key);
      Unsubscribe(folderSizeKey);
      Unsubscribe(setStateKey);
      Unsubscribe(setDupesKey);
    };
  });
  /*
  const handleWidthChange = useRecoilCallback(
    ({ set }) => (ev: MediaQueryList | MediaQueryListEvent) => {
      // Do something with the media query change here if you'd like
      // i.e. set(isMiniplayerState, ev.matches);
    },
  );
  useEffect(() => {
    SubscribeMediaMatcher('(max-width: 499px)', handleWidthChange);
    return () => UnsubscribeMediaMatcher(handleWidthChange);
  });
  */
  return <></>;
}

export type SpinnerProps = {
  children: JSX.Element | JSX.Element[];
  label?: string;
};

export function Spinner({ children, label }: SpinnerProps): JSX.Element {
  const theSpinner = (
    <div>
      <img src={logo} className="App-logo" alt="logo" />
      {label ? label : 'Please wait...'}
    </div>
  );
  return <Suspense fallback={theSpinner}>{children}</Suspense>;
}

// eslint-disable-next-line
function onRejected(msg?: string): (reason: any) => void {
  return (reason: any) => {
    if (Type.isString(msg)) {
      err(msg);
    }
    err(reason);
  };
}
