import esbuild from 'esbuild';
import yargs from 'yargs';
import globby from 'globby';
import path from 'path';
import copy from 'copy';
import server from 'live-server';
import { fileURLToPath } from 'url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function pluginIgnoreImports(options) {
    const config = Object.assign({
        ignoreFilter: /.*/,
        allowFilePatterns: [ /.(?:css)$/ ],
        allowFolderPatterns: [],
    }, options);

    function shouldAllow(args) {
        if (args.kind === 'entry-point') {
            return true;
        }

        for (const pattern of config.allowFolderPatterns) {
            if (args.resolveDir.match(pattern)) {
                return true;
            }
        }

        for (const pattern of config.allowFilePatterns) {
            if (args.path.match(pattern)) {
                return true;
            }
        }

        return false;
    }

    return {
        name: 'ignore-imports',
        setup(build) {
            build.onResolve({ filter: config.ignoreFilter }, args => {
                if (!shouldAllow(args)) {
                    return {
                        path: args.path,
                        external: true,
                    };
                }
                return undefined;
            });
        },
    };
}

function getExamplesBuild() {
    return {
        entryPoints: [ 'examples/src/index.ts' ],
        bundle: true,
        outdir: 'build/examples',
        target: 'es2020',
        format: 'esm',
        sourcemap: true,
        plugins: [],
    };
}

function workerHackHack() {
    return {
        entryPoints: [ 'src/worker.ts' ],
        bundle: true,
        outdir: 'build/examples',
        target: 'es2020',
        format: 'esm',
        sourcemap: true,
        plugins: [inlineWorker()],
    };
}

function getLibBuild() {
    const input = [];
    globby.sync([
        path.join('src/', '/**/*.{ts,js}'),
        `!${path.join('src/', '/**/*.d.ts')}`,
    ]).forEach(file => {
        input.push(file);
    });

    return {
        entryPoints: input,
        bundle: true,
        outdir: 'build/lib/',
        target: 'es2020',
        format: 'esm',
        sourcemap: true,
        plugins: [
            pluginIgnoreImports(),
        ],
    };
}

function getDistBuild() {
    return {
        entryPoints: [ 'src/index.ts', 'src/worker.ts' ],
        bundle: true,
        outdir: 'build/dist/',
        target: 'es2020',
        format: 'esm',
        sourcemap: false,
        minify: true,
        plugins: [],
    };
}

async function main(options) {
    const contexts = [];

    try {
        if (options.examples || options.all) {
            contexts.push(await esbuild.context(getExamplesBuild()));
            contexts.push(await esbuild.context(workerHackHack()));
        }

        if (options.lib || options.all) {
            contexts.push(await esbuild.context(getLibBuild()));
        }

        if (options.dist || options.all) {
            contexts.push(await esbuild.context(getDistBuild()));
        }

        if (options.watch) {
            for (const context of contexts) {
                await context.watch();
            }
        } else {
            const promises = [];
            for (const context of contexts) {
                promises.push(context.rebuild());
            }
            await Promise.all(promises);
            for (const context of contexts) {
                await context.dispose();
            }
        }

        if (options.examples) {
            copy('examples/static/**/*', 'build/examples/', (err) => {
                if (err) {
                    console.error(err);
                }
            });
        }

        if (options['dev-server']) {
            const server = liveServer({
                port: 8090,
                host: '0.0.0.0',
                root: path.resolve(__dirname, 'examples/static/'),
                file: 'index.html',
                open: false,
                wait: 500,
                // proxy: [['/api', 'http://127.0.0.1:8080']], // not needed for now, used to proxy to the server API
                watch: [
                    path.resolve(__dirname, 'examples/static'),
                    path.resolve(__dirname, 'build/examples/'),
                ],
                mount: [
                    ['/examples', path.resolve(__dirname, 'build/examples')],
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
