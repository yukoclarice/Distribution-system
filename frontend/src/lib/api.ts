/**
 * API client for interacting with the backend
 */
import axios, { AxiosError, AxiosResponse } from 'axios';

// Custom interface for silent auth responses
interface CustomAuthResponse extends AxiosResponse {
  customError?: boolean;
  errorMessage?: string;
}

const API_URL = 'http://localhost:5000/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes timeout
});

// Create a silent auth client that doesn't trigger browser errors in console
// This client is identical but has custom error handling for auth endpoints
export const authClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes timeout
});

// Updated to include cache control options
export interface ApiOptions {
  bypassCache?: boolean;
  cacheControl?: string;
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = localStorage.getItem('auth_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add cache control headers if specified in options
    if (config.params && config.params._apiOptions) {
      const options = config.params._apiOptions as ApiOptions;
      delete config.params._apiOptions;
      
      if (options.bypassCache) {
        config.headers['Cache-Control'] = 'no-cache, no-store';
        config.headers['Pragma'] = 'no-cache';
      } else if (options.cacheControl) {
        config.headers['Cache-Control'] = options.cacheControl;
      }
    }
    
    console.log('API Request Config:', {
      url: config.url,
      method: config.method,
      params: config.params,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Same request interceptor for auth client
authClient.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = localStorage.getItem('auth_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for main API client
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration or auth errors
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      // We could implement automatic token refresh here
    }
    return Promise.reject(error);
  }
);

// Custom response interceptor for auth client that handles 401 differently
authClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // For auth endpoints, transform 401 errors to a custom format
    // This prevents the red error in network console
    if (error.response && error.response.status === 401) {
      // Return a resolved promise with custom error structure
      // This prevents the browser from showing a failed network request
      return Promise.resolve({
        data: null,
        status: 401,
        statusText: 'Unauthorized',
        headers: error.response.headers,
        config: error.config,
        customError: true,
        errorMessage: error.response?.data?.message || 'Invalid credentials'
      } as CustomAuthResponse);
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  name: string | null;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// UsersTbl type based on our database schema
export interface UsersTbl {
  user_id: number;
  username: string | null;
  password: string | null;
  fname: string | null;
  mname: string | null;
  lname: string | null;
  contact_no: string | null;
  user_type: string | null;
  status: string | null;
  login_ip: string | null;
  last_login: string | null;
  v_id: number | null;
  imgname: string | null;
  remember: string | null;
  login_token: string | null;
}

// Pagination interface
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error handler
const handleApiError = (error: unknown, fallbackMessage: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string }>;
    const errorMessage = axiosError.response?.data?.message || axiosError.message || fallbackMessage;
    throw new Error(errorMessage);
  }
  throw new Error(fallbackMessage);
};

// User related API calls
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await apiClient.get('/users');
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch users');
  }
};

export const getUser = async (id: number): Promise<User> => {
  try {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, `Failed to fetch user #${id}`);
  }
};

export const createUser = async (userData: { name?: string; email: string; password: string }): Promise<User> => {
  try {
    const response = await apiClient.post('/users', userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to create user');
  }
};

// UsersTbl related API calls - now using the real backend API
export const getUsersTbl = async (): Promise<UsersTbl[]> => {
  try {
    const response = await apiClient.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw handleApiError(error, 'Failed to fetch users');
  }
};

/**
 * Paginated version of getUsersTbl
 * 
 * NOTE: This function currently simulates pagination on the frontend side
 * for demonstration purposes. In a production environment, you should
 * implement actual backend pagination by:
 * 
 * 1. Modifying the backend API to accept page and limit parameters
 * 2. Updating this function to use '/users/paginated' with the parameters
 * 3. Processing the paginated response from the backend
 */
export const getUsersTblPaginated = async (
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<UsersTbl>> => {
  try {
    // Fetch all data (simulating no backend pagination)
    const response = await apiClient.get('/users');
    const allData: UsersTbl[] = response.data;
    
    // Calculate pagination values
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = allData.slice(startIndex, endIndex);
    const total = allData.length;
    const hasMore = endIndex < total;
    
    // Return paginated response
    return {
      data: paginatedData,
      total,
      page,
      limit,
      hasMore
    };
  } catch (error) {
    console.error('Error fetching paginated users:', error);
    throw handleApiError(error, 'Failed to fetch users');
  }
};

export const getUserTbl = async (id: number): Promise<UsersTbl> => {
  try {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user #${id}:`, error);
    throw handleApiError(error, `Failed to fetch user #${id}`);
  }
};

export const createUserTbl = async (userData: {
  username: string;
  password?: string;
  fname?: string;
  mname?: string;
  lname?: string;
  contact_no?: string;
  user_type?: string;
  status?: string;
}): Promise<UsersTbl> => {
  try {
    const response = await apiClient.post('/users', userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to create user');
  }
};

export const updateUserTbl = async (
  id: number,
  userData: {
    username?: string;
    password?: string;
    fname?: string;
    mname?: string;
    lname?: string;
    contact_no?: string;
    user_type?: string;
    status?: string;
  }
): Promise<UsersTbl> => {
  try {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, `Failed to update user #${id}`);
  }
};

export const deleteUserTbl = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/users/${id}`);
  } catch (error) {
    throw handleApiError(error, `Failed to delete user #${id}`);
  }
};

