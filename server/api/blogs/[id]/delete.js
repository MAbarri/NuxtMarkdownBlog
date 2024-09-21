export default defineEventHandler(async (event) => {

    // Access the Cloudflare context
    const { cloudflare } = event.context;

    // Access the D1 database from the context
    // Check if cloudflare.DB is defined
    if (!cloudflare || !cloudflare.env || !cloudflare.env.DB) {
        return new Response(cloudflare, { status: 500 });
    }
    const DB = cloudflare.env.DB; // 'DB' is the binding name from your wrangler.toml


    const { id } = event.context.params; // Get the article ID from the route

    try {
        // Delete the specific article by its ID
        await DB.prepare(`DELETE FROM blog_articles WHERE id = ?`).bind(id).run();
        return { message: `Article with ID ${id} deleted successfully!` };
    } catch (err) {
        return { error: 'Failed to delete article: ' + err.message };
    }
});
