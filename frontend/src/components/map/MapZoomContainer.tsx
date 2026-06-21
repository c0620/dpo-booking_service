import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import { MAP_HEIGHT, MAP_WIDTH } from './mapLayout';

const MIN_SCALE = 0.5;
const MIN_SCALE_EPS = 0.015;
const SMOOTH_MS = 350;

interface Props {
  children: ReactNode;
  zoomToRoomId?: number | null;
  roomSelector?: string;
}

function isAtMinZoom(scale: number) {
  return scale <= MIN_SCALE + MIN_SCALE_EPS;
}

function getClampedPosition(
  positionX: number,
  positionY: number,
  scale: number,
  wrapper: HTMLDivElement,
  content: HTMLDivElement,
) {
  const wrapperWidth = wrapper.offsetWidth;
  const wrapperHeight = wrapper.offsetHeight;
  const contentWidth = content.offsetWidth * scale;
  const contentHeight = content.offsetHeight * scale;

  const minX = Math.min(0, wrapperWidth - contentWidth);
  const maxX = Math.max(0, wrapperWidth - contentWidth);
  const minY = Math.min(0, wrapperHeight - contentHeight);
  const maxY = Math.max(0, wrapperHeight - contentHeight);

  return {
    x: Math.min(maxX, Math.max(minX, positionX)),
    y: Math.min(maxY, Math.max(minY, positionY)),
  };
}

/** Смещение центра зума влево от середины экрана (панель справа перекрывает карту). */
function getPanelZoomOffsetX(wrapper: HTMLElement): number {
  const panel = document.querySelector<HTMLElement>(
    '.start-page .control-panel.start-page-panel',
  );
  if (!panel || getComputedStyle(panel).position !== 'absolute') return 0;

  const wrapperRect = wrapper.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const obscuredWidth = Math.max(0, wrapperRect.right - panelRect.left);

  return obscuredWidth > 0 ? -obscuredWidth / 2 : 0;
}

function clampIfMinZoom(ref: ReactZoomPanPinchRef, animate = false) {
  // limitToBounds всегда выкл — иначе библиотека отключает инерцию при отдалении
  ref.instance.setup.limitToBounds = false;

  if (!isAtMinZoom(ref.state.scale)) return;

  const { wrapperComponent, contentComponent } = ref.instance;
  if (!wrapperComponent || !contentComponent) return;

  const { scale, positionX, positionY } = ref.state;
  const { x, y } = getClampedPosition(
    positionX,
    positionY,
    scale,
    wrapperComponent,
    contentComponent,
  );

  if (x !== positionX || y !== positionY) {
    if (animate) {
      ref.setTransform(x, y, scale, SMOOTH_MS, 'easeOut');
    } else {
      ref.instance.setState(scale, x, y);
    }
  }
}

export function MapZoomContainer({ children, zoomToRoomId, roomSelector }: Props) {
  const ref = useRef<ReactZoomPanPinchRef>(null);

  useEffect(() => {
    if (!zoomToRoomId || !roomSelector || !ref.current) return;
    const el = document.querySelector(roomSelector);
    const wrapper = ref.current.instance.wrapperComponent;
    if (!el || !wrapper) return;

    const offsetX = getPanelZoomOffsetX(wrapper);
    ref.current.zoomToElement(el as HTMLElement, 1.2, 1400, 'easeOut', offsetX, 0);
  }, [zoomToRoomId, roomSelector]);

  const handleTransform = useCallback((ctx: ReactZoomPanPinchRef) => {
    clampIfMinZoom(ctx, false);
  }, []);

  const handleTransformStop = useCallback((ctx: ReactZoomPanPinchRef) => {
    clampIfMinZoom(ctx, true);
  }, []);

  return (
    <TransformWrapper
      ref={ref}
      initialScale={1}
      minScale={MIN_SCALE}
      maxScale={3}
      centerOnInit
      limitToBounds={false}
      smooth
      wheel={{ step: 0.004 }}
      pinch={{ step: 0.015 }}
      doubleClick={{ disabled: true }}
      autoAlignment={{ disabled: true }}
      zoomAnimation={{ animationTime: SMOOTH_MS, animationType: 'easeOut' }}
      velocityAnimation={{
        animationTime: 900,
        animationType: 'easeOut',
        sensitivityMouse: 0.85,
        sensitivityTouch: 1,
      }}
      onInit={handleTransform}
      onPanningStart={handleTransform}
      onPanning={handleTransform}
      onZoom={handleTransform}
      onPanningStop={handleTransformStop}
      onZoomStop={handleTransformStop}
    >
      <TransformComponent
        wrapperClass="map-zoom-wrapper"
        contentClass="map-zoom-content"
        contentStyle={{
          width: `min(100vw, calc(100vh * ${MAP_WIDTH} / ${MAP_HEIGHT}))`,
          aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}`,
        }}
      >
        {children}
      </TransformComponent>
    </TransformWrapper>
  );
}
