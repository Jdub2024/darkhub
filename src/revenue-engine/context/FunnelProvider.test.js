import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

jest.useFakeTimers();

describe('FunnelProvider performance and synchronization', () => {
  const initialNodes = [
    { id: 'node_1', position: { x: 10, y: 20 }, metrics: {} },
    { id: 'node_2', position: { x: 30, y: 40 }, metrics: {} },
  ];

  const wrapper = ({ children, onStateChange, autoSync = true }) => (
    <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChange} autoSync={autoSync}>
      {children}
    </FunnelProvider>
  );

  test('does not trigger onStateChange immediately if autoSync is enabled (debounced)', () => {
    const onStateChange = jest.fn();
    renderHook(() => useFunnel(), {
      wrapper: (props) => wrapper({ ...props, onStateChange }),
    });

    // On mount, autoSync should not trigger onStateChange synchronously
    expect(onStateChange).not.toHaveBeenCalled();

    // Fast-forward time by 150ms
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(onStateChange).toHaveBeenCalledTimes(1);
  });

  test('debounces state changes and batches them to reduce synchronization frequency', () => {
    const onStateChange = jest.fn();
    const { result } = renderHook(() => useFunnel(), {
      wrapper: (props) => wrapper({ ...props, onStateChange }),
    });

    // Advance initial mount debounce timer
    act(() => {
      jest.advanceTimersByTime(150);
    });
    onStateChange.mockClear();

    // Simulate high frequency updates (e.g., node movement)
    act(() => {
      result.current.updateNodePosition('node_1', 11, 20);
    });
    act(() => {
      result.current.updateNodePosition('node_1', 12, 20);
    });
    act(() => {
      result.current.updateNodePosition('node_1', 13, 20);
    });

    // Callback should not be called yet
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance time partly
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance remaining time
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Should only have been called once with the final state
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'node_1', position: { x: 13, y: 20 }, metrics: {} },
        { id: 'node_2', position: { x: 30, y: 40 }, metrics: {} },
      ],
      edges: [],
    });
  });

  test('does not trigger state update or callback if position coordinate values are unchanged (equality guard)', () => {
    const onStateChange = jest.fn();
    const { result } = renderHook(() => useFunnel(), {
      wrapper: (props) => wrapper({ ...props, onStateChange }),
    });

    // Advance initial mount debounce
    act(() => {
      jest.advanceTimersByTime(150);
    });
    onStateChange.mockClear();

    const previousNodesReference = result.current.nodes;

    // Trigger update with identical coordinates
    act(() => {
      result.current.updateNodePosition('node_1', 10, 20);
    });

    // Since position is identical, reference of nodes state should remain strictly equal
    expect(result.current.nodes).toBe(previousNodesReference);

    // Fast-forward time and confirm no callbacks are queued
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).not.toHaveBeenCalled();
  });
});
