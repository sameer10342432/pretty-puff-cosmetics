import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';

const tmpFile = path.resolve('scripts/.tmp-export.mjs');

// Bundle the data files to a temporary ES module
esbuild.buildSync({
  stdin: {
    contents: `
      import { CATEGORIES } from './src/data/categories';
      import { PRODUCTS } from './src/data/products';
      import { BLOG_CATEGORIES } from './src/data/blogCategories';
      import { BLOG_POSTS } from './src/data/blogPosts';
      import fs from 'fs';

      const data = {
        categories: CATEGORIES,
        products: PRODUCTS,
        blogCategories: BLOG_CATEGORIES,
        blogPosts: BLOG_POSTS,
      };

      fs.writeFileSync('php/seed_data.json', JSON.stringify(data, null, 2), 'utf8');
      console.log('✅ php/seed_data.json exported successfully!');
    `,
    resolveDir: process.cwd(),
    sourcefile: 'exporter.js',
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: tmpFile,
});

import { pathToFileURL } from 'url';

// Run it with node
import(pathToFileURL(tmpFile).href).then(() => {
  fs.unlinkSync(tmpFile);
});