// Ward Leader interface
export interface WardLeader {
  v_id: number;
  full_name: string;
  barangay: string;
  municipality: string;
  household_count: number;
  is_printed: number;
  is_Received: number;
}

// Ward Leaders pagination
export interface WardLeadersFilterOptions {
  municipalities: { municipality: string }[];
  barangays: { barangay: string; municipality: string }[];
  puroks: { purok_st: string; barangay: string; municipality: string }[];
}

// Households pagination and filtering
export interface HouseholdsFilterOptions {
  municipalities: { municipality: string }[];
  barangays: { barangay: string; municipality: string }[];
  puroks: { purok_st: string; barangay: string; municipality: string }[];
}

export interface WardLeadersResponse {
  data: WardLeader[];
  filterOptions: WardLeadersFilterOptions;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface HouseholdsResponse {
  households: HouseholdHead[];
  filterOptions: HouseholdsFilterOptions;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Household Head interface
export interface HouseholdHead {
  household_id: number;
  household_head_name: string;
  barangay: string; // Barangay name from the database
  location?: string; // Keep for backward compatibility
  municipality: string;
  street_address: string;
  household_members_count: number;
  leader_name: string;
  registration_date: string;
  is_printed: number;
  is_Received: number;
}

// Household Member interface
export interface HouseholdMember {
  member_record_id: number;
  household_head_id: number;
  household_head_name: string;
  member_id: number;
  member_name: string;
  gender: string;
  birthdate: string;
  age: number;
  precinct_no: string;
  barangay: string;
  municipality: string;
  street_address: string;
  registration_date: string;
  is_printed: number;
  household_role: 'Head of Household' | 'Member';
}

/**
 * Fetches ward leaders data with pagination and filtering
 * 
 * This function implements pagination on the frontend side
 * by fetching all data and slicing it to the requested page.
 * 
 * In a production environment, you would modify the backend API
 * to support actual server-side pagination.
 */
export const getWardLeadersPaginated = async (
  page: number = 1,
  limit: number = 10,
  filters: {
    municipality?: string;
    barangay?: string;
    name?: string;
  } = {},
  options: ApiOptions = {}
): Promise<WardLeadersResponse> => {
  try {
    const params: Record<string, any> = {
      page,
      limit,
      ...filters,
    };
    
    // Add API options for cache control
    if (options.bypassCache || options.cacheControl) {
      params._apiOptions = options;
    }
    
    const response = await apiClient.get('/reports/ward-leaders', { params });
    
    // Process response
    const { data, total, page: currentPage, limit: pageSize, totalPages } = response.data;
    
    return {
      data,
      filterOptions: response.data.filterOptions,
      total,
      page: currentPage,
      limit: pageSize,
      hasMore: currentPage < totalPages
    };
  } catch (error) {
    console.error('Error fetching ward leaders:', error);
    throw handleApiError(error, 'Failed to fetch ward leaders');
  }
};

// Function to get household heads for a ward leader
export const getHouseholdHeads = async (
  leaderId: number,
  options: ApiOptions = {}
): Promise<HouseholdHead[]> => {
  try {
    const params: Record<string, any> = {};
    
    // Add API options for cache control
    if (options.bypassCache || options.cacheControl) {
      params._apiOptions = options;
    }
    
    const response = await apiClient.get(`/reports/ward-leaders/${leaderId}/households`, { params });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching households for leader ${leaderId}:`, error);
    throw handleApiError(error, 'Failed to fetch household heads');
  }
};

// Function to get household members for a household head
export const getHouseholdMembers = async (
  householdHeadId: number,
  options: ApiOptions = {}
): Promise<HouseholdMember[]> => {
  try {
    const params: Record<string, any> = {};
    
    // Add API options for cache control
    if (options.bypassCache || options.cacheControl) {
      params._apiOptions = options;
    }
    
    const response = await apiClient.get(`/reports/households/${householdHeadId}/members`, { params });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching members for household ${householdHeadId}:`, error);
    throw handleApiError(error, 'Failed to fetch household members');
  }
};

// Function to get a specific ward leader by ID
export const getWardLeaderById = async (
  leaderId: number,
  options: ApiOptions = {}
): Promise<WardLeader> => {
  try {
    const params: Record<string, any> = {};
    
    // Add API options for cache control
    if (options.bypassCache || options.cacheControl) {
      params._apiOptions = options;
    }
    
    const response = await apiClient.get(`/reports/ward-leaders/leader/${leaderId}`, { params });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching ward leader ${leaderId}:`, error);
    throw handleApiError(error, 'Failed to fetch ward leader details');
  }
};

// Function to get all households with pagination and filtering
export const getHouseholdsPaginated = async (
  page = 1,
  limit = 10,
  municipality = 'all',
  barangay = 'all',
  name = '',
  options?: ApiOptions
): Promise<HouseholdsResponse> => {
  try {
    const params: any = {
      page,
      limit,
      municipality: municipality === 'all' ? '' : municipality,
      barangay: barangay === 'all' ? '' : barangay,
      name
    };
    
    if (options) {
      params._apiOptions = options;
    }
    
    const response = await apiClient.get('/reports/households', { params });
    return {
      households: response.data.data,
      meta: response.data.meta,
      filterOptions: response.data.filterOptions
    };
  } catch (error) {
    console.error('Error fetching households:', error);
    throw handleApiError(error, 'Failed to fetch households');
  }
};

// Update a ward leader's print status
export const updateLeaderPrintStatus = async (
  leaderId: number,
  isPrinted: boolean | number
): Promise<WardLeader> => {
  try {
    // Convert the value to a number (0 or 1) if it's a boolean
    const printedValue = typeof isPrinted === 'boolean' ? (isPrinted ? 1 : 0) : (isPrinted === 1 ? 1 : 0);
    
    const response = await apiClient.put(`/reports/ward-leaders/${leaderId}/print-status`, {
      is_printed: printedValue
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error updating print status for leader ${leaderId}:`, error);
    throw handleApiError(error, 'Failed to update leader print status');
  }
};

