import React, { useState, useRef } from 'react';
import { Plus, Minus, X, Edit } from 'lucide-react';

const AutomationLane = ({ trackId, parameter, points, onPointAdd, onPointUpdate, onPointRemove, onClose }) => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const pixelsPerSecond = 50;
  const laneHeight = 100;
  const minTime = 0;
  const maxTime = 300; // 5 minutes default

  const timeToX = (time) => time * pixelsPerSecond;
  const valueToY = (value) => laneHeight - (value * laneHeight);
  const xToTime = (x) => x / pixelsPerSecond;
  const yToValue = (y) => (laneHeight - y) / laneHeight;

  const handleCanvasClick = (e) => {
    if (isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = Math.max(minTime, Math.min(maxTime, xToTime(x)));
    const value = Math.max(0, Math.min(1, yToValue(y)));

    onPointAdd({ time, value });
  };

  const handlePointMouseDown = (point, e) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedPoint(point);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !draggedPoint || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = Math.max(minTime, Math.min(maxTime, xToTime(x)));
    const value = Math.max(0, Math.min(1, yToValue(y)));

    onPointUpdate(draggedPoint.id, { time, value });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedPoint(null);
  };

  const handlePointDelete = (pointId, e) => {
    e.stopPropagation();
    onPointRemove(pointId);
  };

  const renderGridLines = () => {
    const lines = [];
    const interval = 5; // seconds

    for (let time = 0; time <= maxTime; time += interval) {
      const x = timeToX(time);
      lines.push(
        <div
          key={`grid-${time}`}
          className="absolute top-0 bottom-0 bg-gray-700"
          style={{ left: `${x}px`, width: '1px' }}
        />
      );
    }

    return lines;
  };

  const renderHorizontalLines = () => {
    const lines = [];
    const steps = 5;

    for (let i = 0; i <= steps; i++) {
      const value = i / steps;
      const y = valueToY(value);
      lines.push(
        <div
          key={`hgrid-${i}`}
          className="absolute left-0 right-0 border-b border-gray-800"
          style={{ top: `${y}px` }}
        />
      );
    }

    return lines;
  };

  const renderAutomationLine = () => {
    if (!points || points.length < 2) return null;

    const sortedPoints = [...points].sort((a, b) => a.time - b.time);
    const pathData = sortedPoints.map((point, index) => {
      const x = timeToX(point.time);
      const y = valueToY(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: `${maxTime * pixelsPerSecond}px`, height: `${laneHeight}px` }}
      >
        <path
          d={pathData}
          stroke="#8B5CF6"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    );
  };

  const renderPoints = () => {
    if (!points) return null;

    return points.map((point) => {
      const x = timeToX(point.time);
      const y = valueToY(point.value);
      const isHovered = hoveredPoint?.id === point.id;

      return (
        <g key={point.id}>
          <circle
            cx={x}
            cy={y}
            r={isHovered ? 8 : 6}
            fill="#8B5CF6"
            stroke={isHovered ? '#A78BFA' : '#6D28D9'}
            strokeWidth={2}
            className="cursor-pointer"
            onMouseDown={(e) => handlePointMouseDown(point, e)}
            onMouseEnter={() => setHoveredPoint(point)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
          {isHovered && (
            <g>
              <circle
                cx={x}
                cy={y}
                r={12}
                fill="rgba(139, 92, 246, 0.2)"
              />
              <foreignObject
                x={x + 12}
                y={y - 12}
                width={80}
                height={24}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white">
                    {point.value.toFixed(2)}
                  </span>
                  <button
                    onClick={(e) => handlePointDelete(point.id, e)}
                    className="p-0.5 bg-red-600 hover:bg-red-700 rounded"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              </foreignObject>
            </g>
          )}
        </g>
      );
    });
  };

  return (
    <div className="flex flex-col bg-gray-900 border-b border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="flex items-center gap-2">
          <Edit className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white capitalize">
            {parameter} Automation
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Lane Content */}
      <div
        ref={canvasRef}
        className="relative cursor-crosshair"
        style={{ width: `${maxTime * pixelsPerSecond}px`, height: `${laneHeight}px` }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gray-900/50" />

        {/* Grid Lines */}
        {renderGridLines()}
        {renderHorizontalLines()}

        {/* Center Line (0.5) */}
        <div
          className="absolute left-0 right-0 border-t border-purple-500/30"
          style={{ top: `${laneHeight / 2}px` }}
        />

        {/* Automation Line */}
        {renderAutomationLine()}

        {/* Control Points */}
        <svg
          className="absolute inset-0"
          style={{ width: `${maxTime * pixelsPerSecond}px`, height: `${laneHeight}px` }}
        >
          {renderPoints()}
        </svg>

        {/* Value Labels */}
        <div className="absolute left-2 top-2 text-xs text-gray-400">1.0</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">0.5</div>
        <div className="absolute left-2 bottom-2 text-xs text-gray-400">0.0</div>
      </div>
    </div>
  );
};

export default AutomationLane;
