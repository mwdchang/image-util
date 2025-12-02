import esbuild from 'esbuild';
import yargs from 'yargs';
import globby from 'globby';
import path from 'path';
import copy from 'copy';
import server from 'live-server';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


function pluginRewriteWorkerForDev() {
  return {
    name: 'rewrite-worker-for-dev',
    setup(build) {
      build.onLoad({ filter: /index\.ts$/ }, async args => {
        let code = await fs.promises.readFile(args.path, 'utf8');

        // Replace TS path with JS path ONLY for dev/examples
        code = code.replace(
          /new Worker\(new URL\(['"]\.\/worker\.ts['"],\s*import\.meta\.url\)/g,
          "new Worker(new URL('./worker.js', import.meta.url)"
        );
        return { contents: code, loader: 'ts' };
      });
    }
  };
}

/** ---------- Live Server Helper ---------- */
function liveServer(options = {}) {
    const defaultParams = {
        file: 'index.html',
        host: '0.0.0.0',
        logLevel: 2,
        open: false,
        port: 8080,
        root: '.',
        wait: 200,
    };

    const params = Object.assign({}, defaultParams, options);
    let running = false;

    return {
        start() {
            if (!running) {
                running = true;
                server.start(params);
                console.log(`live-server running on ${params.port}`);
            }
        },
    };
}

/** ---------- Plugin: Ignore Certain Imports ---------- */
function pluginIgnoreImports(options) {
    const config = Object.assign({
        ignoreFilter: /.*/,
        allowFilePatterns: [ /.(?:css)$/ ],
        allowFolderPatterns: [],
    }, options);

    function shouldAllow(args) {
        if (args.kind === 'entry-point') return true;

        for (const pattern of config.allowFolderPatterns) {
            if (args.resolveDir.match(pattern)) return true;
        }

        for (const pattern of config.allowFilePatterns) {
            if (args.path.match(pattern)) return true;
        }

        return false;
    }

    return {
        name: 'ignore-imports',
        setup(build) {
            build.onResolve({ filter: config.ignoreFilter }, args => {
                if (!shouldAllow(args)) return { path: args.path, external: true };
                return undefined;
            });
        },
    };
}

/** ---------- Example Build ---------- */
function getExamplesBuild() {
    return {
        entryPoints: ['examples/src/index.ts'],
        bundle: true,
        outdir: 'build/examples',
        target: 'es2020',
        format: 'esm',
        sourcemap: true,
        plugins: [],
    };
}

/** ---------- Library Build ---------- */
function getLibBuild() {
    const input = [];
    globby.sync([
        path.join('src/', '/**/*.{ts,js}'),
        `!${path.join('src/', '/**/*.d.ts')}`,
    ]).forEach(file => input.push(file));

    return {
        entryPoints: input,
        bundle: true,
        outdir: 'build/lib/',
        target: 'es2020',
        format: 'esm',
        sourcemap: true,
        plugins: [pluginIgnoreImports()],
    };
}

/** ---------- Escape Worker Code for Blob ---------- */
function escapeWorker(code) {
    return code.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/** ---------- Dist Build with Inline Worker ---------- */
function getDistBuild() {
    return {
        entryPoints: ['src/index.ts'], // main entry only
        bundle: true,
        outdir: 'build/dist/',
        target: 'es2020',
        format: 'esm',
        sourcemap: false,
        minify: true,

        plugins: [
            {
                name: 'inline-worker',
                setup(build) {
                    build.onLoad({ filter: /\.(ts|js)$/ }, async args => {
                        let code = await fs.promises.readFile(args.path, 'utf8');

                        // Detect worker usage
                        const workerRegex = /new Worker\(new URL\(['"]\.\/worker\.ts['"],\s*import\.meta\.url\),\s*\{[^}]*\}\)/;

                        if (workerRegex.test(code)) {
                            // Bundle the worker via ESBuild to make it strict-mode safe
                            const workerBundle = await esbuild.build({
                                entryPoints: [path.resolve('src/worker.ts')],
                                bundle: true,
                                format: 'esm',
                                write: false,
                                minify: true,
                                target: 'es2020'
                            });

                            let workerCode = workerBundle.outputFiles[0].text;
                            workerCode = escapeWorker(workerCode);

                            const replacement = `
new Worker(
  URL.createObjectURL(new Blob([\`${workerCode}\`], { type: 'text/javascript' })),
  { type: 'module' }
)
`;

                            code = code.replace(workerRegex, replacement);
                        }

                        return { contents: code, loader: 'ts' };
                    });
                }
            }
        ]
    };
}

/** ---------- Main ---------- */
async function main(options) {
    const contexts = [];

    try {
        if (options.examples || options.all) {
            contexts.push(await esbuild.context(getExamplesBuild()));
        }

        if (options.lib || options.all) {
            contexts.push(await esbuild.context(getLibBuild()));
        }

        if (options.dist || options.all) {
            contexts.push(await esbuild.context(getDistBuild()));
        }

        if (options.watch) {
            for (const context of contexts) await context.watch();
        } else {
            const promises = contexts.map(ctx => ctx.rebuild());
            await Promise.all(promises);
            for (const ctx of contexts) await ctx.dispose();
        }

        // Copy static files for examples
        if (options.examples) {
            copy('examples/static/**/*', 'build/examples/', (err) => {
                if (err) console.error(err);
            });
        }

        // Dev server
        if (options['dev-server']) {
            const server = liveServer({
              // root: path.resolve(__dirname), // root folder must include build/
              root: path.resolve(__dirname, 'examples/static/'),
              file: 'examples/index.html',
              port: 8090,
              open: false,
              watch: [
                path.resolve(__dirname, 'examples/static'),
                path.resolve(__dirname, 'build/examples'),
                path.resolve(__dirname, 'build/dist'),
              ],
              mount: [
                ['/examples', path.resolve(__dirname, 'build/examples')],
                ['/dist', path.resolve(__dirname, 'build/dist')],
              ],
            });
            server.start();
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main(yargs(process.argv).argv);