/**
 * PrintHouseholdData interface - data structure for household printing
 */
export interface PrintHouseholdData {
  householdId: number;
  householdNumber: string;
  wardLeader: string;
  // Members includes both the head and regular members
  members: {
    name: string;
    position: string;
    remarks: string;
    municipality?: string;
    barangay?: string;
    street_address?: string;
  }[];
  receivedBy: {
    name: string;
    signature: string;
    position: string;
    timeSigned: string;
  };
  is_printed?: number;
  is_Received?: number;
}

/**
 * PrintWardLeaderData interface - data structure for ward leader printing
 */
export interface PrintWardLeaderData {
  leaderId: number;
  wardLeaderNumber: string;
  v_id: number;
  name: string;
  precinct: string;
  barangay: string;
  municipality: string;
  gender: string;
  birthday: string;
  electionYear: string | number;
  votingPreference?: {
    name: string;
    position: string;
    remarks: string;
  };
  politicsData?: {
    congressman?: number;
    governor?: number;
    vicegov?: number;
    supportedCandidates?: string;
    isUndecided?: boolean;
  };
  receivedBy: {
    name: string;
    signature: string;
    position: string;
    timeSigned: string;
  };
}

/**
 * Fetches household data for printing based on filters
 * 
 * This function will:
 * 1. Fetch ward leaders based on the provided filters
 * 2. For each ward leader, fetch their households
 * 3. For each household, fetch the members
 * 4. Format the data for printing
 */
