import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to escape HTML characters
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Parse .env file manually to avoid dependency issues
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.warn('.env file not found. Pre-rendering may fail if keys are missing in env.');
    return process.env;
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = { ...process.env };
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*["']?([^"'\r\n]+)["']?/);
    if (match) {
      env[match[1]] = match[2];
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const frontendUrl = env.FRONTEND_URL || 'https://aicreatorhub.com';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key. Aborting pre-rendering.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function replaceMeta(html, title, description, url, imageUrl, jsonLd, bodyContent = '') {
  let result = html;
  
  // 1. Replace Title
  result = result.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  
  // 2. Replace Description
  result = result.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(description)}" />`);
  
  // 3. Remove existing og: / twitter: / canonical / json-ld tags to avoid duplicates
  result = result.replace(/<meta property="og:[^>]*>/g, '');
  result = result.replace(/<meta name="twitter:[^>]*>/g, '');
  result = result.replace(/<link rel="canonical"[^>]*>/g, '');
  result = result.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  
  // 4. Build new head tags block
  const newTags = `
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  `;
  
  // Insert before </head>
  result = result.replace('</head>', `${newTags}\n</head>`);
  
  // 5. Inject pre-rendered body inside <div id="root">
  if (bodyContent) {
    result = result.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);
  }
  
  return result;
}

async function start() {
  console.log('🚀 Starting pre-rendering pipeline...');
  const distDir = path.join(__dirname, 'dist');
  const templatePath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(templatePath)) {
    console.error(`Vite build output template not found at ${templatePath}. Run "npm run build" first.`);
    process.exit(1);
  }
  
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');
  
  // 1. Fetch prompts from database
  console.log('📡 Fetching published prompts from Supabase...');
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select(`
      *,
      author:profiles!prompts_author_id_fkey(full_name, username)
    `)
    .eq('status', 'published')
    .is('deleted_at', null);
    
  if (error) {
    console.error('Error fetching prompts from Supabase:', error.message);
    process.exit(1);
  }
  
  console.log(`✅ Loaded ${prompts.length} published prompts.`);
  
  // 2. Generate Prompt Detail Pages
  for (const prompt of prompts) {
    const authorName = prompt.author?.username ? `@${prompt.author.username}` : (prompt.author?.full_name || 'Anonymous');
    const title = `${prompt.title} - AI Prompt by ${authorName}`;
    const description = `Copy and use this prompt: "${prompt.prompt_text ? prompt.prompt_text.slice(0, 150) : ''}...". Discover, favorite and copy top AI prompts on AI Creator Hub.`;
    const slugOrId = prompt.slug || prompt.id;
    const url = `${frontendUrl}/details/${slugOrId}`;
    const imageUrl = prompt.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
    
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": prompt.title,
      "description": prompt.description || '',
      "author": {
        "@type": "Person",
        "name": authorName
      },
      "datePublished": prompt.created_at,
      "image": imageUrl
    };
    
    // Build pre-rendered static content for SEO crawlers
    const staticBody = `
      <div class="prerendered-details" style="max-width: 800px; margin: 40px auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h1 style="font-size: 28px; margin-bottom: 8px;">${escapeHtml(prompt.title)}</h1>
        <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Uploaded by <strong>${escapeHtml(authorName)}</strong></p>
        <div style="margin-bottom: 24px; text-align: center;">
          <img src="${imageUrl}" alt="${escapeHtml(prompt.title)}" style="max-width: 100%; max-height: 450px; border-radius: 8px; object-fit: cover;" />
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e9ecef;">
          <h2 style="font-size: 18px; margin-top: 0; margin-bottom: 12px;">Prompt Instructions</h2>
          <pre style="white-space: pre-wrap; word-break: break-all; margin: 0; font-family: monospace; font-size: 15px; color: #333;">${escapeHtml(prompt.prompt_text)}</pre>
        </div>
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 18px; margin-bottom: 8px;">Description</h2>
          <p style="line-height: 1.6; color: #444; margin: 0;">${escapeHtml(prompt.description || 'No description provided.')}</p>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 16px; display: flex; gap: 24px; font-size: 14px; color: #555;">
          <span>👁️ <strong>${prompt.views_count || 0}</strong> Views</span>
          <span>📋 <strong>${prompt.copies_count || 0}</strong> Copies</span>
          <span>❤️ <strong>${prompt.likes_count || 0}</strong> Likes</span>
        </div>
      </div>
    `;
    
    const finalHtml = replaceMeta(templateHtml, title, description, url, imageUrl, jsonLd, staticBody);
    
    // Write UUID directory page
    const idDir = path.join(distDir, 'details', prompt.id);
    fs.mkdirSync(idDir, { recursive: true });
    fs.writeFileSync(path.join(idDir, 'index.html'), finalHtml);
    
    // Write Slug directory page if slug is defined
    if (prompt.slug) {
      const slugDir = path.join(distDir, 'details', prompt.slug);
      fs.mkdirSync(slugDir, { recursive: true });
      fs.writeFileSync(path.join(slugDir, 'index.html'), finalHtml);
    }
  }
  console.log('✅ Generated static details pages successfully.');
  
  // 3. Generate Static Landing/Explore/Policies Pages
  const pages = [
    {
      route: '',
      title: 'AI Creator Hub – Discover & Copy High-Quality AI Prompts',
      description: 'Find the best AI image, coding, marketing, and text prompts for Midjourney, ChatGPT, Stable Diffusion, and dalle.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "AI Creator Hub",
        "url": frontendUrl
      }
    },
    {
      route: 'explore',
      title: 'Explore AI Prompts | Search AI Prompts Marketplace',
      description: 'Browse, filter, and search high-quality AI prompts by category, creators, views, or copies.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Explore Prompts",
        "url": `${frontendUrl}/explore`
      }
    },
    {
      route: 'settings/help-center',
      title: 'Help Center & FAQs | AI Creator Hub Support',
      description: 'Frequently asked questions, guide on how to create prompts, subscription policies, and customer support.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Help Center",
        "url": `${frontendUrl}/settings/help-center`
      }
    },
    {
      route: 'settings/privacy-policy',
      title: 'Privacy Policy | AI Creator Hub',
      description: 'Our data protection guidelines, how we handle user metrics, cookies, and secure transactions.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Privacy Policy",
        "url": `${frontendUrl}/settings/privacy-policy`
      }
    },
    {
      route: 'settings/terms-of-service',
      title: 'Terms of Service | AI Creator Hub',
      description: 'Terms, user responsibilities, copyright guidelines, AI generated content rules, and platform usage guidelines.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Terms of Service",
        "url": `${frontendUrl}/settings/terms-of-service`
      }
    },
    {
      route: 'settings/copyright-policy',
      title: 'Copyright & DMCA Policy | AI Creator Hub',
      description: 'Copyright policies, prompt ownership rights, DMCA guidelines, and instructions for reporting content violations.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Copyright Policy",
        "url": `${frontendUrl}/settings/copyright-policy`
      }
    }
  ];

  for (const pageItem of pages) {
    const url = pageItem.route ? `${frontendUrl}/${pageItem.route}` : frontendUrl;
    const finalHtml = replaceMeta(templateHtml, pageItem.title, pageItem.description, url, pageItem.imageUrl, pageItem.jsonLd);
    
    if (pageItem.route === '') {
      // Overwrite main root index.html with Home page SEO
      fs.writeFileSync(templatePath, finalHtml);
    } else {
      const pageDir = path.join(distDir, pageItem.route);
      fs.mkdirSync(pageDir, { recursive: true });
      fs.writeFileSync(path.join(pageDir, 'index.html'), finalHtml);
    }
  }
  
  console.log('✅ Generated static landing, explore, and policy pages.');

  // 4. Generate dynamic sitemap.xml
  console.log('🗺️ Generating dynamic sitemap.xml...');
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  const nowStr = new Date().toISOString().split('T')[0];
  const staticUrls = ['', '/explore', '/login', '/dashboard', '/settings/help-center', '/settings/privacy-policy', '/settings/terms-of-service', '/settings/copyright-policy'];
  
  staticUrls.forEach(url => {
    sitemapXml += `  <url>\n`;
    sitemapXml += `    <loc>${frontendUrl}${url}</loc>\n`;
    sitemapXml += `    <lastmod>${nowStr}</lastmod>\n`;
    sitemapXml += `    <changefreq>${url === '' || url === '/explore' ? 'daily' : 'monthly'}</changefreq>\n`;
    sitemapXml += `    <priority>${url === '' ? '1.0' : url === '/explore' ? '0.9' : '0.4'}</priority>\n`;
    sitemapXml += `  </url>\n`;
  });

  for (const prompt of prompts) {
    const lastmod = prompt.updated_at 
      ? new Date(prompt.updated_at).toISOString().split('T')[0] 
      : nowStr;
    const slugOrId = prompt.slug || prompt.id;
    sitemapXml += `  <url>\n`;
    sitemapXml += `    <loc>${frontendUrl}/details/${slugOrId}</loc>\n`;
    sitemapXml += `    <lastmod>${lastmod}</lastmod>\n`;
    sitemapXml += `    <changefreq>weekly</changefreq>\n`;
    sitemapXml += `    <priority>0.6</priority>\n`;
    sitemapXml += `  </url>\n`;
  }
  sitemapXml += `</urlset>`;
  
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml);
  console.log('✅ Generated dynamic sitemap.xml successfully.');
  console.log('🎉 Pre-rendering pipeline completed successfully!');
}

start().catch(err => {
  console.error('❌ Pre-rendering failed:', err);
  process.exit(1);
});
