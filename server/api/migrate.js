export default defineEventHandler(async (event) => {
    

    // Access the Cloudflare context
    const { cloudflare } = event.context;

    // Access the D1 database from the context
    // Check if cloudflare.DB is defined
    if (!cloudflare || !cloudflare.env || !cloudflare.env.DB) {
        return new Response(cloudflare, { status: 500 });
    }
    const DB = cloudflare.env.DB; // 'DB' is the binding name from your wrangler.toml

    const migrationSQL = ` CREATE TABLE IF NOT EXISTS blog_articles ( id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL, filename TEXT NOT NULL, niche TEXT, tags TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ); `;

    try {
        await DB.exec(migrationSQL);
        const { results } = await DB.prepare('SELECT name FROM sqlite_master WHERE type="table" AND name="blog_articles";').all();

        return results.length > 0 ? { message: 'Migration completed successfully!, Table exists!' } : { error: 'Table not found!' };
    } catch (err) {
        return { error: 'Migration failed: ' + err.message };
    }
});