export const getHouseholdDataForPrinting = async (
  filters: {
    municipality?: string;
    barangay?: string;
    limit?: number;
  } = {},
  options: ApiOptions = {}
): Promise<PrintHouseholdData[]> => {
  try {
    // Default limit to 50 if not provided
    const limit = filters.limit || 50;
    
    // Step 1: Fetch ward leaders based on filters
    const wardLeadersResponse = await getWardLeadersPaginated(
      1, // Start with page 1
      100, // Get a reasonable number of ward leaders
      {
        municipality: filters.municipality === 'all' ? undefined : filters.municipality,
        barangay: filters.barangay === 'all' ? undefined : filters.barangay
      },
      options
    );
    
    const wardLeaders = wardLeadersResponse.data;
    
    // If no ward leaders found, return empty array
    if (!wardLeaders.length) {
      return [];
    }
    
    // Step 2: Collect household data for each ward leader
    let householdData: PrintHouseholdData[] = [];
    let totalHouseholds = 0;
    
    // Process each ward leader sequentially
    for (const leader of wardLeaders) {
      // Skip if we've reached the limit
      if (totalHouseholds >= limit) break;
      
      // Fetch households for this leader
      const households = await getHouseholdHeads(leader.v_id, options);
      
      // For each household, get members and format for printing
      for (const household of households) {
        // Skip if we've reached the limit
        if (totalHouseholds >= limit) break;
        
        // Fetch members for this household
        const members = await getHouseholdMembers(household.household_id, options);
        
        // Check if the household head is included in the members list
        const hasHeadInMembers = members.some(m => m.household_role === 'Head of Household');
        
        // Create an array that will definitely include the head
        let allMembers = [...members];
        
        // If head is not in members list, create a head entry from household data
        if (!hasHeadInMembers) {
          console.log(`Household ${household.household_id}: Head not found in members, adding from household data`);
          
          // Create a household head member entry
          const headMember: HouseholdMember = {
            member_record_id: 0, // Use 0 as a placeholder ID
            household_head_id: parseInt(household.household_id.toString()),
            household_head_name: household.household_head_name,
            member_id: 0, // Placeholder
            member_name: household.household_head_name,
            gender: 'Unknown', // Default values since we don't have this info
            birthdate: '',
            age: 0,
            precinct_no: '',
            barangay: household.barangay || household.location || '',
            municipality: household.municipality,
            street_address: household.street_address || '',
            registration_date: household.registration_date,
            is_printed: household.is_printed,
            household_role: 'Head of Household'
          };
          
          // Add the head to the members list
          allMembers.push(headMember);
        }
        
        // Sort members to ensure the head is always first in the list
        const sortedMembers = allMembers.sort((a, b) => {
          if (a.household_role === 'Head of Household' && b.household_role !== 'Head of Household') return -1;
          if (a.household_role !== 'Head of Household' && b.household_role === 'Head of Household') return 1;
          return a.member_name.localeCompare(b.member_name);
        });
        
        // Debug log to verify data
        console.log(`Household ${household.household_id} members (${sortedMembers.length}):`, 
          sortedMembers.map(m => `${m.member_name} (${m.household_role})`));
        
        // Format household for printing with members array
        const printHousehold: PrintHouseholdData = {
          householdId: household.household_id,
          householdNumber: household.household_id.toString().padStart(3, '0'),
          wardLeader: leader.full_name || 'UNASSIGNED',
          // Map all members, but highlight the head
          members: sortedMembers.map(member => ({
            // Format name in uppercase without redundant head label
            name: member.member_name.toUpperCase(),
            // Position depends on role
            position: member.household_role === 'Head of Household' ? 'HH Head' : 'Member',
            remarks: 'STRAIGHT',
            municipality: member.municipality,
            barangay: member.barangay,
            street_address: member.street_address
          })),
          receivedBy: {
            name: '',
            signature: '',
            position: '',
            timeSigned: ''
          },
          is_printed: household.is_printed,
          is_Received: household.is_Received
        };
        
        // If there are no regular members (only the head), add a "No household members" row
        if (sortedMembers.length === 1 && sortedMembers[0].household_role === 'Head of Household') {
          printHousehold.members.push({
            name: 'NO HOUSEHOLD MEMBERS',
            position: '-',
            remarks: '-',
            municipality: '',
            barangay: '',
            street_address: ''
          });
        }
        
        // Add receivedBy information
        printHousehold.receivedBy = {
          name: '',
          signature: '',
          position: '',
          timeSigned: ''
        };
        
        householdData.push(printHousehold);
        totalHouseholds++;
      }
    }
    
    return householdData;
  } catch (error) {
    console.error('Error fetching household data for printing:', error);
    throw handleApiError(error, 'Failed to fetch household data for printing');
  }
};

