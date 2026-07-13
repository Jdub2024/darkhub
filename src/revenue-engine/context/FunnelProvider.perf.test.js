import { renderHook, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

jest.useFakeTimers();

describe('FunnelProvider Performance', () => {
  test('onStateChange should be debounced to avoid excessive calls during drag', () => {
    const onStateChange = jest.fn();
    const initialNodes = [{ id: '1', position: { x: 0, y: 0 } }];

    const wrapper = ({ children }) => (
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChange}
        autoSync={true}
      >
        {children}
      </FunnelProvider>
    );

    const { result } = renderHook(() => useFunnel(), { wrapper });

    // With debounce, the initial mount effect also gets debounced
    expect(onStateChange).toHaveBeenCalledTimes(0);

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Initial call on mount (debounced)
    expect(onStateChange).toHaveBeenCalledTimes(1);

    // Simulate rapid updates (e.g., dragging)
    act(() => {
      result.current.updateNodePosition('1', 10, 10);
      result.current.updateNodePosition('1', 20, 20);
      result.current.updateNodePosition('1', 30, 30);
    });

    // Should NOT have been called for each update if debounced
    expect(onStateChange).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should be called once after debounce period
    expect(onStateChange).toHaveBeenCalledTimes(2);
  });

  test('updateNodePosition should bail out if position is unchanged', () => {
    const initialNodes = [{ id: '1', position: { x: 10, y: 10 } }];
    let nodesCapture;

    const wrapper = ({ children }) => (
      <FunnelProvider initialNodes={initialNodes}>
        {children}
        <Consumer onNodes={(nodes) => { nodesCapture = nodes; }} />
      </FunnelProvider>
    );

    const Consumer = ({ onNodes }) => {
      const { nodes } = useFunnel();
      onNodes(nodes);
      return null;
    };

    const { result } = renderHook(() => useFunnel(), { wrapper });

    const firstNodes = nodesCapture;

    act(() => {
      result.current.updateNodePosition('1', 10, 10); // Same position
    });

    // Should be the exact same object reference if bailed out
    expect(nodesCapture).toBe(firstNodes);
  });
});
