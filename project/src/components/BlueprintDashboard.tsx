import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { PlusCircle, Search, Download, FileText, Trash2, Edit2, LayoutGrid, Ruler, PaintBucket, Hammer, Calculator } from 'lucide-react';
import RoomBuilder from './RoomBuilder';
import { Room, RoomType } from '../types/room';
import EngineIcon from './EngineIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatNumber = (value: number, decimals = 2) => {
  if (value > 999999999) {
    return "999,999,999.99+";
  }
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export default function BlueprintDashboard() {
  const { state, dispatch } = useRoom();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<RoomType | 'All'>('All');

  useEffect(() => {
    const savedRooms = localStorage.getItem('rooms');
    if (savedRooms && state.rooms.length === 0) {  // Only load if state is empty
      const rooms = JSON.parse(savedRooms);
      dispatch({ type: 'INITIALIZE_ROOMS', payload: rooms });
    }
  }, []);

  const calculateTotalCost = (room: Room) => {
    const materialCost =
      room.finishes.wall.materialCost * room.areas.wall +
      room.finishes.floor.materialCost * room.areas.floor +
      room.finishes.ceiling.materialCost * room.areas.ceiling;

    const labourCost =
      room.finishes.wall.labourCost * room.areas.wall +
      room.finishes.floor.labourCost * room.areas.floor +
      room.finishes.ceiling.labourCost * room.areas.ceiling;

    return { materialCost, labourCost, total: materialCost + labourCost };
  };

  const calculateProjectTotals = () => {
    return state.rooms.reduce(
      (acc, room) => {
        const costs = calculateTotalCost(room);
        const areas = room.areas;
        return {
          materialCost: acc.materialCost + costs.materialCost,
          labourCost: acc.labourCost + costs.labourCost,
          total: acc.total + costs.total,
          totalWallArea: acc.totalWallArea + areas.wall,
          totalFloorArea: acc.totalFloorArea + areas.floor,
          totalCeilingArea: acc.totalCeilingArea + areas.ceiling,
        };
      },
      { 
        materialCost: 0, 
        labourCost: 0, 
        total: 0,
        totalWallArea: 0,
        totalFloorArea: 0,
        totalCeilingArea: 0,
      }
    );
  };

  const calculateAreasByFinish = () => {
    const areasByFinish = {
      wall: {} as Record<string, number>,
      floor: {} as Record<string, number>,
      ceiling: {} as Record<string, number>,
    };

    state.rooms.forEach((room) => {
      ['wall', 'floor', 'ceiling'].forEach((surface) => {
        const finish = room.finishes[surface as keyof typeof room.finishes].type;
        if (finish) {
          areasByFinish[surface as keyof typeof areasByFinish][finish] = 
            (areasByFinish[surface as keyof typeof areasByFinish][finish] || 0) + 
            room.areas[surface as keyof typeof room.areas];
        }
      });
    });

    return areasByFinish;
  };

  const filteredRooms = state.rooms.filter((room) => {
    const matchesSearch = room.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || room.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDeleteRoom = (roomId: string) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      dispatch({ type: 'DELETE_ROOM', payload: roomId });
      const updatedRooms = state.rooms.filter((room) => room.id !== roomId);
      localStorage.setItem('rooms', JSON.stringify(updatedRooms));
    }
  };

  const handleEditRoom = (room: Room) => {
    dispatch({ type: 'SELECT_ROOM', payload: room });
    setIsModalOpen(true);
  };

  const exportToCSV = () => {
    const projectTotals = calculateProjectTotals();
    const areasByFinish = calculateAreasByFinish();

    // Project Summary
    const summaryRows = [
      ['Project Summary'],
      ['Total Material Cost', `£${projectTotals.materialCost.toFixed(2)}`],
      ['Total Labour Cost', `£${projectTotals.labourCost.toFixed(2)}`],
      ['Total Project Cost', `£${projectTotals.total.toFixed(2)}`],
      [''],
      ['Area Summary'],
      ['Total Wall Area', `${projectTotals.totalWallArea.toFixed(2)} m²`],
      ['Total Floor Area', `${projectTotals.totalFloorArea.toFixed(2)} m²`],
      ['Total Ceiling Area', `${projectTotals.totalCeilingArea.toFixed(2)} m²`],
      [''],
      ['Room Details'],
    ];

    const headers = [
      'Room Name',
      'Type',
      'Description',
      'Dimensions (m)',
      'Wall Area (m²)',
      'Floor Area (m²)',
      'Ceiling Area (m²)',
      'Wall Finish',
      'Floor Finish',
      'Ceiling Finish',
      'Material Cost (£)',
      'Labour Cost (£)',
      'Total Cost (£)',
    ];

    const rows = state.rooms.map((room) => {
      const costs = calculateTotalCost(room);
      return [
        room.name,
        room.type,
        room.description || '',
        `${room.dimensions.length}x${room.dimensions.width}x${room.dimensions.wallHeight}`,
        room.areas.wall.toFixed(2),
        room.areas.floor.toFixed(2),
        room.areas.ceiling.toFixed(2),
        room.finishes.wall.type,
        room.finishes.floor.type,
        room.finishes.ceiling.type,
        costs.materialCost.toFixed(2),
        costs.labourCost.toFixed(2),
        costs.total.toFixed(2),
      ];
    });

    const csv = [...summaryRows, headers, ...rows]
      .map(row => Array.isArray(row) ? row.join(',') : row)
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-engine-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const projectTotals = calculateProjectTotals();
    const areasByFinish = calculateAreasByFinish();

    // Title
    doc.setFontSize(20);
    doc.text('Design Engine - Project Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    // Project Summary
    doc.setFontSize(16);
    doc.text('Project Summary', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Category', 'Value']],
      body: [
        ['Total Material Cost', `£${projectTotals.materialCost.toFixed(2)}`],
        ['Total Labour Cost', `£${projectTotals.labourCost.toFixed(2)}`],
        ['Total Project Cost', `£${projectTotals.total.toFixed(2)}`],
      ],
      theme: 'striped',
    });

    // Area Summary
    doc.setFontSize(16);
    doc.text('Area Summary', 14, doc.lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Surface', 'Total Area']],
      body: [
        ['Wall Area', `${projectTotals.totalWallArea.toFixed(2)} m²`],
        ['Floor Area', `${projectTotals.totalFloorArea.toFixed(2)} m²`],
        ['Ceiling Area', `${projectTotals.totalCeilingArea.toFixed(2)} m²`],
      ],
      theme: 'striped',
    });

    // Finish Breakdown
    doc.setFontSize(16);
    doc.text('Finish Breakdown', 14, doc.lastAutoTable.finalY + 15);

    const finishBreakdown = [];
    ['wall', 'floor', 'ceiling'].forEach(surface => {
      Object.entries(areasByFinish[surface]).forEach(([finish, area]) => {
        finishBreakdown.push([
          `${surface.charAt(0).toUpperCase() + surface.slice(1)} - ${finish}`,
          `${area.toFixed(2)} m²`
        ]);
      });
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Finish Type', 'Area']],
      body: finishBreakdown,
      theme: 'striped',
    });

    // Room Details
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Room Details', 14, 20);

    const roomData = state.rooms.map(room => {
      const costs = calculateTotalCost(room);
      return [
        room.name,
        room.type,
        `${room.dimensions.length}x${room.dimensions.width}x${room.dimensions.wallHeight}`,
        room.areas.wall.toFixed(2),
        room.areas.floor.toFixed(2),
        room.areas.ceiling.toFixed(2),
        costs.total.toFixed(2),
      ];
    });

    autoTable(doc, {
      startY: 25,
      head: [['Name', 'Type', 'Dimensions', 'Wall m²', 'Floor m²', 'Ceiling m²', 'Total Cost']],
      body: roomData,
      theme: 'striped',
    });

    doc.save('design-engine-report.pdf');
  };

  const projectTotals = calculateProjectTotals();
  const areasByFinish = calculateAreasByFinish();

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Enhanced Header */}
        <div className="title-container">
          <div className="title-background"></div>
          <div className="title-content">
            <div className="flex items-center justify-center gap-4 mb-6">
              <EngineIcon className="w-20 h-20 text-blue-600" strokeWidth={1.25} />
            </div>
            <h1 className="main-title">Design Engine</h1>
            <p className="subtitle">Room Logs & Specifications</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-16">
          <button
            onClick={() => {
              dispatch({ type: 'SELECT_ROOM', payload: null });
              setIsModalOpen(true);
            }}
            className="btn-primary text-lg"
          >
            <PlusCircle className="w-6 h-6" />
            <span>Add New Room</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Cost Summary */}
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Calculator className="w-7 h-7 text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Cost Summary</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="stat-card">
                <p className="text-sm text-blue-400 mb-1">Material Cost</p>
                <p className="stat-value">
                  £{formatNumber(projectTotals.materialCost)}
                </p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-green-400 mb-1">Labour Cost</p>
                <p className="stat-value">
                  £{formatNumber(projectTotals.labourCost)}
                </p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-purple-400 mb-1">Total Cost</p>
                <p className="stat-value">
                  £{formatNumber(projectTotals.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Area Summary */}
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Ruler className="w-7 h-7 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Area Summary</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="stat-card">
                <p className="text-sm text-amber-400 mb-1">Wall Area</p>
                <p className="stat-value">
                  {formatNumber(projectTotals.totalWallArea)}m²
                </p>
                {Object.entries(areasByFinish.wall).length > 0 && (
                  <div className="finish-breakdown">
                    <p className="text-xs text-amber-400/80 mb-2">Finish Breakdown:</p>
                    {Object.entries(areasByFinish.wall).map(([finish, area]) => (
                      <div key={finish} className="finish-breakdown-item">
                        <span className="truncate">{finish}:</span>
                        <span className="finish-breakdown-value">{formatNumber(area)}m²</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="stat-card">
                <p className="text-sm text-teal-400 mb-1">Floor Area</p>
                <p className="stat-value">
                  {formatNumber(projectTotals.totalFloorArea)}m²
                </p>
                {Object.entries(areasByFinish.floor).length > 0 && (
                  <div className="finish-breakdown">
                    <p className="text-xs text-teal-400/80 mb-2">Finish Breakdown:</p>
                    {Object.entries(areasByFinish.floor).map(([finish, area]) => (
                      <div key={finish} className="finish-breakdown-item">
                        <span className="truncate">{finish}:</span>
                        <span className="finish-breakdown-value">{formatNumber(area)}m²</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="stat-card">
                <p className="text-sm text-indigo-400 mb-1">Ceiling Area</p>
                <p className="stat-value">
                  {formatNumber(projectTotals.totalCeilingArea)}m²
                </p>
                {Object.entries(areasByFinish.ceiling).length > 0 && (
                  <div className="finish-breakdown">
                    <p className="text-xs text-indigo-400/80 mb-2">Finish Breakdown:</p>
                    {Object.entries(areasByFinish.ceiling).map(([finish, area]) => (
                      <div key={finish} className="finish-breakdown-item">
                        <span className="truncate">{finish}:</span>
                        <span className="finish-breakdown-value">{formatNumber(area)}m²</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Room List */}
        <div className="glass-card table-wrapper">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-12"
                  />
                </div>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as RoomType | 'All')}
                className="input-field"
              >
                <option value="All">All Types</option>
                <option value="Bedroom">Bedroom</option>
                <option value="Bathroom">Bathroom</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Living">Living</option>
                <option value="Dining">Dining</option>
                <option value="Other">Other</option>
              </select>
              <div className="flex gap-2">
                <button onClick={exportToCSV} className="btn-secondary whitespace-nowrap">
                  <Download className="w-5 h-5" />
                  <span>CSV</span>
                </button>
                <button onClick={exportToPDF} className="btn-secondary whitespace-nowrap">
                  <FileText className="w-5 h-5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {['Room Name', 'Type', 'Areas (m²)', 'Material Cost', 'Labour Cost', 'Total', 'Actions'].map((header) => (
                    <th key={header} className="table-header px-6 py-4 text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRooms.map((room) => {
                  const costs = calculateTotalCost(room);
                  const isHighCost = costs.total > projectTotals.total / filteredRooms.length * 1.5;
                  return (
                    <tr
                      key={room.id}
                      className={`${
                        isHighCost ? 'bg-red-50' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">
                          {room.name}
                        </div>
                        {room.description && (
                          <div className="text-gray-600 mt-1">
                            {room.description}
                          </div>
                        )}
                      </td>
                      <td className="table-cell text-gray-900">
                        {room.type}
                      </td>
                      <td className="table-cell text-gray-900">
                        <div className="space-y-1">
                          <div>Wall: {formatNumber(room.areas.wall)}m²</div>
                          <div>Floor: {formatNumber(room.areas.floor)}m²</div>
                          <div>Ceiling: {formatNumber(room.areas.ceiling)}m²</div>
                        </div>
                      </td>
                      <td className="table-cell-number font-medium text-blue-600">
                        £{formatNumber(costs.materialCost)}
                      </td>
                      <td className="table-cell-number font-medium text-green-600">
                        £{formatNumber(costs.labourCost)}
                      </td>
                      <td className="table-cell-number font-medium text-purple-600">
                        £{formatNumber(costs.total)}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RoomBuilder
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}