/**
 * Fetches household data for printing based on filters using a dedicated printing endpoint
 */
export const getHouseholdDataForPrintingDirect = async (
  filters: {
    municipality?: string;
    barangay?: string;
    purok_st?: string;
    limit?: number;
    sortBy?: string;
  } = {},
  options: ApiOptions = {}
): Promise<PrintHouseholdData[]> => {
  try {
    // Convert 'all' values to undefined
    const cleanedFilters = {
      ...filters,
      municipality: filters.municipality === 'all' ? undefined : filters.municipality,
      barangay: filters.barangay === 'all' ? undefined : filters.barangay,
      purok_st: filters.purok_st === 'all' ? undefined : filters.purok_st,
    };

    const params = {
      ...cleanedFilters,
      _apiOptions: options
    };
    

    
    const response = await apiClient.get('/reports/printing/households', {
      params
    });
    

    
    // Check if response.data exists and has the expected structure
    if (!response.data || typeof response.data !== 'object') {
      console.error('Invalid response format. Expected object but got:', typeof response.data);
      throw new Error('Invalid response format from server');
    }

    // The response should have a data property containing the array
    if (!response.data.data || !Array.isArray(response.data.data)) {
      console.error('Invalid response format. Expected data.data to be an array but got:', typeof response.data.data);
      throw new Error('Invalid response format from server');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching household data for printing:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
          headers: error.config?.headers
        }
      });
    }
    throw handleApiError(error, 'Failed to fetch household data for printing');
  }
};

/**
 * Fetches ward leader data for printing based on filters
 */
