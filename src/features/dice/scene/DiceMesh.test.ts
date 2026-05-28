import { Mesh } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FACE_TEXTS } from '@/features/dice/model/designState';
import { createDiceGeometry } from '@/features/dice/model/diceGeometry';
import { getTargetQuatForPip } from '@/features/pose';
import type { Quat } from '@/shared/pose';
import { DiceMesh } from './DiceMesh';

const singleLongFaceTexts = {
  ...DEFAULT_FACE_TEXTS,
  1: '',
  2: '',
  3: '最近うれしかったことをみんなにできるだけ詳しく話そう',
  4: '',
  5: '',
  6: '',
};

const mixedLengthFaceTexts = {
  ...singleLongFaceTexts,
  1: '映画',
  3: '最近うれしかった出来事を話そう',
};

describe('DiceMesh', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes a THREE.Mesh', () => {
    const dm = new DiceMesh(createDiceGeometry());
    expect(dm.mesh).toBeInstanceOf(Mesh);
  });

  it('adds one label mesh per face when face text is configured', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          clearRect: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn((text: string) => ({ width: text.length * 80 })),
          strokeText: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );
    const dm = new DiceMesh(createDiceGeometry(), { size: 1, faceTexts: DEFAULT_FACE_TEXTS });
    expect(dm.mesh.children).toHaveLength(6);
  });

  it('keeps labels flat when radius is 0', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          clearRect: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn((text: string) => ({ width: text.length * 80 })),
          strokeText: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );
    const dm = new DiceMesh(createDiceGeometry({ radius: 0 }), {
      size: 1,
      radius: 0,
      faceTexts: DEFAULT_FACE_TEXTS,
    });
    const label = dm.mesh.children.find((child) => child.userData.pip === 3) as Mesh;
    const position = label.geometry.getAttribute('position');
    const firstZ = position.getZ(0);

    for (let i = 1; i < position.count; i += 1) {
      expect(position.getZ(i)).toBeCloseTo(firstZ, 9);
    }
  });

  it('curves labels to follow rounded faces', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          clearRect: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn((text: string) => ({ width: text.length * 80 })),
          strokeText: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );
    const dm = new DiceMesh(createDiceGeometry({ radius: 0.35 }), {
      size: 1,
      radius: 0.35,
      faceTexts: DEFAULT_FACE_TEXTS,
    });
    const label = dm.mesh.children.find((child) => child.userData.pip === 3) as Mesh;
    const position = label.geometry.getAttribute('position');
    const zValues = Array.from({ length: position.count }, (_, i) => position.getZ(i));

    expect(Math.max(...zValues) - Math.min(...zValues)).toBeGreaterThan(0.04);
  });

  it('uses most of the dice face for labels', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          clearRect: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn((text: string) => ({ width: text.length * 80 })),
          strokeText: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );
    const dm = new DiceMesh(createDiceGeometry(), { size: 1, faceTexts: DEFAULT_FACE_TEXTS });
    const label = dm.mesh.children.find((child) => child.userData.pip === 3) as Mesh;
    const position = label.geometry.getAttribute('position');
    const xValues = Array.from({ length: position.count }, (_, i) => position.getX(i));

    expect(Math.max(...xValues) - Math.min(...xValues)).toBeCloseTo(0.9, 6);
  });

  it('wraps long face text across multiple lines', () => {
    const fillText = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          clearRect: vi.fn(),
          fillText,
          measureText: vi.fn((text: string) => ({ width: text.length * 28 })),
          strokeText: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );

    new DiceMesh(createDiceGeometry(), {
      size: 1,
      radius: 0,
      faceTexts: singleLongFaceTexts,
    });

    expect(fillText.mock.calls.length).toBeGreaterThan(1);
  });

  it('wraps spaced face text by word', () => {
    const fillText = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          clearRect: vi.fn(),
          fillText,
          measureText: vi.fn((text: string) => ({ width: text.length * 50 })),
          strokeText: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );

    new DiceMesh(createDiceGeometry(), {
      size: 1,
      radius: 0,
      faceTexts: {
        ...DEFAULT_FACE_TEXTS,
        1: '',
        2: '',
        3: 'hello world from dice talk',
        4: '',
        5: '',
        6: '',
      },
    });

    const lines = fillText.mock.calls.map(([line]) => line);
    expect(lines).toContain('hello');
    expect(lines).toContain('world');
    expect(lines).not.toContain('hello wor');
  });

  it('keeps the base font size for different text lengths while they fit', () => {
    const fonts: string[] = [];
    const context = {
      font: '',
      clearRect: vi.fn(),
      fillText: vi.fn(() => {
        fonts.push(context.font);
      }),
      measureText: vi.fn((text: string) => ({ width: text.length * 28 })),
      strokeText: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => context as unknown as CanvasRenderingContext2D,
    );

    new DiceMesh(createDiceGeometry(), {
      size: 1,
      radius: 0,
      faceTexts: mixedLengthFaceTexts,
    });

    expect(new Set(fonts)).toEqual(new Set([fonts[0]]));
    expect(fonts[0]).toContain('96px');
  });

  it('setPose updates the mesh quaternion', () => {
    const dm = new DiceMesh(createDiceGeometry());
    const q: Quat = [0, Math.SQRT1_2, 0, Math.SQRT1_2];
    dm.setPose(q);
    expect(dm.mesh.quaternion.y).toBeCloseTo(Math.SQRT1_2, 9);
    expect(dm.mesh.quaternion.w).toBeCloseTo(Math.SQRT1_2, 9);
  });

  it('puts the selected pip label closest to the camera for every spin target', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          clearRect: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn((text: string) => ({ width: text.length * 80 })),
          strokeText: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );
    const dm = new DiceMesh(createDiceGeometry(), { size: 1, faceTexts: DEFAULT_FACE_TEXTS });

    for (const pip of [1, 2, 3, 4, 5, 6] as const) {
      dm.setPose(getTargetQuatForPip(pip));
      dm.mesh.updateMatrixWorld(true);
      const frontLabel = [...dm.mesh.children]
        .map((child) => ({
          pip: child.userData.pip,
          z: child.getWorldPosition(dm.mesh.position.clone()).z,
        }))
        .sort((a, b) => b.z - a.z)[0];

      expect(frontLabel?.pip).toBe(pip);
    }
  });

  it('dispose() releases geometry and materials', () => {
    const result = createDiceGeometry();
    const geomDispose = vi.spyOn(result.geometry, 'dispose');
    const matDisposes = result.materials.map((m) => vi.spyOn(m, 'dispose'));
    const dm = new DiceMesh(result);
    dm.dispose();
    expect(geomDispose).toHaveBeenCalledOnce();
    for (const spy of matDisposes) expect(spy).toHaveBeenCalledOnce();
  });

  it('skips labels when canvas context or text content is empty', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const withoutContext = new DiceMesh(createDiceGeometry(), {
      size: 1,
      faceTexts: DEFAULT_FACE_TEXTS,
    });
    expect(withoutContext.mesh.children).toHaveLength(0);

    vi.restoreAllMocks();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          clearRect: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn((text: string) => ({ width: text.length * 80 })),
          strokeText: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );
    const emptyText = new DiceMesh(createDiceGeometry(), {
      size: 1,
      faceTexts: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },
    });
    expect(emptyText.mesh.children).toHaveLength(0);
  });

  it('updates only changed labels and clears labels when texts are removed', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          clearRect: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn((text: string) => ({ width: text.length * 20 })),
          strokeText: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );
    const dm = new DiceMesh(createDiceGeometry(), { size: 1, faceTexts: DEFAULT_FACE_TEXTS });
    const firstChildren = [...dm.mesh.children];

    dm.updateFaceTexts(DEFAULT_FACE_TEXTS, { size: 1, radius: 0 });
    expect(dm.mesh.children).toEqual(firstChildren);

    dm.updateFaceTexts({ ...DEFAULT_FACE_TEXTS, 3: '更新' }, { size: 1, radius: 0 });
    expect(dm.mesh.children).toHaveLength(6);
    expect(dm.mesh.children).not.toEqual(firstChildren);

    dm.updateFaceTexts(undefined, { size: 1, radius: 0 });
    expect(dm.mesh.children).toHaveLength(0);
  });
});
