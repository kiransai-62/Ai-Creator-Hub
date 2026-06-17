import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// S-9: CSRF Stance
// CSRF not required — all state-changing requests use Authorization: Bearer header, no cookies.
// If any cookie is ever set, add csurf middleware immediately.


import userRoutes from './routes/userRoutes';
import promptRoutes from './routes/promptRoutes';
import { supabase } from './db/supabase';

// S-7: Restrict CORS to frontend domain instead of allowing all origins
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ 
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// S-11: Backend Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/prompts', promptRoutes);

// Dynamic sitemap.xml endpoint for SEO
app.get('/sitemap.xml', async (req, res) => {
  try {
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('id, slug, updated_at')
      .eq('status', 'published');

    if (error) throw error;

    res.header('Content-Type', 'application/xml');
    
    const baseUrl = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',')[0].trim() 
      : 'https://aicreatorhub.com';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Main static routes
    const staticUrls = ['', '/explore', '/login', '/dashboard'];
    const nowStr = new Date().toISOString().split('T')[0];
    
    staticUrls.forEach(url => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${url}</loc>\n`;
      xml += `    <lastmod>${nowStr}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${url === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Dynamic prompt details routes
    if (prompts) {
      prompts.forEach((prompt: any) => {
        const lastmod = prompt.updated_at 
          ? new Date(prompt.updated_at).toISOString().split('T')[0] 
          : nowStr;
        
        const pathPart = prompt.slug || prompt.id;
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/details/${pathPart}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
      });
    }

    xml += `</urlset>`;
    res.send(xml);
  } catch (err: any) {
    console.error('Error generating sitemap.xml:', err);
    res.status(500).send('Error generating sitemap.xml');
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Creator Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