export const getWardLeaderDataForPrinting = async (
  filters: {
    municipality?: string;
    barangay?: string;
    purok_st?: string;
    limit?: number;
  } = {},
  options: ApiOptions = {}
): Promise<PrintWardLeaderData[]> => {
  try {
    const params: Record<string, any> = {
      ...filters,
      limit: filters.limit || 50
    };
    
    // Convert 'all' values to undefined
    if (params.municipality === 'all') params.municipality = undefined;
    if (params.barangay === 'all') params.barangay = undefined;
    if (params.purok_st === 'all') params.purok_st = undefined;
    
    // Add API options for cache control
    if (options.bypassCache || options.cacheControl) {
      params._apiOptions = options;
    }
    
    const response = await apiClient.get('/reports/printing/ward-leaders', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching ward leader printing data:', error);
    throw handleApiError(error, 'Failed to fetch ward leader data for printing');
  }
};

/**
 * Marks a batch of households as printed in the database
 */
export const markHouseholdsAsPrinted = async (householdIds: number[]): Promise<{ updatedCount: number }> => {
  try {
    const response = await apiClient.post('/reports/printing/households/mark-printed', {
      householdIds
    });
    return response.data.data;
  } catch (error) {
    console.error('Error marking households as printed:', error);
    throw handleApiError(error, 'Failed to mark households as printed');
  }
};

/**
 * Marks a batch of ward leaders as printed in the database
 */
export const markWardLeadersAsPrinted = async (leaderIds: number[]): Promise<{ updatedCount: number }> => {
  try {
    const response = await apiClient.post('/reports/printing/ward-leaders/mark-printed', {
      leaderIds
    });
    return response.data.data;
  } catch (error) {
    console.error('Error marking ward leaders as printed:', error);
    throw handleApiError(error, 'Failed to mark ward leaders as printed');
  }
};

/**
 * Fetches barangay coordinator data for printing based on filters
 */
export const getBarangayCoordinatorDataForPrinting = async (
  filters: {
    municipality?: string;
    barangay?: string;
    purok_st?: string;
    limit?: number;
  } = {},
  options: ApiOptions = {}
): Promise<PrintWardLeaderData[]> => {
  try {
    const params: Record<string, any> = {
      ...filters,
      limit: filters.limit || 50
    };
    
    // Convert 'all' values to undefined
    if (params.municipality === 'all') params.municipality = undefined;
    if (params.barangay === 'all') params.barangay = undefined;
    if (params.purok_st === 'all') params.purok_st = undefined;
    
    // Add API options for cache control
    if (options.bypassCache || options.cacheControl) {
      params._apiOptions = options;
    }
    
    const response = await apiClient.get('/reports/printing/barangay-coordinators', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching barangay coordinator printing data:', error);
    throw handleApiError(error, 'Failed to fetch barangay coordinator data for printing');
  }
};

/**
 * Marks a batch of barangay coordinators as printed in the database
 */
export const markBarangayCoordinatorsAsPrinted = async (leaderIds: number[]): Promise<{ updatedCount: number }> => {
  try {
    const response = await apiClient.post('/reports/printing/barangay-coordinators/mark-printed', {
      leaderIds
    });
    return response.data.data;
  } catch (error) {
    console.error('Error marking barangay coordinators as printed:', error);
    throw handleApiError(error, 'Failed to mark barangay coordinators as printed');
  }
};

/**
 * PrintStatistics interface - data structure for print statistics
 */
export interface PrintStatistics {
  households: {
    printed: number;
    not_printed: number;
    total: number;
  };
  wardLeaders: {
    printed: number;
    not_printed: number;
    total: number;
  };
  coordinators: {
    printed: number;
    not_printed: number;
    total: number;
  };
}

/**
 * Interface for Ward Leaders statistics
 */
export interface WardLeadersStatistics {
  printed: number;
  not_printed: number;
  total: number;
}

/**
 * Fetches Ward Leaders statistics for pie chart
 */
export const getWardLeadersStatistics = async (
  filters: {
    municipality?: string;
    barangay?: string;
  } = {},
  options: ApiOptions = {}
): Promise<WardLeadersStatistics> => {
  try {
    // Add cache control options if specified
    const params = {
      ...filters,
      _apiOptions: options
    };
    
    const response = await apiClient.get('/reports/ward-leaders-statistics', { params });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch ward leaders statistics');
  }
};

/**
 * Interface for barangay-level print statistics
 */
export interface BarangayPrintStatistics {
  barangay: string;
  households: {
    printed: number;
    not_printed: number;
    total: number;
    percentage: number;
  };
  wardLeaders: {
    printed: number;
    not_printed: number;
    total: number;
    percentage: number;
  };
  coordinators: {
    printed: number;
    not_printed: number;
    total: number;
    percentage: number;
  };
}

/**
 * Fetches print statistics by barangay for all print types
 */
export const getPrintStatisticsByBarangay = async (
  filters: {
    municipality?: string;
  } = {},
  options: ApiOptions = {}
): Promise<BarangayPrintStatistics[]> => {
  try {
    // Add API options to params if provided
    const params = {
      ...filters,
      _apiOptions: options
    };
    
    const response = await apiClient.get('/reports/print-statistics-by-barangay', { params });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch print statistics by barangay');
  }
};

/**
 * Fetches print statistics for households, ward leaders, and coordinators
 */
export const getPrintStatistics = async (
  filters: {
    municipality?: string;
    barangay?: string;
  } = {},
  options: ApiOptions = {}
): Promise<PrintStatistics> => {
  try {
    // Add API options to params if provided
    const params = {
      ...filters,
      _apiOptions: options
    };
    
    const response = await apiClient.get('/reports/print-statistics', { params });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch print statistics');
  }
};