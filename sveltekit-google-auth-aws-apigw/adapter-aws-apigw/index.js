import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

/**
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 */

/** @type {import('.')} */
export default function (options) {
  return {
    name: '@sveltejs/adapter-aws-apigw',

    async adapt({ utils }) {
      const publish = 'build';

      utils.log.minor(`Publishing to "${publish}"`);

      utils.rimraf(publish);

      const files = fileURLToPath(new URL('./files', import.meta.url));

      utils.log.minor('Generating serverless function...');
      utils.copy(join(files, 'entry.js'), '.svelte-kit/aws-apigw/entry.js');

      /** @type {BuildOptions} */
      const default_options = {
        entryPoints: ['.svelte-kit/aws-apigw/entry.js'],
        outfile: '.aws-apigw/functions-internal/__render.js',
        bundle: true,
        inject: [join(files, 'shims.js')],
        platform: 'node',
        minify: true
      };

      const build_options =
        options && options.esbuild ? await options.esbuild(default_options) : default_options;

      await esbuild.build(build_options);

      writeFileSync(join('.aws-apigw', 'package.json'), JSON.stringify({ type: 'commonjs' }));

      utils.log.minor('Prerendering static pages...');
      await utils.prerender({
        dest: publish
      });

      utils.log.minor('Copying assets...');
      utils.copy_static_files(publish);
      utils.copy_client_files(publish);
    }
  };
}
