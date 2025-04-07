# Labor Marketplace Service Implementation Example

This document provides an example implementation of key services in the Labor Marketplace domain using TypeScript with Supabase integration. These implementation examples demonstrate best practices, service organization, and practical code patterns.

## Service Architecture

The Labor Marketplace domain is implemented as a set of coordinated services following a modular monolith approach:

```typescript
// Service dependencies and shared utilities
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { EventEmitter } from '../core/events/EventEmitter';
import { Logger } from '../core/logging/Logger';
import { HelperNotFoundError, JobNotFoundError, ApplicationNotFoundError } from '../core/errors/DomainErrors';
import { ValidationError } from '../core/errors/ValidationError';
import { AuthorizationError } from '../core/errors/AuthorizationError';
import { GeoUtils } from '../utils/GeoUtils';
import { RatingCalculator } from '../utils/RatingCalculator';
import { IdGenerator } from '../utils/IdGenerator';
import { DateUtils } from '../utils/DateUtils';
```

## Helper Profile Service

The HelperProfileService manages helper profiles, skills, availability, and verification status.

```typescript
// Types for the Helper Profile Service
export interface HelperSkill {
  id: string;
  helperId: string;
  skillId: string;
  skillName: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
  yearsExperience: number;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  verificationMethod?: 'certification' | 'portfolio' | 'reference' | 'test';
  verificationDate?: string;
}

export interface HelperAvailability {
  id: string;
  helperId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  recurrenceType: 'weekly' | 'biweekly' | 'monthly' | 'one_time';
  startDate?: string; // ISO date
  endDate?: string; // ISO date
}

export interface HelperProfileCreateInput {
  userId: string;
  hasTransportation: boolean;
  hasOwnTools: boolean;
  bio?: string;
  hourlyRateRange: { min: number; max: number };
  maxTravelDistance: number;
  skills: Omit<HelperSkill, 'id' | 'helperId' | 'verificationStatus' | 'verificationDate'>[];
  availability: Omit<HelperAvailability, 'id' | 'helperId'>[];
}

export interface HelperProfileUpdateInput {
  hasTransportation?: boolean;
  hasOwnTools?: boolean;
  bio?: string;
  hourlyRateRange?: { min: number; max: number };
  maxTravelDistance?: number;
  profileStatus?: 'pending_verification' | 'verified' | 'suspended' | 'inactive' | 'active';
}

// Helper Profile Service Implementation
export class HelperProfileService {
  private readonly supabase: SupabaseClient<Database>;
  private readonly eventEmitter: EventEmitter;
  private readonly logger: Logger;

  constructor(
    supabase: SupabaseClient<Database>,
    eventEmitter: EventEmitter,
    logger: Logger
  ) {
    this.supabase = supabase;
    this.eventEmitter = eventEmitter;
    this.logger = logger;
  }

  /**
   * Create a new helper profile
   */
  async createHelperProfile(input: HelperProfileCreateInput): Promise<string> {
    this.logger.info('Creating helper profile', { userId: input.userId });
    
    // Validate input
    if (input.hourlyRateRange.min < 0 || input.hourlyRateRange.max < input.hourlyRateRange.min) {
      throw new ValidationError('Invalid hourly rate range');
    }
    
    try {
      // Begin transaction
      const { data: helper, error: helperError } = await this.supabase
        .from('labor_helpers')
        .insert({
          user_id: input.userId,
          has_transportation: input.hasTransportation,
          has_own_tools: input.hasOwnTools,
          bio: input.bio || null,
          hourly_rate_min: input.hourlyRateRange.min,
          hourly_rate_max: input.hourlyRateRange.max,
          max_travel_distance: input.maxTravelDistance,
          profile_status: 'pending_verification',
          verification_level: 'basic',
          overall_rating: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      
      if (helperError) {
        this.logger.error('Error creating helper profile', { error: helperError });
        throw helperError;
      }
      
      // Add skills
      if (input.skills.length > 0) {
        const skillsToInsert = input.skills.map(skill => ({
          helper_id: helper.id,
          skill_id: skill.skillId,
          skill_name: skill.skillName,
          proficiency_level: skill.proficiencyLevel,
          years_experience: skill.yearsExperience,
          verification_status: 'unverified',
        }));
        
        const { error: skillsError } = await this.supabase
          .from('helper_skills')
          .insert(skillsToInsert);
        
        if (skillsError) {
          this.logger.error('Error adding helper skills', { error: skillsError });
          throw skillsError;
        }
      }
      
      // Add availability
      if (input.availability.length > 0) {
        const availabilityToInsert = input.availability.map(avail => ({
          helper_id: helper.id,
          day_of_week: avail.dayOfWeek,
          start_time: avail.startTime,
          end_time: avail.endTime,
          recurrence_type: avail.recurrenceType,
          start_date: avail.startDate || null,
          end_date: avail.endDate || null,
        }));
        
        const { error: availError } = await this.supabase
          .from('helper_availability')
          .insert(availabilityToInsert);
        
        if (availError) {
          this.logger.error('Error adding helper availability', { error: availError });
          throw availError;
        }
      }
      
      // Create verification record
      const { error: verificationError } = await this.supabase
        .from('helper_verifications')
        .insert({
          helper_id: helper.id,
          identity_verified: false,
          background_check_status: 'not_submitted',
          skills_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (verificationError) {
        this.logger.error('Error creating verification record', { error: verificationError });
        throw verificationError;
      }
      
      // Emit event
      this.eventEmitter.emit('helper.profile.created', {
        helperId: helper.id,
        userId: input.userId,
      });
      
      return helper.id;
    } catch (error) {
      this.logger.error('Error in createHelperProfile', { error });
      throw error;
    }
  }

  /**
   * Get helper profile by ID
   */
  async getHelperProfileById(helperId: string): Promise<any> {
    this.logger.info('Getting helper profile', { helperId });
    
    try {
      // Get helper base profile
      const { data: helper, error: helperError } = await this.supabase
        .from('labor_helpers')
        .select(`
          id,
          user_id,
          profile_status,
          verification_level,
          has_transportation,
          has_own_tools,
          bio,
          hourly_rate_min,
          hourly_rate_max,
          max_travel_distance,
          overall_rating,
          created_at,
          updated_at,
          users (
            email,
            first_name,
            last_name,
            phone_number,
            avatar_url
          )
        `)
        .eq('id', helperId)
        .single();
      
      if (helperError) {
        if (helperError.code === 'PGRST116') {
          throw new HelperNotFoundError(`Helper with ID ${helperId} not found`);
        }
        this.logger.error('Error getting helper profile', { error: helperError });
        throw helperError;
      }
      
      // Get skills
      const { data: skills, error: skillsError } = await this.supabase
        .from('helper_skills')
        .select('*')
        .eq('helper_id', helperId);
      
      if (skillsError) {
        this.logger.error('Error getting helper skills', { error: skillsError });
        throw skillsError;
      }
      
      // Get availability
      const { data: availability, error: availError } = await this.supabase
        .from('helper_availability')
        .select('*')
        .eq('helper_id', helperId);
      
      if (availError) {
        this.logger.error('Error getting helper availability', { error: availError });
        throw availError;
      }
      
      // Get verification details
      const { data: verification, error: verificationError } = await this.supabase
        .from('helper_verifications')
        .select('*')
        .eq('helper_id', helperId)
        .single();
      
      if (verificationError && verificationError.code !== 'PGRST116') {
        this.logger.error('Error getting helper verification', { error: verificationError });
        throw verificationError;
      }
      
      // Format response
      return {
        id: helper.id,
        userId: helper.user_id,
        firstName: helper.users.first_name,
        lastName: helper.users.last_name,
        email: helper.users.email,
        phoneNumber: helper.users.phone_number,
        avatarUrl: helper.users.avatar_url,
        profileStatus: helper.profile_status,
        verificationLevel: helper.verification_level,
        hasTransportation: helper.has_transportation,
        hasOwnTools: helper.has_own_tools,
        bio: helper.bio,
        hourlyRateRange: {
          min: helper.hourly_rate_min,
          max: helper.hourly_rate_max,
        },
        maxTravelDistance: helper.max_travel_distance,
        overallRating: helper.overall_rating,
        skills: skills?.map(s => ({
          id: s.id,
          skillId: s.skill_id,
          skillName: s.skill_name,
          proficiencyLevel: s.proficiency_level,
          yearsExperience: s.years_experience,
          verificationStatus: s.verification_status,
          verificationMethod: s.verification_method,
          verificationDate: s.verification_date,
        })) || [],
        availability: availability?.map(a => ({
          id: a.id,
          dayOfWeek: a.day_of_week,
          startTime: a.start_time,
          endTime: a.end_time,
          recurrenceType: a.recurrence_type,
          startDate: a.start_date,
          endDate: a.end_date,
        })) || [],
        verification: verification ? {
          identityVerified: verification.identity_verified,
          identityVerifiedDate: verification.identity_verified_date,
          backgroundCheckStatus: verification.background_check_status,
          backgroundCheckDate: verification.background_check_date,
          skillsVerified: verification.skills_verified,
          skillsVerifiedDate: verification.skills_verified_date,
          verifiedById: verification.verified_by_id,
        } : null,
        createdAt: helper.created_at,
        updatedAt: helper.updated_at,
      };
    } catch (error) {
      this.logger.error('Error in getHelperProfileById', { error });
      throw error;
    }
  }

  /**
   * Update helper profile
   */
  async updateHelperProfile(helperId: string, input: HelperProfileUpdateInput): Promise<void> {
    this.logger.info('Updating helper profile', { helperId });
    
    try {
      // Check if helper exists
      const { data: helper, error: checkError } = await this.supabase
        .from('labor_helpers')
        .select('id')
        .eq('id', helperId)
        .single();
      
      if (checkError) {
        if (checkError.code === 'PGRST116') {
          throw new HelperNotFoundError(`Helper with ID ${helperId} not found`);
        }
        throw checkError;
      }
      
      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (input.hasTransportation !== undefined) {
        updateData.has_transportation = input.hasTransportation;
      }
      
      if (input.hasOwnTools !== undefined) {
        updateData.has_own_tools = input.hasOwnTools;
      }
      
      if (input.bio !== undefined) {
        updateData.bio = input.bio;
      }
      
      if (input.hourlyRateRange) {
        updateData.hourly_rate_min = input.hourlyRateRange.min;
        updateData.hourly_rate_max = input.hourlyRateRange.max;
      }
      
      if (input.maxTravelDistance !== undefined) {
        updateData.max_travel_distance = input.maxTravelDistance;
      }
      
      if (input.profileStatus) {
        updateData.profile_status = input.profileStatus;
      }
      
      // Update profile
      const { error: updateError } = await this.supabase
        .from('labor_helpers')
        .update(updateData)
        .eq('id', helperId);
      
      if (updateError) {
        this.logger.error('Error updating helper profile', { error: updateError });
        throw updateError;
      }
      
      // Emit event
      this.eventEmitter.emit('helper.profile.updated', {
        helperId,
        updatedFields: Object.keys(input),
      });
    } catch (error) {
      this.logger.error('Error in updateHelperProfile', { error });
      throw error;
    }
  }

  /**
   * Search for helpers by skill and location
   */
  async searchHelpers(params: {
    skillIds?: string[];
    skillKeywords?: string[];
    latitude?: number;
    longitude?: number;
    radius?: number; // in miles
    zipCode?: string;
    minRating?: number;
    verificationLevel?: 'basic' | 'identity_verified' | 'background_checked' | 'fully_verified';
    maxHourlyRate?: number;
    page?: number;
    limit?: number;
  }): Promise<{ helpers: any[]; total: number; page: number; limit: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    
    try {
      let query = this.supabase
        .from('labor_helpers')
        .select(`
          id,
          profile_status,
          verification_level,
          has_transportation,
          has_own_tools,
          hourly_rate_min,
          hourly_rate_max,
          max_travel_distance,
          overall_rating,
          users!inner (
            first_name,
            last_name,
            avatar_url
          ),
          helper_skills!inner (
            skill_id,
            skill_name,
            proficiency_level
          ),
          helper_locations!inner (
            latitude,
            longitude,
            zip_code
          )
        `, { count: 'exact' });

      // Filter by profile status and verification level
      query = query.eq('profile_status', 'active');
      
      if (params.verificationLevel) {
        // Helper level must be >= required level
        const levelOrder = ['basic', 'identity_verified', 'background_checked', 'fully_verified'];
        const reqLevelIndex = levelOrder.indexOf(params.verificationLevel);
        const eligibleLevels = levelOrder.slice(reqLevelIndex);
        
        query = query.in('verification_level', eligibleLevels);
      }
      
      // Filter by skills
      if (params.skillIds && params.skillIds.length > 0) {
        query = query.in('helper_skills.skill_id', params.skillIds);
      }
      
      if (params.skillKeywords && params.skillKeywords.length > 0) {
        const skillPattern = params.skillKeywords.map(k => k.toLowerCase()).join('|');
        query = query.ilike('helper_skills.skill_name', `%${skillPattern}%`);
      }
      
      // Filter by rating
      if (params.minRating) {
        query = query.gte('overall_rating', params.minRating);
      }
      
      // Filter by hourly rate
      if (params.maxHourlyRate) {
        query = query.lte('hourly_rate_min', params.maxHourlyRate);
      }
      
      // Apply limit and offset
      query = query.range(offset, offset + limit - 1);
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) {
        this.logger.error('Error searching helpers', { error });
        throw error;
      }
      
      // Process results - for location-based search, we need to post-filter
      let results = data || [];
      
      // Filter by location if coordinates provided
      if (params.latitude && params.longitude && params.radius) {
        results = results.filter(helper => {
          const helperLocation = helper.helper_locations[0];
          if (!helperLocation) return false;
          
          const distance = GeoUtils.calculateDistance(
            params.latitude!,
            params.longitude!,
            helperLocation.latitude,
            helperLocation.longitude
          );
          
          return distance <= params.radius! && distance <= helper.max_travel_distance;
        });
      }
      
      // Format response
      const formattedResults = results.map(helper => ({
        id: helper.id,
        firstName: helper.users.first_name,
        lastName: helper.users.last_name,
        avatarUrl: helper.users.avatar_url,
        verificationLevel: helper.verification_level,
        hasTransportation: helper.has_transportation,
        hasOwnTools: helper.has_own_tools,
        hourlyRateRange: {
          min: helper.hourly_rate_min,
          max: helper.hourly_rate_max,
        },
        overallRating: helper.overall_rating,
        skills: helper.helper_skills.map((s: any) => ({
          skillId: s.skill_id,
          skillName: s.skill_name,
          proficiencyLevel: s.proficiency_level,
        })),
        location: helper.helper_locations[0] ? {
          latitude: helper.helper_locations[0].latitude,
          longitude: helper.helper_locations[0].longitude,
          zipCode: helper.helper_locations[0].zip_code,
        } : null,
      }));
      
      return {
        helpers: formattedResults,
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Error in searchHelpers', { error });
      throw error;
    }
  }

  /**
   * Add skill to helper profile
   */
  async addHelperSkill(helperId: string, skill: Omit<HelperSkill, 'id' | 'helperId' | 'verificationStatus' | 'verificationDate'>): Promise<string> {
    this.logger.info('Adding helper skill', { helperId });
    
    try {
      const { data, error } = await this.supabase
        .from('helper_skills')
        .insert({
          helper_id: helperId,
          skill_id: skill.skillId,
          skill_name: skill.skillName,
          proficiency_level: skill.proficiencyLevel,
          years_experience: skill.yearsExperience,
          verification_status: 'unverified',
        })
        .select('id')
        .single();
      
      if (error) {
        this.logger.error('Error adding helper skill', { error });
        throw error;
      }
      
      // Emit event
      this.eventEmitter.emit('helper.skill.added', {
        helperId,
        skillId: skill.skillId,
        skillName: skill.skillName,
      });
      
      return data.id;
    } catch (error) {
      this.logger.error('Error in addHelperSkill', { error });
      throw error;
    }
  }
  
  // Additional methods for availability, skill verification, etc.
  // ...
}
```

