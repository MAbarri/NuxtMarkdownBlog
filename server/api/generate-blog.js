// server/api/generate-blog.js
import { generateTrendingPromptAndFilename, generateBlog } from '../utils/generator.js';

export default defineEventHandler(async (event) => {
    try {
        // Access the Cloudflare context
        const { cloudflare } = event.context;

        // Access the D1 database from the context
        // Check if cloudflare.DB is defined
        if (!cloudflare || !cloudflare.env || !cloudflare.env.DB) {
            return new Response(cloudflare, { status: 500 });
        }
        const DB = cloudflare.env.DB; // 'DB' is the binding name from your wrangler.toml
        // Generate a trending blog prompt and filename
        const { generatedPrompt, filename, randomNiche } = await generateTrendingPromptAndFilename();

        // Call your blog generation function
        const { content, title, tags } = await generateBlog(generatedPrompt, 2000, 1500, "md", filename, "English", randomNiche);
        console.log('########### Article Generation Finished :', content.length)
        // Respond with a success message
        // return { message: 'Blog generated successfully', filename };

        try {
            console.log('saving into D1')

            const { results } = await DB.prepare(`
            INSERT INTO blog_articles (title, content, filename, niche, tags)
            VALUES (?, ?, ?, ?, ?)
            `)
                .bind(title, content, filename, randomNiche, tags)
                .run();
            console.log('D1 Result : ', results)
            return { message: 'Blog saved successfully!', results };
        } catch (err) {
            console.log('D1 Error : ', err.message)
            return { error: 'Failed to save blog: ' + err.message };
        }

    } catch (error) {
        console.error('Error generating blog:', error);
        // Return an error response
        return { error: 'Failed to generate blog' };
    }
});
