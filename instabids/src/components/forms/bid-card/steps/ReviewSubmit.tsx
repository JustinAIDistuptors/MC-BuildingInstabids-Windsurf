'use client';

import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Control } from 'react-hook-form';

type ReviewSubmitProps = {
  mediaFiles: File[];
  setMediaFiles?: React.Dispatch<React.SetStateAction<File[]>>;
  control: Control<any>;
  register?: any;
  errors?: any;
};

export default function ReviewSubmit({ mediaFiles, control }: ReviewSubmitProps) {
  // Simple placeholder for project data
  const projectData = {
    title: "Bathroom Renovation",
    description: "Complete renovation of a master bathroom including new fixtures, tiling, and lighting.",
    job_size: "medium",
    location: {
      address_line1: "123 Main St",
      city: "Anytown",
      state: "CA",
      zip_code: "12345"
    },
    group_bidding_enabled: true
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Review Your Project</h2>
        <p className="text-gray-600 mb-6">
          Please review your project details before submitting.
        </p>
      </div>

      {/* Project Summary */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <dl className="divide-y">
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Project Title</dt>
                <dd className="text-sm text-gray-900 col-span-2">{projectData.title}</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900 col-span-2">{projectData.description}</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Project Size</dt>
                <dd className="text-sm text-gray-900 col-span-2 capitalize">{projectData.job_size}</dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Group Bidding</dt>
                <dd className="text-sm text-gray-900 col-span-2">
                  {projectData.group_bidding_enabled ? "Enabled" : "Disabled"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <dl className="divide-y">
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="text-sm text-gray-900 col-span-2">
                  {projectData.location.address_line1}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3">
                <dt className="text-sm font-medium text-gray-500">City, State, ZIP</dt>
                <dd className="text-sm text-gray-900 col-span-2">
                  {projectData.location.city}, {projectData.location.state} {projectData.location.zip_code}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Photos */}
        {mediaFiles.length > 0 && (
          <Card>
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle>Project Photos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Terms and Conditions</h3>
        
        <FormField
          control={control}
          name="terms_accepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                </FormLabel>
                <FormDescription>
                  By submitting this project, you agree to our terms and conditions.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="marketing_consent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I would like to receive updates about my project and special offers
                </FormLabel>
                <FormDescription>
                  We'll send you occasional updates about your project status and relevant promotions.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <Button type="submit" className="w-full py-6 text-lg">
          Submit Project
        </Button>
        <p className="text-center text-sm text-gray-500 mt-4">
          Your project will be visible to qualified contractors in your area.
        </p>
      </div>
    </div>
  );
}