## Job Post Service

The JobPostService manages job posts and applications in the labor marketplace.

```typescript
// Types for the Job Post Service
export interface JobPostCreateInput {
  creatorId: string;
  creatorType: 'homeowner' | 'contractor';
  projectId?: string;
  title: string;
  description: string;
  jobType: 'one_time' | 'recurring' | 'multi_day' | 'project_based';
  payType: 'hourly' | 'fixed' | 'daily';
  payRate: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
  };
  requiredSkills: {
    skillId: string;
    skillName: string;
    importance: 'required' | 'preferred';
  }[];
  startDate: string;
  endDate?: string;
  requiredVerificationLevel: 'basic' | 'identity_verified' | 'background_checked' | 'fully_verified';
  isTeamJob?: boolean;
  maxTeamSize?: number;
}

export interface JobApplicationCreateInput {
  helperId: string;
  jobPostId: string;
  coverLetter?: string;
  proposedRate: number;
  availableStartDate: string;
  isTeamApplication?: boolean;
  teamId?: string;
}

// Job Post Service Implementation
export class JobPostService {
  private readonly supabase: SupabaseClient<Database>;
  private readonly eventEmitter: EventEmitter;
  private readonly logger: Logger;

  constructor(
    supabase: SupabaseClient<Database>,
    eventEmitter: EventEmitter,
    logger: Logger
  ) {
    this.supabase = supabase;
    this.eventEmitter = eventEmitter;
    this.logger = logger;
  }

  /**
   * Create a new job post
   */
  async createJobPost(input: JobPostCreateInput): Promise<string> {
    this.logger.info('Creating job post', { creatorId: input.creatorId });
    
    try {
      // If no lat/long provided, geocode the address
      let latitude = input.location.latitude;
      let longitude = input.location.longitude;
      
      if (!latitude || !longitude) {
        const geocoded = await GeoUtils.geocodeAddress(
          `${input.location.address}, ${input.location.city}, ${input.location.state} ${input.location.zipCode}`
        );
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      }
      
      // Create job post
      const { data: jobPost, error: jobError } = await this.supabase
        .from('labor_job_posts')
        .insert({
          creator_id: input.creatorId,
          creator_type: input.creatorType,
          project_id: input.projectId || null,
          title: input.title,
          description: input.description,
          status: 'open',
          job_type: input.jobType,
          pay_type: input.payType,
          pay_rate: input.payRate,
          address: input.location.address,
          city: input.location.city,
          state: input.location.state,
          zip_code: input.location.zipCode,
          latitude,
          longitude,
          start_date: input.startDate,
          end_date: input.endDate || null,
          required_verification_level: input.requiredVerificationLevel,
          is_team_job: input.isTeamJob || false,
          max_team_size: input.maxTeamSize || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      
      if (jobError) {
        this.logger.error('Error creating job post', { error: jobError });
        throw jobError;
      }
      
      // Add required skills
      if (input.requiredSkills.length > 0) {
        const skillsToInsert = input.requiredSkills.map(skill => ({
          job_post_id: jobPost.id,
          skill_id: skill.skillId,
          skill_name: skill.skillName,
          importance: skill.importance,
        }));
        
        const { error: skillsError } = await this.supabase
          .from('job_required_skills')
          .insert(skillsToInsert);
        
        if (skillsError) {
          this.logger.error('Error adding job required skills', { error: skillsError });
          throw skillsError;
        }
      }
      
      // Emit event
      this.eventEmitter.emit('job.post.created', {
        jobId: jobPost.id,
        creatorId: input.creatorId,
        title: input.title,
        skills: input.requiredSkills.map(s => s.skillName),
        zipCode: input.location.zipCode,
      });
      
      return jobPost.id;
    } catch (error) {
      this.logger.error('Error in createJobPost', { error });
      throw error;
    }
  }

  /**
   * Get job post by ID
   */
  async getJobPostById(jobId: string): Promise<any> {
    this.logger.info('Getting job post', { jobId });
    
    try {
      const { data: job, error: jobError } = await this.supabase
        .from('labor_job_posts')
        .select(`
          id,
          creator_id,
          creator_type,
          project_id,
          title,
          description,
          status,
          job_type,
          pay_type,
          pay_rate,
          address,
          city,
          state,
          zip_code,
          latitude,
          longitude,
          start_date,
          end_date,
          required_verification_level,
          is_team_job,
          max_team_size,
          created_at,
          updated_at,
          job_required_skills (
            id,
            skill_id,
            skill_name,
            importance
          ),
          users (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('id', jobId)
        .single();
      
      if (jobError) {
        if (jobError.code === 'PGRST116') {
          throw new JobNotFoundError(`Job with ID ${jobId} not found`);
        }
        this.logger.error('Error getting job post', { error: jobError });
        throw jobError;
      }
      
      // Get application count
      const { count: applicationCount, error: countError } = await this.supabase
        .from('labor_job_applications')
        .select('id', { count: 'exact', head: true })
        .eq('job_post_id', jobId);
      
      if (countError) {
        this.logger.error('Error getting application count', { error: countError });
        throw countError;
      }
      
      // Format response
      return {
        id: job.id,
        creatorId: job.creator_id,
        creatorType: job.creator_type,
        creatorName: `${job.users.first_name} ${job.users.last_name}`,
        creatorAvatarUrl: job.users.avatar_url,
        projectId: job.project_id,
        title: job.title,
        description: job.description,
        status: job.status,
        jobType: job.job_type,
        payType: job.pay_type,
        payRate: job.pay_rate,
        location: {
          address: job.address,
          city: job.city,
          state: job.state,
          zipCode: job.zip_code,
          latitude: job.latitude,
          longitude: job.longitude,
        },
        startDate: job.start_date,
        endDate: job.end_date,
        requiredVerificationLevel: job.required_verification_level,
        isTeamJob: job.is_team_job,
        maxTeamSize: job.max_team_size,
        requiredSkills: job.job_required_skills.map((s: any) => ({
          id: s.id,
          skillId: s.skill_id,
          skillName: s.skill_name,
          importance: s.importance,
        })),
        applicationCount: applicationCount || 0,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      };
    } catch (error) {
      this.logger.error('Error in getJobPostById', { error });
      throw error;
    }
  }

  /**
   * Search for job posts
   */
  async searchJobPosts(params: {
    skillIds?: string[];
    skillKeywords?: string[];
    location?: {
      latitude: number;
      longitude: number;
      radius: number; // in miles
    };
    zipCode?: string;
    jobType?: 'one_time' | 'recurring' | 'multi_day' | 'project_based';
    payRateMin?: number;
    payRateMax?: number;
    startDateFrom?: string;
    startDateTo?: string;
    verificationLevel?: 'basic' | 'identity_verified' | 'background_checked' | 'fully_verified';
    isTeamJob?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'recent' | 'payRate' | 'startDate' | 'relevance';
  }): Promise<{ jobs: any[]; total: number; page: number; limit: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    
    try {
      let query = this.supabase
        .from('labor_job_posts')
        .select(`
          id,
          creator_id,
          creator_type,
          title,
          description,
          status,
          job_type,
          pay_type,
          pay
