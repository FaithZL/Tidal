// Read-only FBX 7.x binary structural inspection. Embedded images are extracted
// only to OS TEMP for review; no application/public assets are written.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { Box3, Texture, TextureLoader } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// Do not create a browser/image element or perform any network/file image load.
// Structural Three parse below validates geometry/transforms/material links only.
TextureLoader.prototype.load = function (url) { const t = new Texture(); t.name = String(url); return t; };

const files = process.argv.slice(2);
const output = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const temp = path.join(os.tmpdir(), 'tidal-user-fbx-inspection-20261022');
fs.mkdirSync(temp, { recursive: true });

function parse(buffer) {
  const version = buffer.readUInt32LE(23);
  const wide = version >= 7500;
  let offset = 27;
  const count = () => {
    const n = wide ? Number(buffer.readBigUInt64LE(offset)) : buffer.readUInt32LE(offset);
    offset += wide ? 8 : 4;
    return n;
  };
  const scalar = (method, bytes) => { const n = buffer[method](offset); offset += bytes; return typeof n === 'bigint' ? Number(n) : n; };
  function prop() {
    const type = String.fromCharCode(buffer[offset++]);
    if (type === 'Y') return scalar('readInt16LE', 2);
    if (type === 'C') return scalar('readUInt8', 1) !== 0;
    if (type === 'I') return scalar('readInt32LE', 4);
    if (type === 'F') return scalar('readFloatLE', 4);
    if (type === 'D') return scalar('readDoubleLE', 8);
    if (type === 'L') return scalar('readBigInt64LE', 8);
    if (type === 'S' || type === 'R') {
      const n = scalar('readUInt32LE', 4);
      const v = buffer.subarray(offset, offset + n); offset += n;
      return type === 'S' ? v.toString('utf8').replace(/\0\x01/g, '::') : v;
    }
    if ('fdilbc'.includes(type)) {
      const length = scalar('readUInt32LE', 4);
      const encoding = scalar('readUInt32LE', 4);
      const packedLength = scalar('readUInt32LE', 4);
      const packed = buffer.subarray(offset, offset + packedLength); offset += packedLength;
      const raw = encoding === 1 ? zlib.inflateSync(packed) : packed;
      const sizes = { f: 4, d: 8, i: 4, l: 8, b: 1, c: 1 };
      const methods = { f: 'readFloatLE', d: 'readDoubleLE', i: 'readInt32LE', l: 'readBigInt64LE', b: 'readUInt8', c: 'readUInt8' };
      const values = Array.from({ length }, (_, i) => { const n = raw[methods[type]](i * sizes[type]); return typeof n === 'bigint' ? Number(n) : n; });
      return values;
    }
    throw new Error(`Unknown property ${type} at ${offset - 1}`);
  }
  function node() {
    const end = count(); const num = count(); count(); const nameLength = buffer[offset++];
    if (end === 0) return null;
    const name = buffer.toString('utf8', offset, offset + nameLength); offset += nameLength;
    const properties = Array.from({ length: num }, prop);
    const children = [];
    while (offset < end) { const child = node(); if (!child) break; children.push(child); }
    offset = end;
    return { name, properties, children };
  }
  const roots = [];
  while (offset < buffer.length - (wide ? 25 : 13)) { const n = node(); if (!n) break; roots.push(n); }
  return { version, roots };
}
const child = (n, name) => n.children.find(c => c.name === name);
const value = (n, name) => child(n, name)?.properties[0];
const props70 = n => Object.fromEntries((child(n, 'Properties70')?.children ?? []).map(p => [p.properties[0], p.properties.slice(4)]));
function imageDimensions(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), format: 'PNG' };
  if (bytes[0] === 255 && bytes[1] === 216) {
    let i = 2;
    while (i < bytes.length) {
      if (bytes[i++] !== 255) continue;
      const marker = bytes[i++];
      if (marker === 216 || marker === 217) continue;
      const length = bytes.readUInt16BE(i);
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) return { width: bytes.readUInt16BE(i + 5), height: bytes.readUInt16BE(i + 3), format: 'JPEG' };
      i += length;
    }
  }
  return null;
}
const reports = files.map(file => {
  const buffer = fs.readFileSync(file);
  const parsed = parse(buffer);
  const objects = parsed.roots.find(n => n.name === 'Objects')?.children ?? [];
  const geometries = objects.filter(n => n.name === 'Geometry').map(n => {
    const vertices = value(n, 'Vertices') ?? [];
    const polygons = value(n, 'PolygonVertexIndex') ?? [];
    let faces = 0, triangles = 0, sides = 0;
    for (const i of polygons) { sides++; if (i < 0) { faces++; triangles += sides - 2; sides = 0; } }
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    vertices.forEach((v, i) => { min[i % 3] = Math.min(min[i % 3], v); max[i % 3] = Math.max(max[i % 3], v); });
    return { id: n.properties[0], name: n.properties[1], type: n.properties[2], controlPoints: vertices.length / 3, polygonCorners: polygons.length, polygons: faces, triangles, bounds: { min, max }, layers: n.children.filter(c => c.name.startsWith('LayerElement')).map(c => ({ kind: c.name, mapping: value(c, 'MappingInformationType'), reference: value(c, 'ReferenceInformationType') })) };
  });
  const stem = path.basename(file, '.fbx');
  const videos = objects.filter(n => n.name === 'Video').map((n, i) => {
    const content = value(n, 'Content');
    const filename = value(n, 'Filename') ?? value(n, 'FileName');
    let extractedPath;
    if (Buffer.isBuffer(content) && content.length) { extractedPath = path.join(temp, `${stem}-${i}-${String(filename ?? 'texture.bin').split(/[\\/]/).pop()}`); fs.writeFileSync(extractedPath, content); }
    return { id: n.properties[0], name: n.properties[1], filename, relativeFilename: value(n, 'RelativeFilename'), embeddedBytes: Buffer.isBuffer(content) ? content.length : 0, dimensions: Buffer.isBuffer(content) ? imageDimensions(content) : null, extractedPath, sha256: Buffer.isBuffer(content) ? crypto.createHash('sha256').update(content).digest('hex') : null };
  });
  const names = {};
  for (const n of objects) (names[n.name] ??= []).push({ id: n.properties[0], name: n.properties[1], type: n.properties[2] });
  const global = parsed.roots.find(n => n.name === 'GlobalSettings');
  const header = parsed.roots.find(n => n.name === 'FBXHeaderExtension');
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  let object;
  try { object = new FBXLoader().parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), ''); }
  finally { console.warn = originalWarn; }
  object.updateMatrixWorld(true);
  const cpuMeshes = [];
  object.traverse(n => { if (n.isMesh) {
    const geometry = n.geometry;
    cpuMeshes.push({ name: n.name, type: n.type, positions: geometry.attributes.position?.count ?? 0, normals: geometry.attributes.normal?.count ?? 0, uvCount: geometry.attributes.uv?.count ?? 0, triangles: (geometry.index?.count ?? geometry.attributes.position?.count ?? 0) / 3, finitePositions: Array.from(geometry.attributes.position.array).every(Number.isFinite), finiteNormals: Array.from(geometry.attributes.normal?.array ?? []).every(Number.isFinite), finiteUV: Array.from(geometry.attributes.uv?.array ?? []).every(Number.isFinite), skinIndex: Boolean(geometry.attributes.skinIndex), skinWeight: Boolean(geometry.attributes.skinWeight), materialTypes: (Array.isArray(n.material) ? n.material : [n.material]).map(m => ({ type: m.type, map: Boolean(m.map), normalMap: Boolean(m.normalMap), shininess: m.shininess })) });
  } });
  const bounds = new Box3().setFromObject(object);
  const cpuParse = { method: 'Three.js FBXLoader r186 CPU parse; TextureLoader.load stubbed to return Texture without decoding or network. Browser render remains separate evidence.', warnings, worldBounds: { min: bounds.min.toArray(), max: bounds.max.toArray() }, animationClips: object.animations.length, meshes: cpuMeshes };
  return { file, bytes: buffer.length, sha256: crypto.createHash('sha256').update(buffer).digest('hex'), version: parsed.version, creator: value(header, 'Creator'), globalSettings: global ? props70(global) : {}, objectCounts: Object.fromEntries(Object.entries(names).map(([key, list]) => [key, list.length])), geometries, models: objects.filter(n => n.name === 'Model').map(n => ({ id: n.properties[0], name: n.properties[1], type: n.properties[2], properties: props70(n) })), deformers: names.Deformer ?? [], animationObjects: Object.fromEntries(Object.entries(names).filter(([key]) => key.startsWith('Animation'))), materials: objects.filter(n => n.name === 'Material').map(n => ({ id: n.properties[0], name: n.properties[1], shadingModel: value(n, 'ShadingModel'), properties: props70(n) })), textures: objects.filter(n => n.name === 'Texture').map(n => ({ id: n.properties[0], name: n.properties[1], filename: value(n, 'FileName'), relativeFilename: value(n, 'RelativeFilename'), properties: props70(n) })), videos, connections: parsed.roots.find(n => n.name === 'Connections')?.children.map(n => n.properties) ?? [], cpuParse };
});
fs.writeFileSync(path.join(output, 'inspection.json'), JSON.stringify({ date: '2026-10-22', method: 'Read-only binary FBX structure decode with zlib array decoding; no Blender, uploads, external imports or asset rewriting.', reports }, null, 2));
console.log(JSON.stringify(reports.map(r => ({ file: r.file, version: r.version, objectCounts: r.objectCounts, deformers: r.deformers, geometries: r.geometries, videos: r.videos })), null, 2));
