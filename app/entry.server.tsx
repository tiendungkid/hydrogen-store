import type {EntryContext} from '@shopify/remix-oxygen';
import {RemixServer} from '@remix-run/react';
import isbot from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    connectSrc: [
      "'self'",
      'https://track.uppromote.com',
      'https://cdn.uppromote.com',
      'https://d1639lhkj5l89m.cloudfront.net',
      '*',
    ],
    defaultSrc: [
      'https://shopify.com',
      'https://track.uppromote.com',
      'https://cdn.uppromote.com',
      'https://d1639lhkj5l89m.cloudfront.net',
      'data:',
      'blob:',
      '*',
    ],
    imgSrc: ['*', 'data:'],
    styleSrc: ['https://d1639lhkj5l89m.cloudfront.net'],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
