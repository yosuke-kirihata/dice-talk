import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromAxisAngle } from '@/features/pose/lib/quaternion';
import { ScriptedPoseSource } from '@/features/pose/sources/scriptedPoseSource';
import type { PoseSnapshot } from '@/shared/pose';
import { PoseHud } from './PoseHud';

describe('PoseHud', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows yaw/pitch/roll labels for the current pose', () => {
    const q = fromAxisAngle([0, 1, 0], Math.PI / 2);
    const src = new ScriptedPoseSource([{ quat: q, timestamp: 0 }]);
    render(<PoseHud poseSource={src} />);
    expect(screen.getByText(/yaw/i)).toBeInTheDocument();
    expect(screen.getByText(/pitch/i)).toBeInTheDocument();
    expect(screen.getByText(/roll/i)).toBeInTheDocument();
  });

  it('reads initial pose and renders yaw value (90 for 90deg-Y)', () => {
    const q = fromAxisAngle([0, 1, 0], Math.PI / 2);
    const src = new ScriptedPoseSource([{ quat: q, timestamp: 0 }]);
    render(<PoseHud poseSource={src} />);
    expect(screen.getByTestId('pose-hud-yaw').textContent).toMatch(/90/);
    expect(screen.getByTestId('pose-hud-pitch').textContent).toMatch(/0/);
    expect(screen.getByTestId('pose-hud-roll').textContent).toMatch(/0/);
  });

  it('updates displayed angles on the animation loop', () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const snapshots: readonly [PoseSnapshot, PoseSnapshot] = [
      { quat: [0, 0, 0, 1], timestamp: 0 },
      { quat: fromAxisAngle([0, 1, 0], Math.PI / 2), timestamp: 50 },
    ];
    let index = 0;
    const src = {
      id: 'test',
      getCurrentPose: vi.fn(() => snapshots[index] ?? snapshots[0]),
      subscribe: vi.fn(() => vi.fn()),
      start: vi.fn(async () => {}),
      stop: vi.fn(async () => {}),
    };

    render(<PoseHud poseSource={src} />);
    expect(screen.getByTestId('pose-hud-yaw').textContent).toMatch(/0/);

    index = 1;
    act(() => {
      rafCallbacks.shift()?.(50);
    });

    expect(screen.getByTestId('pose-hud-yaw').textContent).toMatch(/90/);
  });

  it('cancels the animation loop on unmount', () => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((_cb: FrameRequestCallback) => 42),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    const { unmount } = render(<PoseHud poseSource={src} className="extra-class" />);
    unmount();

    expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(42);
  });
});
