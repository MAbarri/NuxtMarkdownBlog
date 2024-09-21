export default defineEventHandler(async (event) => {

    // Access the Cloudflare context
    const { cloudflare } = event.context;

    // Access the D1 database from the context
    // Check if cloudflare.DB is defined
    if (!cloudflare || !cloudflare.env || !cloudflare.env.DB) {
        return new Response(cloudflare, { status: 500 });
    }
    const DB = cloudflare.env.DB; // 'DB' is the binding name from your wrangler.toml


    try {
        // Delete all articles
        await DB.prepare(`DELETE FROM blog_articles`).run();
        return { message: 'All articles deleted successfully!' };
    } catch (err) {
        return { error: 'Failed to delete articles: ' + err.message };
    }
});
