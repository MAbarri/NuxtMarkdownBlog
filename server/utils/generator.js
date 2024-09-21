// Importing dependencies using ES6 import syntax
import axios from 'axios';
import retry from 'retry';
// import fs from 'fs';
// import path from 'path';
import nichesWithTopics from './niches.json' assert { type: 'json' };
import { format as formatDate } from 'date-fns'; // Use date-fns for formatting dates

// Load API keys from config.js (make sure config.js exports the keys)
import { COHERE_API_KEY, PIXABAY_API_KEY } from './config.js';
// console.log('COHERE_API_KEY, PIXABAY_API_KEY', COHERE_API_KEY, PIXABAY_API_KEY)

// Utility Functions
function formatDateWithOrdinalSuffix(date) {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const suffix = getOrdinalSuffix(day);
    return `${day}${suffix} ${month} ${year}`;
}

function getOrdinalSuffix(day) {
    if (11 <= day && day <= 13) return 'th';
    const lastDigit = day % 10;
    if (lastDigit === 1) return 'st';
    if (lastDigit === 2) return 'nd';
    if (lastDigit === 3) return 'rd';
    return 'th';
}

function insertImagesIntoParagraphs(paragraphs, imageUrlsWithKeywords) {
    paragraphs[0] = `${paragraphs[0]}\n![Featured Image](${imageUrlsWithKeywords[0]})`;
    const indices = distributeImageIndices(paragraphs, imageUrlsWithKeywords.length);
    indices.forEach((idx, i) => {
        paragraphs[idx] = `${paragraphs[idx]}\n![Image](${imageUrlsWithKeywords[i + 1]})`;
    });
    return paragraphs;
}

function distributeImageIndices(paragraphs, maxImages) {
    const indices = Array.from({ length: paragraphs.length - 2 }, (_, i) => i + 1);
    return indices.sort(() => 0.5 - Math.random()).slice(0, maxImages - 1);
}

