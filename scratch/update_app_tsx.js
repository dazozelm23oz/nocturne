const fs = require('fs');
let c = fs.readFileSync('pages/_app.tsx', 'utf8').replace(/\r\n/g, '\n');

c = c.replace(
  'import Providers from "@/providers";',
  'import Providers from "@/providers";\nimport SingleInstanceGuard from "@/components/SingleInstanceGuard";'
);

c = c.replace(
  '<Providers>\n        <Component {...pageProps} />\n      </Providers>',
  '<Providers>\n        <SingleInstanceGuard>\n          <Component {...pageProps} />\n        </SingleInstanceGuard>\n      </Providers>'
);

fs.writeFileSync('pages/_app.tsx', c.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully updated pages/_app.tsx!');
