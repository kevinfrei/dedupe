// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import { MakeError } from '@freik/core-utils';
import { IpcRenderer, ipcRenderer } from 'electron';
// import isDev from 'electron-is-dev';
const isDev = true;

const err = MakeError('renderer-err');

interface MyWindow extends Window {
  ipc: IpcRenderer | undefined;
  isDev: boolean | undefined;
  initApp: undefined | (() => void);
  ipcSet: boolean | undefined;
}

declare let window: MyWindow;

// This will expose the ipcRenderer (and isDev) interfaces for use by the
// React components, then, assuming the index.js has already be invoked, it
// calls the function to start the app, thus ensuring that the app has access
// to the ipcRenderer to enable asynchronous callbacks to affect the Undux store

window.addEventListener('DOMContentLoaded', () => {
  err('DOM Content loaded');
  window.ipc = ipcRenderer;
  if (isDev) {
    window.isDev = isDev;
  }
  if (window.initApp) {
    err('Calling initApp');
    window.initApp();
  } else {
    err('FAILURE: No window.initApp() attached.');
  }
});
