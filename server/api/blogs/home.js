import markdownParser from '@nuxt/content/transformers/markdown'
// File: server/api/blogs/home.js
export default defineEventHandler(async (event) => {
    

    // Access the Cloudflare context
    const { cloudflare } = event.context;

    // Access the D1 database from the context
    // Check if cloudflare.DB is defined
    if (!cloudflare || !cloudflare.env || !cloudflare.env.DB) {
        return new Response(cloudflare, { status: 500 });
    }
    const DB = cloudflare.env.DB; // 'DB' is the binding name from your wrangler.toml


    const { results } = await DB.prepare(`
        SELECT * FROM blog_articles ORDER BY id DESC
    `).all();

    const parsedArticles = await Promise.all(
        results.map(async article => {
            return { ...await markdownParser.parse("<some-id>", article.content), id: article.id };
        })
    );
    return parsedArticles;
});
