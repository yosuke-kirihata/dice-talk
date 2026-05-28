import {
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  type Texture,
} from 'three';
import type { FaceTextMap } from '@/features/dice/model/designState';
import type { DiceGeometryResult } from '@/features/dice/model/diceGeometry';
import { FACE_ORIENTATIONS, type FaceOrientation } from '@/features/dice/model/faceOrientation';
import { clampDiceRadius } from '@/shared/dice/geometry';
import { type Quat, toThree } from '@/shared/pose';

/** DiceMesh が面ラベルを作成するために使うサイコロ形状オプション。 */
export interface DiceMeshOptions {
  readonly size: number;
  readonly radius?: number;
  readonly faceTexts?: FaceTextMap;
}

interface FaceLabel {
  readonly mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  readonly texture: Texture;
  readonly pip: FaceOrientation['pip'];
  readonly text: string;
}

const LABEL_SIZE_RATIO = 0.9;
const LABEL_OFFSET = 0.003;
const LABEL_SEGMENTS = 24;
const TEXT_CANVAS_SIZE = 512;
const FACE_TEXT_BASE_FONT_SIZE = 96;
const FACE_TEXT_MIN_FONT_SIZE = 52;
const FACE_TEXT_FONT_STEP = 4;
const MAX_FACE_TEXT_LINES = 6;
const FACE_TEXT_FONT =
  '"HG丸ゴシックM-PRO", "HGMaruGothicMPRO", "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
const TEXT_AREA_RATIO = 0.9;
const TEXT_HEIGHT_RATIO = 0.84;

const roundedFaceSurfaceDistance = (u: number, v: number, size: number, radius: number): number => {
  const halfSize = size / 2;
  const r = clampDiceRadius(radius, size);
  if (r <= 0) return halfSize;

  const flatHalfExtent = halfSize - r;
  const du = Math.max(Math.abs(u) - flatHalfExtent, 0);
  const dv = Math.max(Math.abs(v) - flatHalfExtent, 0);
  return flatHalfExtent + Math.sqrt(Math.max(r * r - du * du - dv * dv, 0));
};

const createLabelGeometry = (size: number, radius: number): PlaneGeometry => {
  const labelSize = size * LABEL_SIZE_RATIO;
  const geometry = new PlaneGeometry(labelSize, labelSize, LABEL_SEGMENTS, LABEL_SEGMENTS);
  const position = geometry.getAttribute('position');
  const halfSize = size / 2;

  for (let i = 0; i < position.count; i += 1) {
    const u = position.getX(i);
    const v = position.getY(i);
    position.setZ(i, roundedFaceSurfaceDistance(u, v, size, radius) - halfSize + LABEL_OFFSET);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
};

const segmentText = (text: string): string[] => {
  const segmenter = Intl?.Segmenter ? new Intl.Segmenter('ja', { granularity: 'grapheme' }) : null;
  if (!segmenter) return Array.from(text);
  return Array.from(segmenter.segment(text), (segment) => segment.segment);
};

const segmentWords = (text: string): string[] => {
  const segmenter = Intl?.Segmenter ? new Intl.Segmenter('ja', { granularity: 'word' }) : null;
  if (!segmenter) return text.match(/\s+|\S+/g) ?? [];
  return Array.from(segmenter.segment(text), (segment) => segment.segment);
};

const isWhitespace = (value: string): boolean => /^\s+$/.test(value);
const isBreakAvoidingPrefix = (value: string): boolean =>
  /^[、。，．！？!?)）〕］｝】』」]/.test(value);

const wrapParagraph = (
  ctx: CanvasRenderingContext2D,
  paragraph: string,
  maxWidth: number,
): string[] => {
  const words = segmentWords(paragraph.trim());
  const lines: string[] = [];
  let line = '';

  const pushLine = () => {
    const normalized = line.trimEnd();
    if (normalized) lines.push(normalized);
    line = '';
  };

  const appendGraphemes = (value: string) => {
    for (const char of segmentText(value)) {
      const candidate = `${line}${char}`;
      if (!line || ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }

      if (isBreakAvoidingPrefix(char) && line.length > 0) {
        line += char;
        continue;
      }

      pushLine();
      line = char.trimStart();
    }
  };

  for (const word of words) {
    if (isWhitespace(word)) {
      if (line) line += word;
      continue;
    }

    const candidate = `${line}${word}`;
    if (!line || ctx.measureText(candidate).width <= maxWidth) {
      line = candidate.trimStart();
      continue;
    }

    if (isBreakAvoidingPrefix(word) && line.length > 0) {
      line += word;
      continue;
    }

    pushLine();
    if (ctx.measureText(word).width <= maxWidth) {
      line = word;
    } else {
      appendGraphemes(word);
    }
  }

  pushLine();
  return lines;
};