async function generateCohereResponse(prompt, maxTokens, temperature) {
    try {
        let params = {
            model: 'command-r-plus',
            prompt: prompt
        };
        if (maxTokens) params.max_tokens = maxTokens;
        if (maxTokens) params.temperature = temperature;
        const response = await axios.post(
            'https://api.cohere.com/v1/generate', // Replace with the correct endpoint if needed
            params,
            {
                headers: {
                    'Authorization': `Bearer ${COHERE_API_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        // Extract and return the generated text
        const generatedText = response.data.generations[0]?.text?.trim();
        if (!generatedText) {
            throw new Error('No generated text found in response');
        }
        return generatedText;
    } catch (error) {
        console.error('Error generating text from Cohere:', error.message);
        throw error; // Re-throw error to be handled by caller
    }
}


async function generateImageTopics(mainSubject, content) {
    /**
     * Generate SEO meta keywords based on the provided content.
     * @param {string} mainSubject - The main subject of the blog content.
     * @param {string} content - The blog content for generating meta keywords.
     * @returns {Promise<string>} - The generated SEO meta keywords based on the content.
     */

    // Prepare the prompt for keyword generation
    const keywordsPrompt = `
    Generate a list of SEO keywords relevant to the following blog content. The keywords should be separated by commas and should be highly relevant to the content. Here is the content:
    Main Subject: ${mainSubject} Subtitle: ${content}
    `;

    try {
        const keywords = await generateCohereResponse(keywordsPrompt, 50, 0.5);
        return keywords;
    } catch (error) {
        console.error(`Failed to generate keywords: ${error}`);
        return "default, keywords, here";
    }
}

// API-related Functions
async function generateImageUrlPixabay(metaKeywords, imagesLimit = 3) {
    const keywordsList = metaKeywords.split(',').map(keyword => keyword.trim());
    const randomKeyword = keywordsList.length ? keywordsList[Math.floor(Math.random() * keywordsList.length)] : 'default';

    try {
        const response = await axios.get('https://pixabay.com/api/', {
            params: {
                key: PIXABAY_API_KEY,
                q: randomKeyword,
                per_page: imagesLimit
            }
        });

        const imageData = response.data;
        if (imageData.hits.length) {
            return imageData.hits.map(hit => hit.largeImageURL);
            // return imageData.hits[0].largeImageURL;
        } else {
            console.log('No images found for the given keyword.');
            return generateImageUrlPixabay(metaKeywords, imagesLimit);
        }
    } catch (error) {
        console.error(`Error fetching image from Pixabay: ${error}`);
        return generateImageUrlPixabay(metaKeywords, imagesLimit);
    }
}

async function generateMetaKeywords(mainSubject) {
    const prompt = `Generate a list of SEO keywords relevant to the following blog content. The keywords should be separated by commas and should be highly relevant to the content. Main Subject: ${mainSubject}`;
    try {
        const result = await generateCohereResponse(prompt, 50, 0.5);
        return result;
    } catch (error) {
        console.error(`Failed to generate keywords: ${error}`);
        return 'default, keywords, here';
    }
}

async function generateArticleDescription(mainSubject) {
    const prompt = `Generate a concise, SEO-friendly description for a blog article. The description should be relevant to the main subject and should capture the essence of the content in a compelling way. Main Subject: ${mainSubject}`;
    try {
        const result = await generateCohereResponse(prompt, 50, 0.5);
        return result;
    } catch (error) {
        console.error(`Failed to generate article description: ${error}`);
        return 'This article covers important aspects of the main subject, providing insights and relevant information.';
    }
}

function fetchBlogContent(prompt, maxWords, minWords, language = 'English') {
    return new Promise((resolve, reject) => {
        const operation = retry.operation({
            retries: 3,
            minTimeout: 2000
        });

        operation.attempt(async () => {
            let blogPrompt = `
                I want you to act as a professional content writer with expertise in SEO and blog writing. 
                Create a comprehensive 2000-word blog article in ${language} on the topic provided. 
                The article should include:
                1. An outline with at least 15 headings and subheadings.
                2. Detailed, engaging content under each heading.
                3. SEO-optimized keywords and a meta description.
                Here is the topic: "${prompt}"
            `;

            if (maxWords) blogPrompt += `\nMaximum Words: ${maxWords}`;
            if (minWords) blogPrompt += `\nMinimum Words: ${minWords}`;

            try {
                const result = await generateCohereResponse(blogPrompt);
                resolve(result);
            } catch (error) {
                if (operation.retry(error)) {
                    return;
                }
                reject(new Error(`Failed to fetch blog content: ${error}`));
            }
        });
    });
}

// Helper function to replace special characters
function sanitizeFilename(filename) {
    // Remove special characters and replace spaces with underscores
    return filename.replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
}

// Function to generate a prompt and filename
async function generateTrendingPromptAndFilename(maxFilenameLength = 30) {
    // Step 2: Randomly select a niche
    const randomNiche = Object.keys(nichesWithTopics)[Math.floor(Math.random() * Object.keys(nichesWithTopics).length)];

    // Step 3: Randomly select a topic from the chosen niche
    const randomTopic = nichesWithTopics[randomNiche][Math.floor(Math.random() * nichesWithTopics[randomNiche].length)];

    // Step 4: Generate the prompt
    const prompt = `
        Generate a prompt for writing a blog article about a current trending topic in the ${randomNiche} niche, especially focusing on ${randomTopic}. 
        The prompt should highlight the relevance of the topic, provide engaging and insightful questions or points to cover, 
        and ensure that it captures the reader's attention. Make it a one-line reply.
    `;

    let generatedPrompt;
    try {
        generatedPrompt = await generateCohereResponse(prompt, 100, 0.5);
    } catch (error) {
        console.error(`Failed to generate trending prompt: ${error}`);
        generatedPrompt = "Create a blog article about a current trending topic, focusing on its relevance and providing engaging content.";
    }

    // Generate a suggested filename
    let filenameBase = sanitizeFilename(generatedPrompt.split('.')[0]);  // Take the first sentence and clean it
    filenameBase = filenameBase.substring(0, maxFilenameLength);  // Truncate to max filename length

    // Ensure filename does not end with an underscore and add suffix
    if (filenameBase.endsWith('_')) {
        filenameBase = filenameBase.slice(0, -1);
    }

    let filename = `${filenameBase}_article.md`;

    // Ensure final filename length is under max length (including extension)
    if (filename.length > maxFilenameLength) {
        filename = filename.substring(0, maxFilenameLength - 3) + '.md';
    }

    return { generatedPrompt, filename, randomNiche };
}
const generateBlog = async (prompt, maxWords = null, minWords = null, outputFormat = 'HTML', fileName = null, language = 'English', niche = "default") => {
    try {
        console.log(`Generating blog content for the topic: ${prompt}`);

        // Fetch blog content
        let blogContent = await fetchBlogContent(prompt, maxWords, minWords, language);
        console.log("Blog content generated successfully!");

        // Clean up the blog content
        console.log("Cleaning up the generated blog content...");
        blogContent = blogContent.replace("## Outline:", "").trim();
        blogContent = blogContent.replace("## Article:", "").trim();
        blogContent = blogContent.replace(/#### H4:/g, "####").replace(/### H3:/g, "###").replace(/## H2:/g, "##").replace(/# H1:/g, "#");

        console.log("Blog content cleaned up successfully!");

        // Ensure the first line is a top-level heading
        if (!blogContent.startsWith("# ")) {
            blogContent = `# ${prompt}\n\n${blogContent}`;
        }

        // Remove trailing punctuation from headings
        const lines = blogContent.split('\n').map(line => (line.startsWith('#') ? line.replace(/:$/, '') : line));

        // Insert images
        console.log("Generating & inserting images into the blog...");
        try {
            const maxImages = 4;
            const paragraphs = lines.filter(line => line.trim());

            if (paragraphs.length <= 1) {
                console.warn("Not enough paragraphs to distribute images.");
                return lines.join('\n');
            }

            let imageUrlsWithKeywords = [];
            for (let i = 0; i < Math.min(maxImages, paragraphs.length); i++) {
                const metaKeywords = await generateImageTopics(prompt, paragraphs[i]);
                console.log(`   -> keywords for paragraph ${i}: ${metaKeywords}`);
                imageUrlsWithKeywords = await generateImageUrlPixabay(metaKeywords);
            }

            blogContent = insertImagesIntoParagraphs(paragraphs, imageUrlsWithKeywords).join('\n\n');
            console.log("Image generation and insertion complete!");
        } catch (error) {
            console.error(`Failed to generate and insert images: ${error}`);
            console.warn("Continuing without inserting images...");
        }

        // Generate SEO meta description
        console.log(`Generating SEO meta description for the blog: ${prompt}`);
        const descriptionPrompt = `Generate a brief and relevant meta description for this content. Here is the content:\n${blogContent}`;
        let description;
        try {
            description = await generateCohereResponse(descriptionPrompt, 50, 0.5);
            console.log("SEO meta description generated successfully!");
        } catch (error) {
            console.error(`Failed to generate description: ${error}`);
            description = prompt; // Fallback to prompt as default
            console.warn(`Using the default description: ${description}`);
        }

        // Generate meta keywords
        console.log(`Generating meta keywords for the blog: ${prompt}`);
        let metaKeywords;
        try {
            metaKeywords = await generateMetaKeywords(prompt);
            console.log("Meta keywords generated successfully!");
        } catch (error) {
            console.error(`Failed to generate keywords: ${error}`);
            metaKeywords = prompt.split(',').join(' ');
            console.warn(`Using the blog title as meta keywords: ${metaKeywords}`);
        }

        // Save the blog content
        try {
            const today = new Date();
            const formattedToday = formatDate(today, 'yyyy-MM-dd');
            let articleDescription = await generateArticleDescription(prompt);

            const filteredKeywords = metaKeywords.split(',').filter(keyword => keyword.length <= 30).slice(0, 4);
            const jsonString = JSON.stringify(filteredKeywords);

            // let outputFileName = `${fileName || prompt}`;
            // const outputRootFolder = path.resolve('./content/blogs');
            // const outputFolder = path.join(outputRootFolder, niche);

            const regex = /!\[Featured Image\]\((.*?)\)/;
            const match = regex.exec(blogContent);
            const imageUrl = match.length ? match[1] : '';



            const headerContent = `---
title: ${JSON.stringify(prompt)}
date: "${formattedToday}"
description: ${JSON.stringify(articleDescription)}
image: ${imageUrl}
alt: ${JSON.stringify(prompt) }
ogImage: ${imageUrl}
tags: ${jsonString}
published: true
---\n`;

            const markdownContent = headerContent + blogContent;
            // @@@@@@@@@@@@@ SAVING INTO DISK @@@@@@@@@@@@@
            // // Ensure output directory exists
            // if (!fs.existsSync(outputFolder)) {
                //     fs.mkdirSync(outputFolder, { recursive: true });
                // }
                
                // const outputPath = path.join(outputFolder, outputFileName);
                // fs.writeFileSync(outputPath, markdownContent, 'utf-8');
                // console.log(`Blog content saved to: ${outputPath}`);
            // @@@@@@@@@@@@@ RETURNING RESULTS FOR D1 @@@@@@@@@@@@@
            return { content: markdownContent, title: prompt, tags: jsonString };
        } catch (error) {
            console.error(`Failed to save the blog content: ${error}`);
        }
    } catch (error) {
        console.error(`Failed to generate the blog: ${error}`);
    }
};

export {
    generateBlog,
    generateTrendingPromptAndFilename,
    formatDateWithOrdinalSuffix,
    generateImageUrlPixabay,
    generateMetaKeywords,
    generateArticleDescription,
    fetchBlogContent,
    insertImagesIntoParagraphs
};
