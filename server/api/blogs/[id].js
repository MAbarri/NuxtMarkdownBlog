import markdownParser from '@nuxt/content/transformers/markdown'

// File: server/api/blogs/[id].js
export default defineEventHandler(async (event) => {
    const id = event.context.params.id;
    

    // Access the Cloudflare context
    const { cloudflare } = event.context;

    // Access the D1 database from the context
    // Check if cloudflare.DB is defined
    if (!cloudflare || !cloudflare.env || !cloudflare.env.DB) {
        return new Response(cloudflare, { status: 500 });
    }
    const DB = cloudflare.env.DB; // 'DB' is the binding name from your wrangler.toml


    const { results } = await DB.prepare(`
        SELECT * FROM blog_articles WHERE id = ?
    `).bind(id).all();

    if (results.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Article not found' });
    }
    const article = { ...await markdownParser.parse("<some-id>", results[0].content), id: results[0].content.id };
    return article;
});
