export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname.replace('/sport-loungev3', '') || '/';

    try {
      const object = await env.STATIC_BUCKET.get(path);
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        return new Response(object.body, { headers });
      }
    } catch {}

    const fallback = await env.STATIC_BUCKET.get('index.html');
    if (fallback) {
      const headers = new Headers();
      fallback.writeHttpMetadata(headers);
      headers.set('etag', fallback.httpEtag);
      return new Response(fallback.body, { headers });
    }

    return new Response('Not Found', { status: 404 });
  },
};
