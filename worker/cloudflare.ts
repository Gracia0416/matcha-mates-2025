import handler from 'vinext/server/fetch-handler';

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    // OpenAI identity headers from a visitor are never trusted on independent hosting.
    const headers = new Headers(request.headers);
    for (const key of Array.from(headers.keys())) {
      if (key.startsWith('oai-authenticated-')) headers.delete(key);
    }
    return handler.fetch(new Request(request, { headers }), env, ctx);
  },
};
