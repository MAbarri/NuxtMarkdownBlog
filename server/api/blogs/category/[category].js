import markdownParser from '@nuxt/content/transformers/markdown'
// File: server/api/blogs/category/[category].js
export default defineEventHandler(async (event) => {
    const category = decodeURIComponent(event.context.params.category);

    // Access the Cloudflare context
    const { cloudflare } = event.context;

    // Access the D1 database from the context
    // Check if cloudflare.DB is defined
    if (!cloudflare || !cloudflare.env || !cloudflare.env.DB) {
        return new Response(cloudflare, { status: 500 });
    }
    const DB = cloudflare.env.DB; // 'DB' is the binding name from your wrangler.toml

    console.log('Request Category : ', category)
    const { results } = await DB.prepare(`
        SELECT * FROM blog_articles WHERE tags LIKE ?
    `).bind(`%${category}%`).all();
    console.log('results', results)
    const parsedArticles = await Promise.all(
        results.map(async article => {
            return { ...await markdownParser.parse("<some-id>", article.content), id: article.id };
        })
    );
    return parsedArticles;
});
