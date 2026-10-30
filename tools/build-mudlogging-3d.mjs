import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = text => createHash('sha256').update(text).digest('hex');

export async function buildMudlogging3D({ reportDir = 'handoff/site-upgrade-2026-10-30' } = {}) {
  const engineFile = resolve(root, 'case-src/m2/engine.js');
  const engine = await readFile(engineFile, 'utf8');
  const sourceDir = resolve(root, 'case-src/mudlogging-stage'), assets = resolve(root, 'portal/assets');
  const threeModule = resolve(assets, 'vendor/three-r180/three.module.js'), threeCore = resolve(assets, 'vendor/three-r180/three.core.js');
  const [moduleBytes, coreBytes, esbuildPackage] = await Promise.all([
    readFile(threeModule), readFile(threeCore), readFile(resolve(root, 'node_modules/esbuild/package.json'), 'utf8').then(JSON.parse)
  ]);
  if (!/REVISION\s*=\s*['"]180['"]/.test(coreBytes.toString('utf8'))) throw new Error('Vendor Three.js revision must be r180');
  await mkdir(assets, { recursive: true });
  const lightPath = resolve(assets, 's17-mudlogging-stage.js'), scenePath = resolve(assets, 's17-mudlogging-3d.js');
  const common = { bundle: true, format: 'iife', platform: 'browser', target: ['es2020'], charset: 'utf8', minify: true,
    legalComments: 'inline', sourcemap: false, metafile: true, logLevel: 'silent', treeShaking: true };
  const lightBuild = await build({ ...common, entryPoints: [resolve(sourceDir, 'source.js')], outfile: lightPath,
    // Deliberately exact original source, rather than a second reimplementation of its integration/inversion rules.
    banner: { js: '/* Shared mudlogging stage: original M2Core engine follows unchanged. */\n' + engine + '\n/* Independent stage layer. */' } });
  const sceneBuild = await build({ ...common, entryPoints: [resolve(sourceDir, 'scene.js')], outfile: scenePath, globalName: 'S17MudStage3D' });
  await copyFile(resolve(sourceDir, 'stage.css'), resolve(assets, 's17-mudlogging-stage.css'));
  await copyFile(resolve(assets, 'vendor/three-r180/LICENSE'), resolve(assets, 'vendor/THREE-LICENSE.txt'));
  const [lightBytes, sceneBytes, cssBytes] = await Promise.all([readFile(lightPath), readFile(scenePath), readFile(resolve(assets, 's17-mudlogging-stage.css'))]);
  if (!lightBytes.toString('utf8').includes(engine)) throw new Error('Original M2Core prefix changed during build');
  if (/import\s*\(/.test(sceneBytes.toString('utf8'))) throw new Error('3D output must be a self-contained classic IIFE');
  const report = {
    createdAt: new Date().toISOString(), threeRevision: 180, esbuildVersion: esbuildPackage.version,
    engine: { path: 'case-src/m2/engine.js', sha256: hash(engine), copiedUnchanged: true },
    vendor: { module: { path: 'portal/assets/vendor/three-r180/three.module.js', sha256: hash(moduleBytes) }, core: { path: 'portal/assets/vendor/three-r180/three.core.js', sha256: hash(coreBytes) } },
    output: { light: { path: 'portal/assets/s17-mudlogging-stage.js', bytes: lightBytes.length, sha256: hash(lightBytes) },
      scene: { path: 'portal/assets/s17-mudlogging-3d.js', bytes: sceneBytes.length, sha256: hash(sceneBytes) },
      css: { path: 'portal/assets/s17-mudlogging-stage.css', bytes: cssBytes.length, sha256: hash(cssBytes) } },
    bundleInputs: { light: Object.keys(lightBuild.metafile.inputs), scene: Object.keys(sceneBuild.metafile.inputs) },
    loading: { sceneEagerlyReferencedByLight: false, ordinaryScript: true, relativeToCurrentScript: true, nearViewportObserverRequired: true },
    browserAcceptanceClaimed: false
  };
  const directory = resolve(root, reportDir); await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'mudlogging-3d-build.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await buildMudlogging3D();
  console.log(JSON.stringify({ built: true, threeRevision: report.threeRevision, esbuildVersion: report.esbuildVersion, output: report.output, browserAcceptanceClaimed: false }, null, 2));
}
