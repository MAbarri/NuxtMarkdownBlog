// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: [
    "/_nuxt/*",
    "/",
    "/about",
    "/android-chrome-192x192.png",
    "/android-chrome-512x512.png",
    "/apple-touch-icon.png",
    "/blogs",
    "/categories",
    "/favicon-16x16.png",
    "/favicon-32x32.png",
    "/favicon.ico",
    "/not-found.jpg",
    "/riyad.jpg",
    "/blogs-img/blog.jpg",
    "/blogs-img/blog1.jpg",
    "/blogs-img/blog2.jpg",
    "/blogs-img/blog3.jpg",
    "/blogs-img/blog4.jpg",
    "/blogs-img/blog5.jpg",
    "/blogs-img/blog6.jpg",
    "/categories/ business acumen",
    "/categories/ innovation",
    "/categories/ leadership",
    "/categories/entrepreneurship skills",
    "/api/_content/cache.1726505114581.json",
    "/blogs/entrepreneurship/what_are_the_essential_skil"
  ]
};

// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/Users/abarri/Desktop/workspace/blogging/nuxt/nuxt-blog/.wrangler/tmp/pages-EIJNJU/bundledWorker-0.06839461381485656.mjs";
import { isRoutingRuleMatch } from "/Users/abarri/Desktop/workspace/blogging/nuxt/nuxt-blog/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/Users/abarri/Desktop/workspace/blogging/nuxt/nuxt-blog/.wrangler/tmp/pages-EIJNJU/bundledWorker-0.06839461381485656.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        if (worker.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return worker.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=3dwcqasrwu3.js.map
