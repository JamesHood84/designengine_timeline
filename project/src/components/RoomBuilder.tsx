import React, { useEffect, useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { Room, RoomType, WallFinishType, FloorFinishType, CeilingFinishType, Finish } from '../types/room';
import { X, Save, Ruler, Paintbrush as Paint, Grid } from 'lucide-react';

const ROOM_TYPES: RoomType[] = ['Bedroom', 'Bathroom', 'Kitchen', 'Living', 'Dining', 'Other'];

const WALL_FINISHES: WallFinishType[] = [
  'Paint - Matt',
  'Paint - Eggshell',
  'Paint - Gloss',
  'Wallpaper - Standard',
  'Wallpaper - Premium',
  'Tiles - Ceramic',
  'Tiles - Porcelain',
  'Wood Paneling',
  'Stone Cladding'
];

const FLOOR_FINISHES: FloorFinishType[] = [
  'Carpet - Standard',
  'Carpet - Premium',
  'Hardwood - Oak',
  'Hardwood - Walnut',
  'Laminate',
  'Luxury Vinyl Tiles',
  'Tiles - Ceramic',
  'Tiles - Porcelain',
  'Polished Concrete',
  'Natural Stone'
];

const CEILING_FINISHES: CeilingFinishType[] = [
  'Paint - Matt',
  'Paint - Anti-Mould',
  'Suspended Ceiling',
  'Wood Paneling',
  'Stretch Ceiling',
  'Acoustic Panels'
];

const DEFAULT_FINISH: Finish = {
  type: '',
  materialCost: 0,
  labourCost: 0,
};

interface RoomBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RoomBuilder({ isOpen, onClose }: RoomBuilderProps) {
  const { state, dispatch } = useRoom();
  const [room, setRoom] = useState<Partial<Room>>({
    name: '',
    type: 'Other',
    description: '',
    dimensions: { length: 0, width: 0, wallHeight: 0 },
    areas: { wall: 0, floor: 0, ceiling: 0 },
    finishes: {
      wall: { ...DEFAULT_FINISH },
      floor: { ...DEFAULT_FINISH },
      ceiling: { ...DEFAULT_FINISH },
    },
  });

  useEffect(() => {
    if (state.selectedRoom) {
      setRoom(state.selectedRoom);
    } else {
      setRoom({
        name: '',
        type: 'Other',
        description: '',
        dimensions: { length: 0, width: 0, wallHeight: 0 },
        areas: { wall: 0, floor: 0, ceiling: 0 },
        finishes: {
          wall: { ...DEFAULT_FINISH },
          floor: { ...DEFAULT_FINISH },
          ceiling: { ...DEFAULT_FINISH },
        },
      });
    }
  }, [state.selectedRoom]);

  useEffect(() => {
    if (room.dimensions) {
      const { length, width, wallHeight } = room.dimensions;
      const wallArea = 2 * (length + width) * wallHeight;
      const floorArea = length * width;
      
      setRoom(prev => ({
        ...prev,
        areas: {
          wall: wallArea,
          floor: floorArea,
          ceiling: floorArea,
        },
      }));
    }
  }, [room.dimensions]);

  const handleSave = () => {
    if (!room.name || !room.dimensions) return;

    const newRoom: Room = {
      id: state.selectedRoom?.id || crypto.randomUUID(),
      name: room.name,
      type: room.type as RoomType,
      description: room.description,
      dimensions: room.dimensions,
      areas: room.areas!,
      finishes: room.finishes!,
    };

    dispatch({
      type: state.selectedRoom ? 'UPDATE_ROOM' : 'ADD_ROOM',
      payload: newRoom,
    });

    const rooms = state.selectedRoom 
      ? state.rooms.map(r => r.id === newRoom.id ? newRoom : r)
      : [...state.rooms, newRoom];
    localStorage.setItem('rooms', JSON.stringify(rooms));

    onClose();
    dispatch({ type: 'SELECT_ROOM', payload: null });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {state.selectedRoom ? 'Edit Room' : 'New Room'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Identity Section */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={room.name}
                onChange={(e) => setRoom({ ...room, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Master Bedroom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type
              </label>
              <select
                value={room.type}
                onChange={(e) => setRoom({ ...room, type: e.target.value as RoomType })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={room.description}
              onChange={(e) => setRoom({ ...room, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={3}
              placeholder="Add any additional notes about this room..."
            />
          </div>

          {/* Dimensions */}
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Ruler className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Dimensions</h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length (m)
                </label>
                <input
                  type="number"
                  value={room.dimensions?.length}
                  onChange={(e) =>
                    setRoom({
                      ...room,
                      dimensions: {
                        ...room.dimensions!,
                        length: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (m)
                </label>
                <input
                  type="number"
                  value={room.dimensions?.width}
                  onChange={(e) =>
                    setRoom({
                      ...room,
                      dimensions: {
                        ...room.dimensions!,
                        width: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wall Height (m)
                </label>
                <input
                  type="number"
                  value={room.dimensions?.wallHeight}
                  onChange={(e) =>
                    setRoom({
                      ...room,
                      dimensions: {
                        ...room.dimensions!,
                        wallHeight: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Finishes */}
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Paint className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Finishes</h3>
            </div>
            {[
              { surface: 'wall' as const, options: WALL_FINISHES },
              { surface: 'floor' as const, options: FLOOR_FINISHES },
              { surface: 'ceiling' as const, options: CEILING_FINISHES }
            ].map(({ surface, options }) => (
              <div key={surface} className="mb-6 last:mb-0">
                <h4 className="text-lg font-medium text-gray-800 mb-3 capitalize">
                  {surface} Finish
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={room.finishes?.[surface].type}
                      onChange={(e) =>
                        setRoom({
                          ...room,
                          finishes: {
                            ...room.finishes!,
                            [surface]: {
                              ...room.finishes![surface],
                              type: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select a finish type</option>
                      {options.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Material Cost (£/m²)
                    </label>
                    <input
                      type="number"
                      value={room.finishes?.[surface].materialCost}
                      onChange={(e) =>
                        setRoom({
                          ...room,
                          finishes: {
                            ...room.finishes!,
                            [surface]: {
                              ...room.finishes![surface],
                              materialCost: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Labour Cost (£/m²)
                    </label>
                    <input
                      type="number"
                      value={room.finishes?.[surface].labourCost}
                      onChange={(e) =>
                        setRoom({
                          ...room,
                          finishes: {
                            ...room.finishes!,
                            [surface]: {
                              ...room.finishes![surface],
                              labourCost: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Calculated Areas */}
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Grid className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Calculated Areas
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wall Area (m²)
                </label>
                <input
                  type="number"
                  value={room.areas?.wall.toFixed(2)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor Area (m²)
                </label>
                <input
                  type="number"
                  value={room.areas?.floor.toFixed(2)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ceiling Area (m²)
                </label>
                <input
                  type="number"
                  value={room.areas?.ceiling.toFixed(2)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Room
          </button>
        </div>
      </div>
    </div>
  );
}