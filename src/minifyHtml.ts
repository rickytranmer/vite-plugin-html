import { minify, Options as MinifyOptions } from 'html-minifier-terser';
import type { Plugin, ResolvedConfig } from 'vite';
import fs from 'fs-extra';
import path from 'path';

export function minifyHtml(minifyOptions: MinifyOptions | boolean = true): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'vite:minifyHtml',

    configResolved(resolvedConfig: ResolvedConfig) {
      config = resolvedConfig;
    },

    async closeBundle() {
      if (!minifyOptions) {
        return;
      }

      // Since the html conversion can also be maintained inside the plug-in, it cannot be guaranteed that the subsequent plug-in will compress the html. So it is changed to compress after packaging
      const defaultMinifyOptions = {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeEmptyAttributes: true,
        ...(typeof minifyOptions === 'boolean' ? {} : minifyOptions),
      };

      const { root, build } = config;
      const { outDir, rollupOptions } = build;
      const { input } = rollupOptions;
      const indexHtmlPath = path.resolve(root, outDir, 'index.html');

      const writeHtml = (htmlPath: string)=> {
        if (!fs.existsSync(htmlPath)) {
          console.log('no such file: ' + htmlPath);
          return;
        }
        let processHtml = fs.readFileSync(htmlPath, 'utf-8');
        processHtml = minify(processHtml, defaultMinifyOptions);
        fs.writeFile(htmlPath, processHtml);
      }

      if(typeof input === 'string') {
        writeHtml(input.replace(root, root + '/' + outDir));
      } else {
        const htmlPaths = Array.isArray(input) ? [...input] : typeof input === 'object' ? [...Object.values(input)] : [indexHtmlPath];
        htmlPaths.forEach((path)=> writeHtml(path.replace(root, root + '/' + outDir)));
      }
    },
  };
}
