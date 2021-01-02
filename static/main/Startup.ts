import { MakeLogger } from '@freik/core-utils';
import { CommsSetup } from './Communication';

const log = MakeLogger('Startup', true);

/**
 * Called to set stuff up before *anything* else has been done.
 */
export function InitBeforeAnythingElse(): void {
  CommsSetup();
}

// This is awaited upon initial window creation
export async function WindowStartup(): Promise<void> {
  log('Window Startup Invoked!');
  setTimeout(() => {
    log('Interval hit');
    /*
    const now = new Date();
    const str = now.toTimeString();
    const trimmed = str.substr(0, str.indexOf(' '));
    asyncSend({ 'main-process-status': trimmed });*/
  }, 1000);
}
