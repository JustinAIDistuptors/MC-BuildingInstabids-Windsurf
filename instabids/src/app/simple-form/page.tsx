'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function SimpleFormPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    projectType: '',
    projectCategory: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    timeline: '',
    budget: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    alert('Form submitted successfully!');
  };

  // Project types with simple structure
  const projectTypes = [
    { id: 'one-time', name: 'One-Time Project' },
    { id: 'recurring', name: 'Recurring Service' },
    { id: 'repair', name: 'Repair/Handyman' },
    { id: 'labor', name: 'Labor Only' },
  ];

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Project Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectTypes.map((type) => (
                <label
                  key={type.id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    formData.projectType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="projectType"
                    value={type.id}
                    checked={formData.projectType === type.id}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="font-medium">{type.name}</div>
                </label>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Project Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select State</option>
                    <option value="NY">New York</option>
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ZIP Code</label>
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Timeline & Budget</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">When do you need this project completed?</label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Timeline</option>
                  <option value="asap">As soon as possible</option>
                  <option value="1week">Within 1 week</option>
                  <option value="2weeks">Within 2 weeks</option>
                  <option value="1month">Within 1 month</option>
                  <option value="flexible">Flexible timeline</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Budget Range</label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g. $1000-$5000"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Review & Submit</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <dl className="divide-y">
                <div className="py-2 flex justify-between">
                  <dt className="font-medium">Project Type:</dt>
                  <dd>
                    {projectTypes.find((t) => t.id === formData.projectType)?.name || 'Not selected'}
                  </dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="font-medium">Location:</dt>
                  <dd>
                    {formData.address ? `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}` : 'Not provided'}
                  </dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="font-medium">Timeline:</dt>
                  <dd>{formData.timeline || 'Not selected'}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="font-medium">Budget:</dt>
                  <dd>{formData.budget || 'Not provided'}</dd>
                </div>
              </dl>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; Back to Home
        </Link>
        <h1 className="text-2xl font-bold mt-4">Create New Project (Simple Version)</h1>
        <p className="text-gray-600 mt-2">
          This reliable, minimal version of the form lets you get started right away.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex mb-2 justify-between">
          {['Project Type', 'Location', 'Timeline & Budget', 'Review'].map((label, idx) => (
            <div key={idx} className={`text-xs font-medium ${step >= idx ? 'text-blue-600' : 'text-gray-400'}`}>
              {label}
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-blue-600 rounded-full transition-all"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 shadow-sm">
        {renderStep()}

        <div className="mt-8 flex justify-between">
          {step > 0 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              className="ml-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit Project
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
