import { DebouncedEvery, MakeError } from '@freik/core-utils';
import { BrowserWindow, dialog } from 'electron';
import isDev from 'electron-is-dev';
import { OpenDialogOptions } from 'electron/main';
import * as path from 'path';
import { RegisterListeners } from './Communication';
import { OnWindowCreated } from './electronSetup';
import {
  GetBrowserWindowPos,
  LoadWindowPos,
  SaveWindowPos,
  WindowPosition,
} from './persist';

// This should control access to the main window
// No one should keep any references to the main window (so it doesn't leak)
// which is the entire reason for this module's existence.

const err = MakeError('window-err');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null;

export function HasWindow(): boolean {
  return mainWindow !== null;
}

export function SendToMain(channel: string, ...data: any[]): void {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
}

const windowPos: WindowPosition = LoadWindowPos();

// This will get called after a 1 second delay (and subsequent callers will
// not be registered if one is waiting) to not be so aggressive about saving
// the window position to disk
const windowPosUpdated = DebouncedEvery(() => {
  // Get the window state & save it
  if (mainWindow) {
    windowPos.isMaximized = mainWindow.isMaximized();
    if (!windowPos.isMaximized) {
      // only update bounds if the window isn’t currently maximized
      windowPos.bounds = mainWindow.getBounds();
    }
    SaveWindowPos(windowPos);
  }
}, 1000);

export async function CreateWindow(
  windowCreated: OnWindowCreated,
): Promise<void> {
  RegisterListeners();

  // Create the window, but don't show it just yet
  mainWindow = new BrowserWindow({
    ...GetBrowserWindowPos(windowPos),
    title: 'EMP: Electron Music Player',
    // backgroundColor: '#282c34', // Unnecessary if you're not showing :)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      webSecurity: !isDev,
      contextIsolation: false,
    },
    show: false,
    minWidth: 270,
    minHeight: 308,
  })
    .on('closed', () => {
      // Clear the reference to the window object.
      // Usually you would store windows in an array.
      // If your app supports multiple windows, this is the time when you should
      // delete the corresponding element.
      mainWindow = null;
    })
    .on('ready-to-show', () => {
      // Wait to show the main window until it's actually ready...
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        // TODO: On Mac, there's 'full screen max' and then 'just big'
        // This code makes full screen max turn into just big
        if (windowPos.isMaximized) {
          mainWindow.maximize();
        }
        // Call the user specified "ready to go" function
        windowCreated().catch(err);
      }
    })
    // Save the window position when it's changed:
    .on('resize', windowPosUpdated)
    .on('move', windowPosUpdated);

  // Load the base URL
  try {
    await mainWindow.loadURL(
      isDev
        ? `http://localhost:${process.env.PORT || 3001}`
        : // If this file moves, you have to fix this to make it work for release
          `file://${path.join(__dirname, '../index.html')}`,
    );
  } catch (e) {
    err(e);
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

export async function ShowOpenDialog(
  options: OpenDialogOptions,
): Promise<string[] | void> {
  if (!mainWindow) {
    return;
  }
  const res = await dialog.showOpenDialog(mainWindow, options);
  if (res.canceled) {
    return;
  }
  return res.filePaths;
}
