import { buildPushPayload, type VapidKeys } from '@block65/webcrypto-web-push';
import { devicesOf, removeDevices } from './subscriptions';

/** What the phone shows; the app's service worker (Angular ngsw) reads this shape. */
export interface PhoneNotice {
  readonly title: string;
  readonly body: string;
  /** App path opened by a tap, e.g. `/evento/abc`. */
  readonly url: string;
  /** A newer notice with the same tag replaces the older one on the phone. */
  readonly tag: string;
}

export function ngswPayload(notice: PhoneNotice, appOrigin: string) {
  return {
    notification: {
      title: notice.title,
      body: notice.body,
      icon: `${appOrigin}/icons/android-chrome-192x192.png`,
      // Android paints only the alpha of the status-bar icon: a white silhouette, not the app icon.
      badge: `${appOrigin}/icons/notification-badge.png`,
      tag: notice.tag,
      renotify: true,
      lang: 'pt-BR',
      data: {
        url: notice.url,
        onActionClick: {
          default: { operation: 'navigateLastFocusedOrOpen', url: notice.url },
        },
      },
    },
  };
}

/**
 * Sends the notice to every phone and computer of the person. Devices the push service says
 * are gone (404/410) are forgotten. Returns how many received it.
 */
export async function pushToPerson(
  kv: KVNamespace,
  uid: string,
  notice: PhoneNotice,
  vapid: VapidKeys,
  appOrigin: string,
  fetcher: typeof fetch = fetch,
): Promise<number> {
  const devices = await devicesOf(kv, uid);
  const gone: string[] = [];
  let delivered = 0;
  await Promise.all(
    devices.map(async (device) => {
      try {
        const payload = await buildPushPayload(
          { data: ngswPayload(notice, appOrigin), options: { ttl: 60 * 60 * 24, urgency: 'high' } },
          device,
          vapid,
        );
        const response = await fetcher(device.endpoint, payload);
        if (response.status === 404 || response.status === 410) gone.push(device.endpoint);
        else if (response.ok) delivered++;
      } catch {
        // One broken device never stops the others.
      }
    }),
  );
  await removeDevices(kv, uid, gone);
  return delivered;
}