const fitFaceText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
): { readonly fontSize: number; readonly lines: readonly string[] } | null => {
  const paragraphs = text
    .trim()
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;

  let fallback: { readonly fontSize: number; readonly lines: readonly string[] } | null = null;
  for (
    let fontSize = FACE_TEXT_BASE_FONT_SIZE;
    fontSize >= FACE_TEXT_MIN_FONT_SIZE;
    fontSize -= FACE_TEXT_FONT_STEP
  ) {
    ctx.font = `700 ${fontSize}px ${FACE_TEXT_FONT}`;
    const lines = paragraphs.flatMap((paragraph) => wrapParagraph(ctx, paragraph, maxWidth));
    const lineHeight = fontSize * 1.14;
    const totalHeight = lines.length * lineHeight;
    const fitsLineCount = lines.length <= MAX_FACE_TEXT_LINES;
    const fitsHeight = totalHeight <= maxHeight;
    const fitsWidth = lines.every((line) => ctx.measureText(line).width <= maxWidth * 1.04);

    fallback = { fontSize, lines: lines.slice(0, MAX_FACE_TEXT_LINES) };
    if (fitsLineCount && fitsHeight && fitsWidth) return { fontSize, lines };
  }

  return fallback;
};

const LABEL_POSES: Record<
  FaceOrientation['id'],
  {
    readonly position: readonly [number, number, number];
    readonly rotation?: readonly [number, number, number];
  }
> = {
  front: { position: [0, 0, 1] },
  back: { position: [0, 0, -1], rotation: [0, Math.PI, 0] },
  right: { position: [1, 0, 0], rotation: [0, Math.PI / 2, 0] },
  left: { position: [-1, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  top: { position: [0, 1, 0], rotation: [-Math.PI / 2, 0, 0] },
  bottom: { position: [0, -1, 0], rotation: [Math.PI / 2, 0, 0] },
};

const orientLabel = (mesh: Mesh, face: FaceOrientation, halfSize: number): void => {
  const pose = LABEL_POSES[face.id];
  mesh.position.set(
    pose.position[0] * halfSize,
    pose.position[1] * halfSize,
    pose.position[2] * halfSize,
  );
  if (pose.rotation) mesh.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
};

const drawFaceText = (text: string): CanvasTexture | null => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = TEXT_CANVAS_SIZE;
  canvas.height = TEXT_CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  const maxWidth = canvas.width * TEXT_AREA_RATIO;
  const maxHeight = canvas.height * TEXT_HEIGHT_RATIO;
  const fitted = fitFaceText(ctx, text, maxWidth, maxHeight);
  if (!fitted) return null;

  const lineHeight = fitted.fontSize * 1.14;
  const lines = fitted.lines;
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  ctx.font = `700 ${fitted.fontSize}px ${FACE_TEXT_FONT}`;
  ctx.fillStyle = '#000000';
  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    ctx.fillText(line, canvas.width / 2, y);
  });

  return new CanvasTexture(canvas);
};

/** サイコロ本体 mesh と各面テキスト label mesh をまとめて扱う描画オブジェクト。 */
export class DiceMesh {
  readonly mesh: Mesh;
  private readonly result: DiceGeometryResult;
  private labels: FaceLabel[];

  constructor(result: DiceGeometryResult, opts: DiceMeshOptions = { size: 1 }) {
    this.result = result;
    this.mesh = new Mesh(result.geometry, [...result.materials]);
    this.labels = this.createLabels(opts);
  }

  setPose(quat: Quat): void {
    const t = toThree(quat);
    this.mesh.quaternion.set(t.x, t.y, t.z, t.w);
  }

  dispose(): void {
    this.result.geometry.dispose();
    for (const m of this.result.materials) m.dispose();
    for (const label of this.labels) {
      label.mesh.geometry.dispose();
      label.mesh.material.dispose();
      label.texture.dispose();
    }
  }

  updateFaceTexts(faceTexts: FaceTextMap | undefined, opts: DiceMeshOptions): void {
    if (!faceTexts) {
      this.clearLabels();
      return;
    }

    for (const face of FACE_ORIENTATIONS) {
      const nextText = faceTexts[face.pip];
      const current = this.labels.find((label) => label.pip === face.pip);
      if (current?.text === nextText) continue;
      if (current) this.removeLabel(current);
      const next = this.createLabel(face, nextText, opts);
      if (next) {
        this.mesh.add(next.mesh);
        this.labels = [...this.labels, next];
      }
    }
  }

  private createLabels(opts: DiceMeshOptions): FaceLabel[] {
    const labels: FaceLabel[] = [];
    if (!opts.faceTexts) return labels;

    for (const face of FACE_ORIENTATIONS) {
      const label = this.createLabel(face, opts.faceTexts[face.pip], opts);
      if (!label) continue;
      this.mesh.add(label.mesh);
      labels.push(label);
    }
    return labels;
  }

  private createLabel(
    face: FaceOrientation,
    text: string,
    opts: DiceMeshOptions,
  ): FaceLabel | null {
    const texture = drawFaceText(text);
    if (!texture) return null;
    const geometry = createLabelGeometry(opts.size, opts.radius ?? 0);
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const mesh = new Mesh(geometry, material);
    mesh.userData = { pip: face.pip };
    orientLabel(mesh, face, opts.size / 2);
    return { mesh, texture, pip: face.pip, text };
  }

  private clearLabels(): void {
    for (const label of this.labels) this.removeLabel(label);
  }

  private removeLabel(label: FaceLabel): void {
    this.mesh.remove(label.mesh);
    label.mesh.geometry.dispose();
    label.mesh.material.dispose();
    label.texture.dispose();
    this.labels = this.labels.filter((item) => item !== label);
  }
}
