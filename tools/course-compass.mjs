import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { FOUR } from './four-exhibit-contract.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
let originalAtlas, renderer;

/** The original teacher copy is read only. It remains the provenance of these fields. */
export function courseAtlas() {
  if (!originalAtlas) {
    const context = vm.createContext({window:{}, localStorage:{getItem:()=>null, setItem:()=>{}}});
    vm.runInContext(read('portal-original/assets/data.js'), context, {filename:'portal-original/assets/data.js'});
    originalAtlas = context.window.ATLAS;
  }
  return originalAtlas;
}
function api() {
  if (!renderer) {
    const context = vm.createContext({window:{}});
    vm.runInContext(courseCompassRuntime(), context, {filename:'shared/course-compass.js'});
    renderer = context.window.S17Compass;
  }
  return renderer;
}

/** List only authored source manifests and the actual registered teacher sample. */
export function courseCatalog() {
  const atlas = courseAtlas(), rows = [];
  const sourceRoot = path.join(root, 'expansion-src');
  for (const entry of fs.readdirSync(sourceRoot, {withFileTypes:true}).filter(e => e.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))) {
    const file = path.join(sourceRoot, entry.name, 'case.json');
    if (!fs.existsSync(file)) continue;
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!atlas.index.byScene[manifest.sceneId]) continue;
    rows.push({id:manifest.id, sceneId:manifest.sceneId, title:manifest.title, version:manifest.version, directory:'expansion-cases'});
  }
  for (const row of [...FOUR, {scene:'m2', id:'s17-mudgas-context'}]) {
    if (!fs.existsSync(path.join(root, 'case-src', row.scene))) continue;
    rows.push({id:row.id, sceneId:row.scene, title:atlas.index.byScene[row.scene].name, directory:'cases'});
  }
  const registered = [];
  const context = vm.createContext({window:{}, Cases:{register:value=>registered.push(value)}});
  context.window.Cases = context.Cases;
  vm.runInContext(read('portal/assets/core/kit.js'), context, {filename:'kit.js'});
  context.K = context.window.K;
  vm.runInContext(read('portal/assets/cases/welllog-layer.case.js'), context, {filename:'welllog-layer.case.js'});
  rows.push(...registered.map(row=>({id:row.id, sceneId:row.sceneId, title:row.title, version:row.version, directory:'', origin:'老师原样例'})));
  return rows;
}

export function courseThemeCSS() { return read('shared/course-theme.css'); }
export function courseCompassCSS() { return read('shared/course-compass.css'); }
export function courseCompassRuntime() { return read('shared/course-compass.js'); }
export function courseStyles() { return courseThemeCSS() + '\n' + courseCompassCSS(); }

/**
 * Compose static HTML and an offline runtime; this function does not write or build.
 * mode:'standalone' uses sibling package paths and a four-level link to the portal.
 * mode:'portal' uses the portal's native hash routes.
 * nextScene/nextLabel can express an explicitly authored continuation, e.g. m5 -> w1.
 */
export function courseContext(scene, manifest = {}, options = {}) {
  const mode = options.mode || 'standalone';
  if (!['standalone', 'portal'].includes(mode)) throw new Error('courseContext mode must be standalone or portal');
  const settings = {mode, portalHref:options.portalHref || '../../../../portal/index.html', collectionPrefix:options.collectionPrefix || '../../../'};
  const atlas = options.atlas || courseAtlas();
  const catalog = options.catalog || courseCatalog();
  const selectedScene = typeof scene === 'string' ? atlas.index.byScene[scene] : scene;
  if (!selectedScene) throw new Error('Unknown ATLAS scene: ' + scene);
  // Prefer original metadata, even if a caller passes a newer manifest or a scene object.
  const original = courseAtlas().index.byScene[selectedScene.id] || selectedScene;
  const content = api().model(original, manifest, atlas, catalog, options);
  const html = api().render(content, settings);
  // Existing lesson families already provide their own three-part navigation.
  const navigation = api().navigation(content, {...settings, includeReading:!!options.includeReading});
  const page = {model:content, options:settings};
  const runtime = mode === 'standalone'
    ? 'window.S17CompassPage=' + JSON.stringify(page).replace(/</g, '\\u003c') + ';\n' + courseCompassRuntime()
    : courseCompassRuntime();
  const metadata = {
    sceneId:original.id, source:'portal-original/assets/data.js', difficulty:original.diff,
    difficultyReason:original.diffWhy || '', references:[...(original.refs || [])], crossStages:[...(original.cross || [])],
    sameScene:content.sameScene.map(row=>row.id), sameStage:content.sameStage.map(row=>row.id), nextScene:content.next?.id || null,
    mode, portalHref:settings.portalHref, collectionPrefix:settings.collectionPrefix,
    links:[...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1].replace(/&amp;/g,'&')),
    browserVerifiedByThisFunction:false
  };
  return {html, navigation, runtime, metadata};
}

/** Helper for existing four-section case manifests: append without inventing a fifth chapter. */
export function appendCourseContext(background, context) {
  const result = structuredClone(background);
  const sections = result.sections || [];
  if (!sections.length) throw new Error('A case background needs a section before the course context can be appended');
  const last = sections[sections.length - 1];
  const body = last.html || last.body || '';
  if (!body.includes('data-course-context=')) last.html = body + context.html;
  return result;
}

/** Safe ordinary stylesheet tags for the enhanced portal; never used on the teacher copies. */
export function portalCourseLinks(prefix = '../shared/') {
  return '<link rel="stylesheet" href="' + escapeHTML(prefix + 'course-theme.css') + '">\n' +
    '<link rel="stylesheet" href="' + escapeHTML(prefix + 'course-compass.css') + '">\n' +
    '<script src="' + escapeHTML(prefix + 'course-compass.js') + '"></script>';
}
