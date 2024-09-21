import { handle } from './.output/server/index.mjs'; // Reference to Nuxt output

export default {

    async fetch(request, env, ctx) {
        console.log('env', env)
        return new Response('Hello from Worker!', { status: 200 });
    }
    // async fetch(request, env, ctx) {
    //     // Set up env variable for D1 binding in your Nuxt environment
    //     request.context.env = { DB: env.DB };

    //     // Pass the request to Nuxt
    //     return handle(request);
    // },
};
