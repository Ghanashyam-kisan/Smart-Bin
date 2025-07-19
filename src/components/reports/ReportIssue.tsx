import React, { useState } from 'react';
import { Camera, MapPin, AlertTriangle, Upload } from 'lucide-react';
import { mockBins } from '../../data/mockData';

const ReportIssue: React.FC = () => {
  const [selectedBin, setSelectedBin] = useState('');
  const [issueType, setIssueType] = useState<'overflow' | 'damage' | 'maintenance'>('overflow');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  const [image, setImage] = useState<File | null>(null);
  const [locationDetected, setLocationDetected] = useState(false);

  const handleLocationDetection = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationDetected(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to detect location. Please try again.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const reportData = {
      binId: selectedBin,
      type: issueType,
      description,
      location,
      image: image?.name,
      timestamp: new Date().toISOString()
    };
    
    console.log('Report submitted:', reportData);
    
    // Reset form
    setSelectedBin('');
    setIssueType('overflow');
    setDescription('');
    setLocation({ lat: 0, lng: 0 });
    setImage(null);
    setLocationDetected(false);
    
    alert('Report submitted successfully! We will investigate this issue promptly.');
  };

  const issueTypes = [
    { value: 'overflow', label: 'Overflowing Bin', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'damage', label: 'Bin Damage', icon: AlertTriangle, color: 'text-orange-600' },
    { value: 'maintenance', label: 'Maintenance Needed', icon: AlertTriangle, color: 'text-yellow-600' }
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Issue</h1>
        <p className="text-gray-600">Report problems with waste bins to help us maintain better service.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Issue Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {issueTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setIssueType(type.value)}
                        className={`p-4 rounded-lg border-2 text-center transition-colors ${
                          issueType === type.value
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Icon className={`h-6 w-6 mx-auto mb-2 ${
                          issueType === type.value ? 'text-green-600' : type.color
                        }`} />
                        <span className="font-medium text-sm">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bin Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Bin (Optional)
                </label>
                <select
                  value={selectedBin}
                  onChange={(e) => setSelectedBin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose a bin or enter location manually...</option>
                  {mockBins.map((bin) => (
                    <option key={bin.id} value={bin.id}>
                      {bin.type.charAt(0).toUpperCase() + bin.type.slice(1)} Bin - {bin.location.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleLocationDetection}
                    className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                  >
                    <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                    Use Current Location
                  </button>
                  
                  {locationDetected && (
                    <div className="bg-green-50 p-3 rounded-md border border-green-200">
                      <p className="text-sm text-green-800">
                        Location detected: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Please describe the issue in detail..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Evidence (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                        <span>Upload a photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    
                    {image && (
                      <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                        <div className="flex items-center">
                          <Upload className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-sm text-green-800">{image.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Submit Report
              </button>
            </form>
          </div>
        </div>

        {/* Guidelines */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporting Guidelines</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <p>Provide clear, detailed descriptions of the issue</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <p>Include photos when possible for faster resolution</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <p>Use current location for accurate bin identification</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <p>Reports are reviewed within 24 hours</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h4 className="font-medium text-orange-900 mb-2">Emergency Issues</h4>
            <p className="text-sm text-orange-800">
              For urgent issues like hazardous spills or health hazards, please call our emergency hotline: 
              <span className="font-medium block mt-1">1-800-WASTE-911</span>
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Common Issues</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Overflowing bins</li>
              <li>• Damaged or broken bins</li>
              <li>• Missed collections</li>
              <li>• Incorrect bin placement</li>
              <li>• Contamination issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;