import { memo } from 'react';
import { useStore } from '../store/useStore';
import SearchBar from './SearchBar';

function Sidebar() {
  const {
    drawingMode,
    setDrawingMode,
    currentPolygon,
    clearPolygons,
  } = useStore();

  const handleBack = () => {
    // Navigate back - in a real app, this would use React Router
    window.history.back();
  };

  const handleStartDrawing = () => {
    setDrawingMode('draw_polygon');
  };

  const handleApplyOutline = () => {
    if (currentPolygon) {
      // In a real application, this would trigger an API call or state update
      // to apply the outline as the base image
      console.log('Applying outline as base image:', currentPolygon);
      alert('Outline applied as base image! (This is a placeholder action)');
    } else {
      alert('Please draw a polygon first');
    }
  };

  const isDrawing = drawingMode === 'draw_polygon';

  return (
    <div className="w-full md:w-96 bg-white shadow-lg flex flex-col h-screen overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-gray-900">
          Define Area of Interest
        </h1>
      </div>

      {/* Search Section */}
      <div className="p-6 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Location
        </label>
        <SearchBar />
      </div>

      {/* Drawing Controls */}
      <div className="p-6 border-b border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Drawing Tools
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleStartDrawing}
              disabled={isDrawing}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                isDrawing
                  ? 'bg-primary-600 text-white cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {isDrawing ? 'Drawing...' : 'Start Drawing'}
            </button>
            {isDrawing && (
              <button
                onClick={() => setDrawingMode('simple_select')}
                className="px-4 py-2.5 rounded-lg font-medium text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {currentPolygon && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              ✓ Polygon drawn successfully
            </p>
            <p className="text-xs text-green-600 mt-1">
              You can edit or delete the polygon on the map
            </p>
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div className="p-6 border-b border-gray-200">
        <button
          onClick={handleApplyOutline}
          disabled={!currentPolygon}
          className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
            currentPolygon
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Apply outline as base image
        </button>
      </div>

      {/* Info Section */}
      <div className="p-6 flex-1">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Instructions
          </h3>
          <ul className="text-xs text-blue-800 space-y-1.5 list-disc list-inside">
            <li>Search for a location or pan the map</li>
            <li>Click "Start Drawing" to begin creating a polygon</li>
            <li>Click on the map to add vertices</li>
            <li>Double-click or click the first point to finish</li>
            <li>Edit or delete the polygon using the map controls</li>
            <li>Click "Apply outline as base image" when done</li>
          </ul>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={clearPolygons}
          className="w-full px-4 py-2.5 rounded-lg font-medium text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          Clear All Polygons
        </button>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(Sidebar);

