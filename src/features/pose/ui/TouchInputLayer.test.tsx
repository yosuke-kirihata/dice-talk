import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TouchPoseSource } from '@/features/pose/sources/touchPoseSource';
import { TouchInputLayer } from './TouchInputLayer';

describe('TouchInputLayer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders an element with the touch-input-layer testid', () => {
    const src = new TouchPoseSource();
    const { getByTestId } = render(<TouchInputLayer source={src} />);
    expect(getByTestId('touch-input-layer')).toBeInTheDocument();
  });

  it('drag (down + move + up) calls applyDelta and changes the pose', () => {
    const src = new TouchPoseSource();
    const before = src.getCurrentPose().quat;
    const { getByTestId } = render(<TouchInputLayer source={src} />);
    const layer = getByTestId('touch-input-layer');
    fireEvent.pointerDown(layer, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(layer, { pointerId: 1, clientX: 150, clientY: 130 });
    fireEvent.pointerUp(layer, { pointerId: 1, clientX: 150, clientY: 130 });
    expect(src.getCurrentPose().quat).not.toEqual(before);
  });

  it('captures the active pointer when the browser supports pointer capture', () => {
    const src = new TouchPoseSource();
    const { getByTestId } = render(<TouchInputLayer source={src} />);
    const layer = getByTestId('touch-input-layer');
    const setPointerCapture = vi.fn();
    Object.defineProperty(layer, 'setPointerCapture', {
      value: setPointerCapture,
      configurable: true,
    });

    fireEvent.pointerDown(layer, { pointerId: 7, clientX: 10, clientY: 20 });

    expect(setPointerCapture).toHaveBeenCalledWith(7);
  });

  it('releases pointer capture on pointer up', () => {
    const src = new TouchPoseSource();
    const { getByTestId } = render(<TouchInputLayer source={src} />);
    const layer = getByTestId('touch-input-layer');
    const releasePointerCapture = vi.fn();
    Object.defineProperty(layer, 'hasPointerCapture', {
      value: vi.fn(() => true),
      configurable: true,
    });
    Object.defineProperty(layer, 'releasePointerCapture', {
      value: releasePointerCapture,
      configurable: true,
    });

    fireEvent.pointerDown(layer, { pointerId: 7, clientX: 10, clientY: 20 });
    fireEvent.pointerUp(layer, { pointerId: 7, clientX: 10, clientY: 20 });

    expect(releasePointerCapture).toHaveBeenCalledWith(7);
  });

  it('move without prior down leaves pose unchanged', () => {
    const src = new TouchPoseSource();
    const before = src.getCurrentPose().quat;
    const { getByTestId } = render(<TouchInputLayer source={src} />);
    fireEvent.pointerMove(getByTestId('touch-input-layer'), {
      pointerId: 1,
      clientX: 200,
      clientY: 200,
    });
    expect(src.getCurrentPose().quat).toEqual(before);
  });

  it('ignores moves and pointerup from a different pointer', () => {
    const src = new TouchPoseSource();
    const before = src.getCurrentPose().quat;
    const { getByTestId } = render(<TouchInputLayer source={src} />);
    const layer = getByTestId('touch-input-layer');

    fireEvent.pointerDown(layer, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(layer, { pointerId: 2, clientX: 150, clientY: 130 });
    fireEvent.pointerUp(layer, { pointerId: 2, clientX: 150, clientY: 130 });

    expect(src.getCurrentPose().quat).toEqual(before);
  });

  it('starts spin after long press release without movement', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const src = new TouchPoseSource();
    const startSpin = vi.spyOn(src, 'startSpin').mockReturnValue(3);
    const { getByTestId } = render(<TouchInputLayer source={src} />);
    const layer = getByTestId('touch-input-layer');

    fireEvent.pointerDown(layer, { pointerId: 1, clientX: 100, clientY: 100 });
    vi.setSystemTime(1500);
    fireEvent.pointerUp(layer, { pointerId: 1, clientX: 100, clientY: 100 });

    expect(startSpin).toHaveBeenCalledOnce();
  });

  it('calls onSpinStart after a long press starts spin', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const src = new TouchPoseSource();
    const startSpin = vi.spyOn(src, 'startSpin').mockReturnValue(3);
    const onSpinStart = vi.fn();
    const { getByTestId } = render(<TouchInputLayer source={src} onSpinStart={onSpinStart} />);
    const layer = getByTestId('touch-input-layer');

    fireEvent.pointerDown(layer, { pointerId: 1, clientX: 100, clientY: 100 });
    vi.setSystemTime(1500);
    fireEvent.pointerUp(layer, { pointerId: 1, clientX: 100, clientY: 100 });

    expect(startSpin).toHaveBeenCalledBefore(onSpinStart);
    expect(onSpinStart).toHaveBeenCalledOnce();
  });

  it('does not start spin when long press moves beyond tolerance', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const src = new TouchPoseSource();
    const startSpin = vi.spyOn(src, 'startSpin').mockReturnValue(3);
    const { getByTestId } = render(<TouchInputLayer source={src} />);
    const layer = getByTestId('touch-input-layer');

    fireEvent.pointerDown(layer, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(layer, { pointerId: 1, clientX: 120, clientY: 100 });
    vi.setSystemTime(1500);
    fireEvent.pointerUp(layer, { pointerId: 1, clientX: 120, clientY: 100 });

    expect(startSpin).not.toHaveBeenCalled();
  });
});
