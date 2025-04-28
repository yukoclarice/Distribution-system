import { Request, Response } from 'express';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';
import redisService from '../services/redisService';

// Utility function to invalidate ward leaders cache
export const invalidateWardLeadersCache = async () => {
  await redisService.deleteByPattern('reports:ward-leaders:*');
};

// Utility function to invalidate specific ward leader cache
export const invalidateWardLeaderCache = async (leaderId: string | number) => {
  await redisService.delete(`reports:leader:${leaderId}`);
  await redisService.deleteByPattern(`reports:leader:households:*${leaderId}*`);
};

// Utility function to invalidate specific household cache
export const invalidateHouseholdCache = async (householdId: string | number) => {
  await redisService.deleteByPattern(`reports:household:members:*${householdId}*`);
};

// Utility function to invalidate all report caches
export const invalidateAllReportCaches = async () => {
  await redisService.deleteByPattern('reports:*');
};

export const getWardLeadersReport = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters from the request query
    const { municipality, barangay, name, page = '1', limit = '10' } = req.query;
    
    // Parse pagination parameters
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageSize;
    
    // Build WHERE clauses based on filters
    let whereClause = "l.type = 1 AND hh.leader_v_id IS NOT NULL AND l.electionyear = 2025";
    
    if (municipality) {
      whereClause += ` AND b.municipality LIKE '%${municipality}%'`;
    }
    
    if (barangay) {
      whereClause += ` AND b.barangay LIKE '%${barangay}%'`;
    }
    
    if (name) {
      whereClause += ` AND (
        v.v_fname LIKE '%${name}%' OR 
        v.v_mname LIKE '%${name}%' OR 
        v.v_lname LIKE '%${name}%' OR
        CONCAT(v.v_fname, ' ', v.v_mname, ' ', v.v_lname) LIKE '%${name}%'
      )`;
    }
    
    // Get total count for pagination - using latest entry based on dateadded
    const totalCountResult = await sequelize.query(
      `SELECT COUNT(DISTINCT v.v_id) AS total
       FROM head_household hh
       JOIN leaders l ON hh.leader_v_id = l.v_id
       JOIN v_info v ON l.v_id = v.v_id
       LEFT JOIN barangays b ON v.barangayId = b.id
       INNER JOIN (
         SELECT v_id, MAX(dateadded) as latest_date
         FROM leaders
         WHERE type = 1
         GROUP BY v_id
       ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
       WHERE ${whereClause}`,
      { type: QueryTypes.SELECT }
    );
    
    const total = (totalCountResult[0] as any).total;
    
    // Execute the ward leaders query with filters and pagination - using latest entry based on dateadded
    const wardLeaders = await sequelize.query(
      `SELECT 
        v.v_id,
        CONCAT(
          IFNULL(v.v_fname, ''), ' ',
          IFNULL(v.v_mname, ''), ' ',
          IFNULL(v.v_lname, '')
        ) AS full_name,
        b.barangay,
        b.municipality,
        COUNT(DISTINCT hh.id) AS household_count,
        l.is_printed
      FROM 
        head_household hh
      JOIN 
        leaders l ON hh.leader_v_id = l.v_id
      JOIN 
        v_info v ON l.v_id = v.v_id
      LEFT JOIN
        barangays b ON v.barangayId = b.id
      INNER JOIN (
        SELECT v_id, MAX(dateadded) as latest_date
        FROM leaders
        WHERE type = 1
        GROUP BY v_id
      ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
      WHERE 
        ${whereClause}
      GROUP BY 
        v.v_id, v.v_fname, v.v_mname, v.v_lname, b.barangay, b.municipality, l.is_printed
      ORDER BY 
        b.municipality, b.barangay, v.v_lname, v.v_fname
      LIMIT ${pageSize} OFFSET ${offset}`,
      { 
        type: QueryTypes.SELECT 
      }
    );
    
    // Get the list of all municipalities and barangays for filters
    const municipalities = await sequelize.query(
      `SELECT DISTINCT municipality FROM barangays ORDER BY municipality`,
      { type: QueryTypes.SELECT }
    );
    
    const barangays = await sequelize.query(
      `SELECT DISTINCT barangay, municipality FROM barangays ORDER BY municipality, barangay`,
      { type: QueryTypes.SELECT }
    );
    
    // Get the list of all puroks for filtering
    const puroks = await sequelize.query(
      `SELECT DISTINCT hh.purok_st, b.barangay, b.municipality 
       FROM head_household hh
       JOIN v_info v ON hh.fh_v_id = v.v_id
       JOIN barangays b ON v.barangayId = b.id
       WHERE hh.purok_st IS NOT NULL AND TRIM(hh.purok_st) != ''
       ORDER BY b.municipality, b.barangay, hh.purok_st`,
      { type: QueryTypes.SELECT }
    );
    
    // Return the data along with filter options and pagination info
    res.json({
      status: 'success',
      data: wardLeaders,
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
      filterOptions: {
        municipalities,
        barangays,
        puroks
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching ward leaders report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ward leaders report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getHouseholdHeads = async (req: Request, res: Response) => {
  try {
    const { leaderId } = req.params;
    
    if (!leaderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Leader ID is required'
      });
    }
    
    // Execute the query to get all household heads managed by this ward leader
    const householdHeads = await sequelize.query(
      `SELECT DISTINCT
        hh.id AS household_id,
        CONCAT(
          IFNULL(hh_head.v_fname, ''), ' ',
          IFNULL(hh_head.v_mname, ''), ' ',
          IFNULL(hh_head.v_lname, '')
        ) AS household_head_name,
        b.barangay AS location,
        b.municipality,
        hh.purok_st AS street_address,
        (
          SELECT COUNT(*) 
          FROM household_warding hw 
          WHERE hw.fh_v_id = hh.fh_v_id
        ) AS household_members_count,
        CONCAT(
          IFNULL(leader.v_fname, ''), ' ',
          IFNULL(leader.v_mname, ''), ' ',
          IFNULL(leader.v_lname, '')
        ) AS leader_name,
        hh.date_saved AS registration_date,
        hh.is_printed
      FROM 
        head_household hh
      LEFT JOIN 
        v_info hh_head ON hh.fh_v_id = hh_head.v_id
      LEFT JOIN 
        leaders l ON hh.leader_v_id = l.v_id
      LEFT JOIN 
        v_info leader ON l.v_id = leader.v_id
      LEFT JOIN 
        barangays b ON hh_head.barangayId = b.id
      WHERE 
        hh.leader_v_id = ?
        AND l.type = 1
        AND hh.leader_v_id IS NOT NULL
      GROUP BY
        hh.id
      ORDER BY 
        b.municipality,
        b.barangay,
        household_head_name`,
      {
        replacements: [leaderId],
        type: QueryTypes.SELECT
      }
    );
    
    // Return the data
    res.json({
      status: 'success',
      data: householdHeads
    });
    
  } catch (error: any) {
    console.error('Error fetching household heads:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch household heads',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getHouseholdMembers = async (req: Request, res: Response) => {
  try {
    const { householdHeadId } = req.params;
    
    if (!householdHeadId) {
      return res.status(400).json({
        status: 'error',
        message: 'Household head ID is required'
      });
    }
    
    // First, get the fh_v_id from the household_id
    const household = await sequelize.query(
      `SELECT fh_v_id FROM head_household WHERE id = ?`,
      {
        replacements: [householdHeadId],
        type: QueryTypes.SELECT
      }
    );
    
    if (!household || !household.length) {
      return res.json({
        status: 'success',
        data: []
      });
    }
    
    const fhVId = (household[0] as any).fh_v_id;
    
    // Execute the query to get all members of this household using fh_v_id
    const householdMembers = await sequelize.query(
      `SELECT 
        hw.id AS member_record_id,
        hw.fh_v_id AS household_head_id,
        CONCAT(
          IFNULL(head.v_fname, ''), ' ',
          IFNULL(head.v_mname, ''), ' ',
          IFNULL(head.v_lname, '')
        ) AS household_head_name,
        hw.mem_v_id AS member_id,
        CONCAT(
          IFNULL(member.v_fname, ''), ' ',
          IFNULL(member.v_mname, ''), ' ',
          IFNULL(member.v_lname, '')
        ) AS member_name,
        member.v_gender AS gender,
        member.v_birthday AS birthdate,
        TIMESTAMPDIFF(YEAR, member.v_birthday, CURDATE()) AS age,
        member.v_precinct_no AS precinct_no,
        b.barangay,
        b.municipality,
        head_hh.purok_st AS street_address,
        head_hh.date_saved AS registration_date,
        head_hh.is_printed AS is_printed,
        CASE 
          WHEN hw.fh_v_id = hw.mem_v_id THEN 'Head of Household'
          ELSE 'Member'
        END AS household_role
      FROM 
        household_warding hw
      JOIN 
        v_info member ON hw.mem_v_id = member.v_id
      JOIN 
        v_info head ON hw.fh_v_id = head.v_id
      LEFT JOIN 
        barangays b ON member.barangayId = b.id
      LEFT JOIN 
        head_household head_hh ON hw.fh_v_id = head_hh.fh_v_id
      WHERE 
        hw.fh_v_id = ?
      ORDER BY 
        household_role DESC,
        member_name`,
      {
        replacements: [fhVId],
        type: QueryTypes.SELECT
      }
    );
    
    // Return the data
    res.json({
      status: 'success',
      data: householdMembers
    });
    
  } catch (error: any) {
    console.error('Error fetching household members:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch household members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getWardLeaderById = async (req: Request, res: Response) => {
  try {
    const { leaderId } = req.params;
    
    if (!leaderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Leader ID is required'
      });
    }
    
    // Execute the query to get the specific ward leader by ID
    const wardLeader = await sequelize.query(
      `SELECT 
        v.v_id,
        CONCAT(
          IFNULL(v.v_fname, ''), ' ',
          IFNULL(v.v_mname, ''), ' ',
          IFNULL(v.v_lname, '')
        ) AS full_name,
        b.barangay,
        b.municipality,
        COUNT(DISTINCT hh.id) AS household_count,
        l.is_printed
      FROM 
        leaders l
      JOIN 
        v_info v ON l.v_id = v.v_id
      LEFT JOIN
        barangays b ON v.barangayId = b.id
      LEFT JOIN 
        head_household hh ON hh.leader_v_id = l.v_id
      WHERE 
        l.v_id = ?
        AND l.type = 1
      GROUP BY 
        v.v_id, v.v_fname, v.v_mname, v.v_lname, b.barangay, b.municipality, l.is_printed`,
      {
        replacements: [leaderId],
        type: QueryTypes.SELECT
      }
    );
    
    if (!wardLeader || !wardLeader.length) {
      return res.status(404).json({
        status: 'error',
        message: 'Ward leader not found'
      });
    }
    
    // Return the data
    res.json({
      status: 'success',
      data: wardLeader[0]
    });
    
  } catch (error: any) {
    console.error('Error fetching ward leader by ID:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ward leader',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateLeaderPrintStatus = async (req: Request, res: Response) => {
  try {
    const { leaderId } = req.params;
    const { is_printed } = req.body;
    
    if (!leaderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Leader ID is required'
      });
    }
    
    // Check if is_printed is a valid number (0 or 1)
    const printedValue = typeof is_printed === 'boolean' 
      ? (is_printed ? 1 : 0) // Convert boolean to number if provided as boolean
      : (is_printed === 1 ? 1 : 0); // Normalize to 0 or 1 if provided as number
    
    // Update the leader's is_printed status
    await sequelize.query(
      `UPDATE leaders SET is_printed = ? WHERE v_id = ? AND type = 1`,
      {
        replacements: [printedValue, leaderId],
        type: QueryTypes.UPDATE
      }
    );
    
    // Invalidate caches related to this leader
    await invalidateWardLeaderCache(leaderId);
    await invalidateWardLeadersCache();
    
    res.json({
      status: 'success',
      message: `Leader print status updated to ${printedValue === 1 ? 'printed' : 'not printed'}`,
      data: {
        v_id: leaderId,
        is_printed: printedValue
      }
    });
    
  } catch (error: any) {
    console.error('Error updating leader print status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update leader print status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getBarangayCoordinators = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters from the request query
    const { municipality, barangay, name, page = '1', limit = '10' } = req.query;
    
    // Parse pagination parameters
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageSize;
    
    // Build WHERE clauses based on filters
    let whereClause = "l.type = 2 AND v.record_type = 1 AND l.electionyear = 2025 AND l.status IS NULL";
    
    if (municipality) {
      whereClause += ` AND b.municipality LIKE '%${municipality}%'`;
    }
    
    if (barangay) {
      whereClause += ` AND b.barangay LIKE '%${barangay}%'`;
    }
    
    if (name) {
      whereClause += ` AND (
        v.v_fname LIKE '%${name}%' OR 
        v.v_mname LIKE '%${name}%' OR 
        v.v_lname LIKE '%${name}%' OR
        CONCAT(v.v_fname, ' ', v.v_mname, ' ', v.v_lname) LIKE '%${name}%'
      )`;
    }
    
    // Get total count for pagination
    const totalCountResult = await sequelize.query(
      `SELECT COUNT(DISTINCT l.v_id) AS total
       FROM leaders l
       JOIN v_info v ON l.v_id = v.v_id
       LEFT JOIN barangays b ON v.barangayId = b.id
       WHERE ${whereClause}`,
      { type: QueryTypes.SELECT }
    );
    
    const total = (totalCountResult[0] as any).total;
    
    // Execute the barangay coordinators query with filters and pagination
    const barangayCoordinators = await sequelize.query(
      `SELECT 
        v.v_id,
        CONCAT(
          IFNULL(v.v_fname, ''), ' ',
          IFNULL(v.v_mname, ''), ' ',
          IFNULL(v.v_lname, '')
        ) AS full_name,
        b.barangay,
        b.municipality,
        (
          SELECT COUNT(DISTINCT l2.v_id) 
          FROM leaders l2 
          WHERE l2.type = 1 AND l2.status IS NULL
          AND l2.v_id IN (
            SELECT DISTINCT v2.v_id 
            FROM v_info v2 
            WHERE v2.barangayId = v.barangayId
          )
        ) AS ward_leaders_count,
        l.is_printed
      FROM 
        leaders l
      JOIN 
        v_info v ON l.v_id = v.v_id
      LEFT JOIN
        barangays b ON v.barangayId = b.id
      WHERE 
        ${whereClause}
      GROUP BY 
        v.v_id, v.v_fname, v.v_mname, v.v_lname, b.barangay, b.municipality, l.is_printed
      ORDER BY 
        b.municipality, b.barangay, v.v_lname, v.v_fname
      LIMIT ${pageSize} OFFSET ${offset}`,
      { 
        type: QueryTypes.SELECT 
      }
    );
    
    // Return the data along with filter options and pagination info
    res.json({
      status: 'success',
      data: barangayCoordinators,
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
      filterOptions: {
        municipalities: await sequelize.query(
          `SELECT DISTINCT municipality FROM barangays ORDER BY municipality`,
          { type: QueryTypes.SELECT }
        ),
        barangays: await sequelize.query(
          `SELECT DISTINCT barangay, municipality FROM barangays ORDER BY municipality, barangay`,
          { type: QueryTypes.SELECT }
        )
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching barangay coordinators:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch barangay coordinators',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getWardLeadersByCoordinator = async (req: Request, res: Response) => {
  try {
    const { coordinatorId } = req.params;
    
    if (!coordinatorId) {
      return res.status(400).json({
        status: 'error',
        message: 'Coordinator ID is required'
      });
    }
    
    // Get the barangay of the coordinator
    const coordinator = await sequelize.query(
      `SELECT v.barangayId 
       FROM leaders l
       JOIN v_info v ON l.v_id = v.v_id
       WHERE l.v_id = ? AND l.type = 2`,
      {
        replacements: [coordinatorId],
        type: QueryTypes.SELECT
      }
    );
    
    if (!coordinator || !coordinator.length) {
      return res.status(404).json({
        status: 'error',
        message: 'Coordinator not found'
      });
    }
    
    const barangayId = (coordinator[0] as any).barangayId;
    
    // Get all ward leaders in the same barangay
    const wardLeaders = await sequelize.query(
      `SELECT 
        l.v_id,
        CONCAT(
          IFNULL(v.v_fname, ''), ' ',
          IFNULL(v.v_mname, ''), ' ',
          IFNULL(v.v_lname, '')
        ) AS name,
        CONCAT(
          IFNULL(b.barangay, ''), ', ',
          IFNULL(b.municipality, '')
        ) AS assigned_area,
        (
          SELECT COUNT(DISTINCT hh.id) 
          FROM head_household hh 
          WHERE hh.leader_v_id = l.v_id
        ) AS households_count,
        (
          SELECT COUNT(*) 
          FROM household_warding hw 
          WHERE hw.mem_v_id IN (
            SELECT hh.fh_v_id 
            FROM head_household hh 
            WHERE hh.leader_v_id = l.v_id
          )
        ) AS members_count,
        v.v_mobile_phone AS contact_number,
        IFNULL(l.dateadded, 'N/A') AS last_updated,
        l.is_printed
      FROM 
        leaders l
      JOIN 
        v_info v ON l.v_id = v.v_id
      LEFT JOIN 
        barangays b ON v.barangayId = b.id
      WHERE 
        l.type = 1
        AND v.barangayId = ?
        AND l.status IS NULL
      ORDER BY 
        v.v_lname, v.v_fname`,
      {
        replacements: [barangayId],
        type: QueryTypes.SELECT
      }
    );
    
    res.json({
      status: 'success',
      data: wardLeaders
    });
    
  } catch (error: any) {
    console.error('Error fetching ward leaders by coordinator:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ward leaders by coordinator',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Helper function to get politician data
 * Used to avoid heavy joins in the main query
 */
const getPoliticianNames = async () => {
  // Get all congressman data
  const congressmen = await sequelize.query(
    `SELECT id, CONCAT(FirstName, ' ', LastName) as full_name, LastName 
     FROM congressman`,
    { type: QueryTypes.SELECT }
  ) as Array<{ id: number; full_name: string; LastName: string }>;
  
  // Get all governor data
  const governors = await sequelize.query(
    `SELECT id, CONCAT(FirstName, ' ', LastName) as full_name, LastName 
     FROM governor`,
    { type: QueryTypes.SELECT }
  ) as Array<{ id: number; full_name: string; LastName: string }>;
  
  // Get all vice governor data
  const viceGovernors = await sequelize.query(
    `SELECT id, CONCAT(FirstName, ' ', LastName) as full_name, LastName 
     FROM vice_governor`,
    { type: QueryTypes.SELECT }
  ) as Array<{ id: number; full_name: string; LastName: string }>;
  
  // Get all mayor data
  const mayors = await sequelize.query(
    `SELECT id, CONCAT(FirstName, ' ', LastName) as full_name, LastName 
     FROM mayor`,
    { type: QueryTypes.SELECT }
  ) as Array<{ id: number; full_name: string; LastName: string }>;
  
  // Convert arrays to maps for faster lookups
  const congressmanMap = new Map(congressmen.map(item => [item.id, item]));
  const governorMap = new Map(governors.map(item => [item.id, item]));
  const viceGovernorMap = new Map(viceGovernors.map(item => [item.id, item]));
  const mayorMap = new Map(mayors.map(item => [item.id, item]));
  
  return {
    congressmanMap,
    governorMap,
    viceGovernorMap,
    mayorMap
  };
};

/**
 * Get households data specifically for printing purposes
 * This endpoint is optimized for printing functionality and returns data in a format
 * suitable for the print template
 */
export const getHouseholdsForPrinting = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters from the request query
    const { municipality, barangay, purok_st, limit = '50' } = req.query;
    
    // Parse limit parameter
    const printLimit = parseInt(limit as string, 10);
    
    // Build WHERE clauses based on filters for ward leaders
    let leaderWhereClause = "l.type = 1 AND hh.leader_v_id IS NOT NULL";
    
    if (municipality) {
      leaderWhereClause += ` AND b.municipality LIKE '%${municipality}%'`;
    }
    
    if (barangay) {
      leaderWhereClause += ` AND b.barangay LIKE '%${barangay}%'`;
    }
    
    // Get politician data for faster lookups
    const { congressmanMap, governorMap, viceGovernorMap, mayorMap } = await getPoliticianNames();
    
    // Get ward leaders based on filters
    const wardLeaders = await sequelize.query(
      `SELECT 
        v.v_id,
        CONCAT(
          IFNULL(v.v_fname, ''), ' ',
          IFNULL(v.v_mname, ''), ' ',
          IFNULL(v.v_lname, '')
        ) AS full_name,
        b.barangay,
        b.municipality
      FROM 
        leaders l
      JOIN 
        v_info v ON l.v_id = v.v_id
      LEFT JOIN
        barangays b ON v.barangayId = b.id
      LEFT JOIN
        head_household hh ON hh.leader_v_id = l.v_id
      WHERE 
        ${leaderWhereClause}
      GROUP BY 
        v.v_id, v.v_fname, v.v_mname, v.v_lname, b.barangay, b.municipality
      ORDER BY 
        b.municipality, b.barangay, v.v_lname, v.v_fname
      LIMIT 100`,
      { type: QueryTypes.SELECT }
    ) as Array<{
      v_id: number;
      full_name: string;
      barangay: string;
      municipality: string;
    }>;
    
    // If no ward leaders found, return empty array
    if (!wardLeaders.length) {
      return res.json({
        status: 'success',
        data: []
      });
    }
    
    // Prepare result array for all households
    const result = [];
    let totalHouseholds = 0;
    
    // Process each ward leader sequentially
    for (const leader of wardLeaders) {
      // Skip if we've reached the limit
      if (totalHouseholds >= printLimit) break;
      
      // Add purok_st filter condition
      let householdWhereClause = `hh.leader_v_id = ? AND hh.is_printed = 0`;
      
      if (purok_st) {
        householdWhereClause += ` AND hh.purok_st = '${purok_st}'`;
      }
      
      // Get households for this leader with purok_st filter if provided
      const households = await sequelize.query(
        `SELECT DISTINCT
          hh.id AS household_id,
          CONCAT(
            IFNULL(hh_head.v_fname, ''), ' ',
            IFNULL(hh_head.v_mname, ''), ' ',
            IFNULL(hh_head.v_lname, '')
          ) AS household_head_name,
          b.barangay AS location,
          b.municipality,
          hh.purok_st AS street_address,
          (
            SELECT COUNT(*) 
            FROM household_warding hw 
            WHERE hw.fh_v_id = hh.fh_v_id
          ) AS household_members_count,
          hh.date_saved AS registration_date,
          hh.is_printed
        FROM 
          head_household hh
        LEFT JOIN 
          v_info hh_head ON hh.fh_v_id = hh_head.v_id
        LEFT JOIN 
          barangays b ON hh_head.barangayId = b.id
        WHERE 
          ${householdWhereClause}
        GROUP BY
          hh.id
        ORDER BY 
          b.municipality,
          b.barangay,
          household_head_name`,
        {
          replacements: [leader.v_id],
          type: QueryTypes.SELECT
        }
      ) as Array<{
        household_id: number;
        household_head_name: string;
        location: string;
        municipality: string;
        street_address: string;
        household_members_count: number;
        registration_date: string;
        is_printed: number;
      }>;
      
      // For each household, process members
      for (const household of households) {
        // Skip if we've reached the limit
        if (totalHouseholds >= printLimit) break;
        
        // Get the fh_v_id (family head voter ID) for this household
        // This is crucial for correctly fetching members
        const householdHead = await sequelize.query(
          `SELECT fh_v_id FROM head_household WHERE id = ?`,
          {
            replacements: [household.household_id],
            type: QueryTypes.SELECT
          }
        );
        
        if (!householdHead || !householdHead.length) {
          console.error(`No household head found for household ID ${household.household_id}`);
          continue; // Skip this household if we can't find the head
        }
        
        const fhVId = (householdHead[0] as any).fh_v_id;
        
        // Now use the fh_v_id to get members for this household
        const members = await sequelize.query(
          `SELECT 
            hw.id AS member_record_id,
            hw.fh_v_id AS household_head_id,
            CONCAT(
              IFNULL(head.v_fname, ''), ' ',
              IFNULL(head.v_mname, ''), ' ',
              IFNULL(head.v_lname, '')
            ) AS household_head_name,
            hw.mem_v_id AS member_id,
            CONCAT(
              IFNULL(member.v_fname, ''), ' ',
              IFNULL(member.v_mname, ''), ' ',
              IFNULL(member.v_lname, '')
            ) AS member_name,
            member.v_gender AS gender,
            member.v_birthday AS birthdate,
            TIMESTAMPDIFF(YEAR, member.v_birthday, CURDATE()) AS age,
            member.v_precinct_no AS precinct_no,
            b.barangay,
            b.municipality,
            head_hh.purok_st AS street_address,
            head_hh.date_saved AS registration_date,
            head_hh.is_printed AS is_printed,
            CASE 
              WHEN hw.fh_v_id = hw.mem_v_id THEN 'Head of Household'
              ELSE 'Member'
            END AS household_role
          FROM 
            household_warding hw
          JOIN 
            v_info member ON hw.mem_v_id = member.v_id
          JOIN 
            v_info head ON hw.fh_v_id = head.v_id
          LEFT JOIN 
            barangays b ON member.barangayId = b.id
          LEFT JOIN 
            head_household head_hh ON hw.fh_v_id = head_hh.fh_v_id
          WHERE 
            hw.fh_v_id = ?
          ORDER BY 
            household_role DESC,
            member_name`,
          {
            replacements: [fhVId], // Using fh_v_id instead of household_id
            type: QueryTypes.SELECT
          }
        ) as Array<{
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
          household_role: string;
        }>;
        
        // Get politics data for all household members
        const memberIds = members.map(member => member.member_id);
        
        // Add the household head if not already in the list
        if (!memberIds.includes(fhVId)) {
          memberIds.push(fhVId);
        }
        
        // Fetch politics data for all members
        const politicsData = await sequelize.query(
          `SELECT 
            p.id,
            p.v_id,
            p.congressman,
            p.governor,
            p.vicegov,
            p.mayor
          FROM 
            politics p
          WHERE 
            p.v_id IN (?)`,
          {
            replacements: [memberIds],
            type: QueryTypes.SELECT
          }
        ) as Array<{
          id: number;
          v_id: number;
          congressman: number;
          governor: number;
          vicegov: number;
          mayor: number;
        }>;
        
        // Create a map for faster lookups
        const politicsMap = new Map();
        politicsData.forEach(p => {
          politicsMap.set(p.v_id, p);
        });
        
        // Add diagnostic logging
        console.log(`Household ${household.household_id}: Using fh_v_id=${fhVId}, found ${members.length} members`);
        if (members.length > 0) {
          console.log(`Members: ${members.map(m => `${m.member_name} (${m.household_role})`).join(', ')}`);
        }
        
        // Check if household head is included in members
        const hasHeadInMembers = members.some(m => m.household_role === 'Head of Household');
        
        // Create a complete list of members that includes the head
        let allMembers = [...members];
        
        // If head is not in members list, create a head entry from household data
        if (!hasHeadInMembers) {
          // Create a household head member entry
          const headMember = {
            member_record_id: 0,
            household_head_id: household.household_id,
            household_head_name: household.household_head_name,
            member_id: fhVId,
            member_name: household.household_head_name,
            gender: 'Unknown',
            birthdate: '',
            age: 0,
            precinct_no: '',
            barangay: household.location,
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
        
        // Helper function to generate remarks based on politics data
        const getRemarks = (memberId: number) => {
          const politics = politicsMap.get(memberId);
          
          if (!politics) {
            return 'NO DATA';
          }
          
          // Check if all fields are null, undefined, or 0 (undecided)
          const isUndecided = 
            (!politics.congressman || politics.congressman === 0) && 
            (!politics.governor || politics.governor === 0) && 
            (!politics.vicegov || politics.vicegov === 0);
          
          // Also check for specific undecided IDs (679, 680, 681)
          const hasUndecidedIds = 
            politics.congressman === 679 && 
            politics.governor === 680 && 
            politics.vicegov === 681;
          
          if (isUndecided || hasUndecidedIds) {
            return 'UNDECIDED(ALL 3)';
          }
          
          // Check if voter supports the "straight" lineup (IDs as specified)
          const straightLineup = (
            politics.congressman === 660 && 
            politics.governor === 662 && 
            politics.vicegov === 676
          );
          
          if (straightLineup) {
            return 'STRAIGHT';
          }
          
          // Otherwise, construct a comma-separated list of supported candidates
          const supportedPoliticians = [];
          
          // Check if congressman is one of the undecided IDs
          if (politics.congressman === 679) {
            supportedPoliticians.push('UNDECIDED');
          } else if (politics.congressman && politics.congressman !== 0 && congressmanMap.has(politics.congressman)) {
            supportedPoliticians.push(congressmanMap.get(politics.congressman)?.LastName || '');
          } else if (politics.congressman === 0 || politics.congressman === null) {
            supportedPoliticians.push('UNDECIDED');
          }
          
          // Check if governor is one of the undecided IDs
          if (politics.governor === 680) {
            supportedPoliticians.push('UNDECIDED');
          } else if (politics.governor && politics.governor !== 0 && governorMap.has(politics.governor)) {
            supportedPoliticians.push(governorMap.get(politics.governor)?.LastName || '');
          } else if (politics.governor === 0 || politics.governor === null) {
            supportedPoliticians.push('UNDECIDED');
          }
          
          // Check if vice governor is one of the undecided IDs
          if (politics.vicegov === 681) {
            supportedPoliticians.push('UNDECIDED');
          } else if (politics.vicegov && politics.vicegov !== 0 && viceGovernorMap.has(politics.vicegov)) {
            supportedPoliticians.push(viceGovernorMap.get(politics.vicegov)?.LastName || '');
          } else if (politics.vicegov === 0 || politics.vicegov === null) {
            supportedPoliticians.push('UNDECIDED');
          }
          
          return supportedPoliticians.length > 0 
            ? supportedPoliticians.join(', ') 
            : 'NO PREFERENCE';
        };
        
        // Format household for printing with members array
        const printHousehold = {
          householdId: household.household_id,
          householdNumber: household.household_id.toString().padStart(3, '0'),
          wardLeader: leader.full_name || 'UNASSIGNED',
          members: sortedMembers.map(member => ({
            name: member.member_name.toUpperCase(),
            position: member.household_role === 'Head of Household' ? 'HH Head' : 'Member',
            remarks: getRemarks(member.member_id)
          })),
          receivedBy: {
            name: '',
            signature: '',
            position: '',
            timeSigned: ''
          }
        };
        
        // If there are no regular members (only the head), add a "No household members" row
        if (sortedMembers.length === 1 && sortedMembers[0].household_role === 'Head of Household') {
          printHousehold.members.push({
            name: 'NO HOUSEHOLD MEMBERS',
            position: '-',
            remarks: '-'
          });
        }
        
        result.push(printHousehold);
        totalHouseholds++;
      }
    }
    
    return res.json({
      status: 'success',
      data: result
    });
    
  } catch (error: any) {
    console.error('Error fetching households for printing:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch printing data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mark a batch of households as printed
 * This endpoint updates the is_printed flag for all households in the provided batch
 */
export const markHouseholdsAsPrinted = async (req: Request, res: Response) => {
  try {
    // Extract household IDs from the request body
    const { householdIds } = req.body;
    
    if (!householdIds || !Array.isArray(householdIds) || householdIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid household IDs array is required'
      });
    }
    
    // Update the is_printed flag for all household IDs in the batch
    const result = await sequelize.query(
      `UPDATE head_household 
       SET is_printed = 1 
       WHERE id IN (:householdIds)`,
      {
        replacements: { householdIds },
        type: QueryTypes.UPDATE
      }
    );
    
    // Return success response with update count
    res.json({
      status: 'success',
      message: 'Households marked as printed successfully',
      data: {
        updatedCount: result[1] // Affected rows count
      }
    });
    
  } catch (error: any) {
    console.error('Error marking households as printed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark households as printed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch ward leaders data for printing
 * This endpoint retrieves ward leader data filtered by municipality and barangay
 */
export const getWardLeadersForPrinting = async (req: Request, res: Response) => {
  try {
    // Get filter parameters from query string
    const { municipality, barangay, purok_st, limit = '50' } = req.query;
    
    // Parse limit to number with a fallback to 50
    const recordLimit = parseInt(limit as string, 10) || 50;
    
    // Get politician data for faster lookups
    const { congressmanMap, governorMap, viceGovernorMap, mayorMap } = await getPoliticianNames();
    
    // Prepare SQL WHERE clauses based on filters
    const whereConditions = [];
    
    // Filter by municipality if provided
    if (municipality && municipality !== 'all') {
      whereConditions.push(`b.municipality = '${municipality}'`);
    }
    
    // Filter by barangay if provided
    if (barangay && barangay !== 'all') {
      whereConditions.push(`b.barangay = '${barangay}'`);
    }
    
    // Filter by purok if provided
    if (purok_st && purok_st !== 'all') {
      // For ward leaders, we need to join with the head_household table to filter by purok
      whereConditions.push(`EXISTS (
        SELECT 1 FROM head_household hh 
        WHERE hh.leader_v_id = l.v_id 
        AND hh.purok_st = '${purok_st}'
      )`);
    }
    
    // Always filter for ward leaders (type=1), election year 2025, and not yet printed
    // Adding hh.leader_v_id IS NOT NULL condition to ensure consistency with other ward leader queries
    whereConditions.push('l.type = 1');
    whereConditions.push('l.electionyear = 2025');
    whereConditions.push('l.is_printed = 0');
    whereConditions.push('EXISTS (SELECT 1 FROM head_household hh WHERE hh.leader_v_id = l.v_id)');
    
    // Combine all WHERE conditions
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Fetch ward leaders with voter information - using latest entry based on dateadded
    const wardLeaders = await sequelize.query(
      `SELECT 
        l.id AS leader_id,
        l.v_id,
        l.type,
        l.electionyear,
        l.status,
        l.is_printed,
        l.is_Received,
        l.dateadded,
        v.v_lname,
        v.v_fname,
        v.v_mname,
        v.v_gender,
        v.v_precinct_no,
        v.v_birthday,
        b.barangay,
        b.municipality,
        CONCAT(v.v_lname, ', ', v.v_fname, ' ', IFNULL(v.v_mname, '')) AS full_name
      FROM 
        leaders l
      JOIN 
        v_info v ON l.v_id = v.v_id
      LEFT JOIN 
        barangays b ON v.barangayId = b.id
      INNER JOIN (
        SELECT v_id, MAX(dateadded) as latest_date
        FROM leaders
        WHERE type = 1
        GROUP BY v_id
      ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
      ${whereClause}
      ORDER BY 
        b.municipality ASC, b.barangay ASC, v.v_lname ASC, v.v_fname ASC
      LIMIT ${recordLimit}`,
      { type: QueryTypes.SELECT }
    );
    
    // Get all leader IDs for fetching politics data
    const leaderIds = wardLeaders.map((leader: any) => leader.v_id);
    
    // Fetch politics data for all leaders
    const politicsData = await sequelize.query(
      `SELECT 
        p.id,
        p.v_id,
        p.congressman,
        p.governor,
        p.vicegov,
        p.mayor
      FROM 
        politics p
      WHERE 
        p.v_id IN (?)`,
      {
        replacements: [leaderIds],
        type: QueryTypes.SELECT
      }
    ) as Array<{
      id: number;
      v_id: number;
      congressman: number;
      governor: number;
      vicegov: number;
      mayor: number;
    }>;
    
    // Create a map for faster lookups
    const politicsMap = new Map();
    politicsData.forEach(p => {
      politicsMap.set(p.v_id, p);
    });
    
    // Helper function to generate remarks based on politics data
    const getRemarks = (leaderId: number) => {
      const politics = politicsMap.get(leaderId);
      
      if (!politics) {
        return 'NO DATA';
      }
      
      // Check if all fields are null, undefined, or 0 (undecided)
      const isUndecided = 
        (!politics.congressman || politics.congressman === 0) && 
        (!politics.governor || politics.governor === 0) && 
        (!politics.vicegov || politics.vicegov === 0);
      
      // Also check for specific undecided IDs (679, 680, 681)
      const hasUndecidedIds = 
        politics.congressman === 679 && 
        politics.governor === 680 && 
        politics.vicegov === 681;
      
      if (isUndecided || hasUndecidedIds) {
        return 'UNDECIDED(ALL 3)';
      }
      
      // Check if voter supports the "straight" lineup (IDs as specified)
      const straightLineup = (
        politics.congressman === 660 && 
        politics.governor === 662 && 
        politics.vicegov === 676
      );
      
      if (straightLineup) {
        return 'STRAIGHT';
      }
      
      // Otherwise, construct a comma-separated list of supported candidates
      const supportedPoliticians = [];
      
      // Check if congressman is one of the undecided IDs
      if (politics.congressman === 679) {
        supportedPoliticians.push('UNDECIDED');
      } else if (politics.congressman && politics.congressman !== 0 && congressmanMap.has(politics.congressman)) {
        supportedPoliticians.push(congressmanMap.get(politics.congressman)?.LastName || '');
      } else if (politics.congressman === 0 || politics.congressman === null) {
        supportedPoliticians.push('UNDECIDED');
      }
      
      // Check if governor is one of the undecided IDs
      if (politics.governor === 680) {
        supportedPoliticians.push('UNDECIDED');
      } else if (politics.governor && politics.governor !== 0 && governorMap.has(politics.governor)) {
        supportedPoliticians.push(governorMap.get(politics.governor)?.LastName || '');
      } else if (politics.governor === 0 || politics.governor === null) {
        supportedPoliticians.push('UNDECIDED');
      }
      
      // Check if vice governor is one of the undecided IDs
      if (politics.vicegov === 681) {
        supportedPoliticians.push('UNDECIDED');
      } else if (politics.vicegov && politics.vicegov !== 0 && viceGovernorMap.has(politics.vicegov)) {
        supportedPoliticians.push(viceGovernorMap.get(politics.vicegov)?.LastName || '');
      } else if (politics.vicegov === 0 || politics.vicegov === null) {
        supportedPoliticians.push('UNDECIDED');
      }
      
      return supportedPoliticians.length > 0 
        ? supportedPoliticians.join(', ') 
        : 'NO PREFERENCE';
    };
    
    // Format data for printing
    const result = wardLeaders.map((leader: any) => {
      const politics = politicsMap.get(leader.v_id);
      
      return {
        leaderId: leader.leader_id,
        wardLeaderNumber: leader.leader_id.toString().padStart(3, '0'),
        v_id: leader.v_id,
        name: `${leader.v_lname}, ${leader.v_fname} ${leader.v_mname || ''}`.trim().toUpperCase(),
        precinct: leader.v_precinct_no || 'N/A',
        barangay: leader.barangay || 'N/A',
        municipality: leader.municipality || 'N/A',
        gender: leader.v_gender || 'N/A',
        birthday: leader.v_birthday 
          ? new Date(leader.v_birthday).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            }) 
          : 'N/A',
        electionYear: leader.electionyear || 'N/A',
        politicsData: politics ? {
          congressman: politics.congressman,
          governor: politics.governor,
          vicegov: politics.vicegov,
          mayor: politics.mayor,
          supportedCandidates: getRemarks(leader.v_id),
          isUndecided: (!politics.congressman || politics.congressman === 0) && 
                      (!politics.governor || politics.governor === 0) && 
                      (!politics.vicegov || politics.vicegov === 0)
        } : undefined,
        votingPreference: {
          name: leader.name,
          position: "WARD LEADER",
          remarks: getRemarks(leader.v_id)
        },
        receivedBy: {
          name: '',
          signature: '',
          position: '',
          timeSigned: ''
        }
      };
    });
    
    return res.json({
      status: 'success',
      data: result
    });
    
  } catch (error: any) {
    console.error('Error fetching ward leaders for printing:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ward leader data for printing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mark ward leaders as printed
 * This endpoint updates the is_printed flag for all ward leaders in the provided batch
 */
export const markWardLeadersAsPrinted = async (req: Request, res: Response) => {
  try {
    // Extract leader IDs from the request body
    const { leaderIds } = req.body;
    
    if (!leaderIds || !Array.isArray(leaderIds) || leaderIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid leader IDs array is required'
      });
    }
    
    // Update the is_printed flag for all leader IDs in the batch
    const result = await sequelize.query(
      `UPDATE leaders 
       SET is_printed = 1 
       WHERE id IN (:leaderIds) AND type = 1 AND electionyear = 2025`,
      {
        replacements: { leaderIds },
        type: QueryTypes.UPDATE
      }
    );
    
    // Return success response with update count
    res.json({
      status: 'success',
      message: 'Ward leaders marked as printed successfully',
      data: {
        updatedCount: result[1] // Affected rows count
      }
    });
    
  } catch (error: any) {
    console.error('Error marking ward leaders as printed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark ward leaders as printed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch barangay coordinator data for printing
 * This endpoint retrieves barangay coordinator data filtered by municipality and barangay
 */
export const getBarangayCoordinatorsForPrinting = async (req: Request, res: Response) => {
  try {
    // Get filter parameters from query string
    const { municipality, barangay, purok_st, limit = '50' } = req.query;
    
    // Parse limit to number with a fallback to 50
    const recordLimit = parseInt(limit as string, 10) || 50;
    
    // Get politician data for faster lookups
    const { congressmanMap, governorMap, viceGovernorMap, mayorMap } = await getPoliticianNames();
    
    // Prepare SQL WHERE clauses based on filters
    const whereConditions = [];
    
    // Filter by municipality if provided
    if (municipality && municipality !== 'all') {
      whereConditions.push(`b.municipality = '${municipality}'`);
    }
    
    // Filter by barangay if provided
    if (barangay && barangay !== 'all') {
      whereConditions.push(`b.barangay = '${barangay}'`);
    }
    
    // Filter by purok if provided
    if (purok_st && purok_st !== 'all') {
      // For barangay coordinators, we need to join with the head_household table to filter by purok
      whereConditions.push(`EXISTS (
        SELECT 1 FROM head_household hh 
        WHERE hh.leader_v_id = l.v_id 
        AND hh.purok_st = '${purok_st}'
      )`);
    }
    
    // Always filter for barangay coordinators (type=2), election year 2025, and not yet printed
    whereConditions.push('l.type = 2');
    whereConditions.push('v.record_type = 1');
    whereConditions.push('l.electionyear = 2025');
    whereConditions.push('l.status IS NULL');
    whereConditions.push('l.is_printed = 0');
    
    // Combine all WHERE conditions
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Fetch barangay coordinators with voter information - only get the latest entry for each v_id based on dateadded
    const barangayCoordinators = await sequelize.query(
      `SELECT 
        l.id AS leader_id,
        l.v_id,
        l.type,
        l.electionyear,
        l.status,
        l.is_printed,
        l.is_Received,
        l.dateadded,
        v.v_lname,
        v.v_fname,
        v.v_mname,
        v.v_gender,
        v.v_precinct_no,
        v.v_birthday,
        b.barangay,
        b.municipality,
        CONCAT(v.v_lname, ', ', v.v_fname, ' ', IFNULL(v.v_mname, '')) AS full_name
      FROM 
        leaders l
      INNER JOIN 
        v_info v ON l.v_id = v.v_id
      INNER JOIN 
        barangays b ON v.barangayId = b.id
      INNER JOIN (
        SELECT v_id, MAX(dateadded) as latest_date
        FROM leaders
        WHERE type = 2
        GROUP BY v_id
      ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
      ${whereClause}
      ORDER BY 
        b.municipality ASC, b.barangay ASC, v.v_lname ASC, v.v_fname ASC
      LIMIT ${recordLimit}`,
      { type: QueryTypes.SELECT }
    );
    
    // Get all coordinator IDs for fetching politics data
    const coordinatorIds = barangayCoordinators.map((coordinator: any) => coordinator.v_id);
    
    // Handle the case when no coordinators are found
    if (coordinatorIds.length === 0) {
      return res.json({
        status: 'success',
        data: []
      });
    }
    
    // Fetch politics data for all coordinators
    const politicsData = await sequelize.query(
      `SELECT 
        p.id,
        p.v_id,
        p.congressman,
        p.governor,
        p.vicegov,
        p.mayor
      FROM 
        politics p
      WHERE 
        p.v_id IN (?)`,
      {
        replacements: [coordinatorIds],
        type: QueryTypes.SELECT
      }
    ) as Array<{
      id: number;
      v_id: number;
      congressman: number;
      governor: number;
      vicegov: number;
      mayor: number;
    }>;
    
    // Create a map for faster lookups
    const politicsMap = new Map();
    politicsData.forEach(p => {
      politicsMap.set(p.v_id, p);
    });
    
    // Helper function to generate remarks based on politics data
    const getRemarks = (coordinatorId: number) => {
      const politics = politicsMap.get(coordinatorId);
      
      if (!politics) {
        return 'NO DATA';
      }
      
      // Check if all fields are null, undefined, or 0 (undecided)
      const isUndecided = 
        (!politics.congressman || politics.congressman === 0) && 
        (!politics.governor || politics.governor === 0) && 
        (!politics.vicegov || politics.vicegov === 0);
      
      // Also check for specific undecided IDs (679, 680, 681)
      const hasUndecidedIds = 
        politics.congressman === 679 && 
        politics.governor === 680 && 
        politics.vicegov === 681;
      
      if (isUndecided || hasUndecidedIds) {
        return 'UNDECIDED(ALL 3)';
      }
      
      // Check if voter supports the "straight" lineup (IDs as specified)
      const straightLineup = (
        politics.congressman === 660 && 
        politics.governor === 662 && 
        politics.vicegov === 676
      );
      
      if (straightLineup) {
        return 'STRAIGHT';
      }
      
      // Otherwise, construct a comma-separated list of supported candidates
      const supportedPoliticians = [];
      
      // Check if congressman is one of the undecided IDs
      if (politics.congressman === 679) {
        supportedPoliticians.push('UNDECIDED');
      } else if (politics.congressman && politics.congressman !== 0 && congressmanMap.has(politics.congressman)) {
        supportedPoliticians.push(congressmanMap.get(politics.congressman)?.LastName || '');
      } else if (politics.congressman === 0 || politics.congressman === null) {
        supportedPoliticians.push('UNDECIDED');
      }
      
      // Check if governor is one of the undecided IDs
      if (politics.governor === 680) {
        supportedPoliticians.push('UNDECIDED');
      } else if (politics.governor && politics.governor !== 0 && governorMap.has(politics.governor)) {
        supportedPoliticians.push(governorMap.get(politics.governor)?.LastName || '');
      } else if (politics.governor === 0 || politics.governor === null) {
        supportedPoliticians.push('UNDECIDED');
      }
      
      // Check if vice governor is one of the undecided IDs
      if (politics.vicegov === 681) {
        supportedPoliticians.push('UNDECIDED');
      } else if (politics.vicegov && politics.vicegov !== 0 && viceGovernorMap.has(politics.vicegov)) {
        supportedPoliticians.push(viceGovernorMap.get(politics.vicegov)?.LastName || '');
      } else if (politics.vicegov === 0 || politics.vicegov === null) {
        supportedPoliticians.push('UNDECIDED');
      }
      
      return supportedPoliticians.length > 0 
        ? supportedPoliticians.join(', ') 
        : 'NO PREFERENCE';
    };
    
    // Format data for printing
    const result = barangayCoordinators.map((coordinator: any) => {
      const politics = politicsMap.get(coordinator.v_id);
      
      return {
        leaderId: coordinator.leader_id,
        wardLeaderNumber: coordinator.leader_id.toString().padStart(3, '0'),
        v_id: coordinator.v_id,
        name: `${coordinator.v_lname}, ${coordinator.v_fname} ${coordinator.v_mname || ''}`.trim().toUpperCase(),
        precinct: coordinator.v_precinct_no || 'N/A',
        barangay: coordinator.barangay || 'N/A',
        municipality: coordinator.municipality || 'N/A',
        gender: coordinator.v_gender || 'N/A',
        birthday: coordinator.v_birthday 
          ? new Date(coordinator.v_birthday).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            }) 
          : 'N/A',
        electionYear: coordinator.electionyear || 'N/A',
        politicsData: politics ? {
          congressman: politics.congressman,
          governor: politics.governor,
          vicegov: politics.vicegov,
          mayor: politics.mayor,
          supportedCandidates: getRemarks(coordinator.v_id),
          isUndecided: (!politics.congressman || politics.congressman === 0) && 
                      (!politics.governor || politics.governor === 0) && 
                      (!politics.vicegov || politics.vicegov === 0)
        } : undefined,
        votingPreference: {
          name: coordinator.name,
          position: "BARANGAY COORDINATOR",
          remarks: getRemarks(coordinator.v_id)
        },
        receivedBy: {
          name: '',
          signature: '',
          position: '',
          timeSigned: ''
        }
      };
    });
    
    return res.json({
      status: 'success',
      data: result
    });
    
  } catch (error: any) {
    console.error('Error fetching barangay coordinators for printing:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch barangay coordinator data for printing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mark barangay coordinators as printed
 */
export const markBarangayCoordinatorsAsPrinted = async (req: Request, res: Response) => {
  try {
    const { leaderIds } = req.body;
    
    if (!leaderIds || !Array.isArray(leaderIds) || leaderIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Leader IDs array is required'
      });
    }
    
    // Update the is_printed status for all provided leader IDs
    const [updatedCount] = await sequelize.query(
      `UPDATE leaders 
       SET is_printed = 1
       WHERE id IN (?) AND type = 2`,
      {
        replacements: [leaderIds],
        type: QueryTypes.UPDATE
      }
    );
    
    res.json({
      status: 'success',
      data: {
        updatedCount
      },
      message: `Successfully marked ${updatedCount} barangay coordinators as printed`
    });
    
  } catch (error: any) {
    console.error('Error marking barangay coordinators as printed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update barangay coordinator print status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 

/**
 * Get households data for the report table with pagination and filtering
 * This endpoint returns household data in a format suitable for the report table
 */
export const getHouseholdsReport = async (req: Request, res: Response) => {
  try {
    // Extract filter and pagination parameters from the request query
    const { 
      municipality, 
      barangay, 
      name,
      page = '1', 
      limit = '10',
      sortBy = 'household_head_name',
      sortOrder = 'asc'
    } = req.query;
    
    // Parse pagination parameters
    const currentPage = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const offset = (currentPage - 1) * pageSize;
    
    // Build WHERE clauses based on filters
    let whereConditions = [];
    
    // Always filter to ensure we have valid household heads
    whereConditions.push('hh.fh_v_id IS NOT NULL');
    
    if (municipality) {
      whereConditions.push(`b.municipality LIKE '%${municipality}%'`);
    }
    
    if (barangay) {
      whereConditions.push(`b.barangay LIKE '%${barangay}%'`);
    }
    
    if (name) {
      whereConditions.push(`(
        v.v_fname LIKE '%${name}%' OR 
        v.v_mname LIKE '%${name}%' OR 
        v.v_lname LIKE '%${name}%' OR
        CONCAT(v.v_fname, ' ', v.v_mname, ' ', v.v_lname) LIKE '%${name}%'
      )`);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Get total count of households matching the filter criteria
    const countQuery = `
      SELECT COUNT(DISTINCT hh.id) AS total
      FROM head_household hh
      JOIN v_info v ON hh.fh_v_id = v.v_id
      LEFT JOIN barangays b ON v.barangayId = b.id
      ${whereClause}
    `;
    
    const countResult = await sequelize.query(countQuery, { type: QueryTypes.SELECT });
    const total = (countResult[0] as any).total;
    
    // If no results, return empty data with filter options
    if (total === 0) {
      // Get municipalities and barangays for filters
      const municipalities = await sequelize.query(
        `SELECT DISTINCT municipality FROM barangays ORDER BY municipality`,
        { type: QueryTypes.SELECT }
      );
      
      const barangays = await sequelize.query(
        `SELECT DISTINCT barangay, municipality FROM barangays ORDER BY municipality, barangay`,
        { type: QueryTypes.SELECT }
      );
      
      return res.json({
        status: 'success',
        data: [],
        meta: {
          total: 0,
          page: currentPage,
          limit: pageSize,
          totalPages: 0
        },
        filterOptions: {
          municipalities,
          barangays
        }
      });
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize);
    
    // Get households with pagination and sorting
    const query = `
      SELECT 
        hh.id AS household_id,
        hh.fh_v_id AS household_head_id,
        CONCAT(
          IFNULL(v.v_fname, ''), ' ',
          IFNULL(v.v_mname, ''), ' ',
          IFNULL(v.v_lname, '')
        ) AS household_head_name,
        b.barangay,
        b.municipality,
        hh.purok_st AS street_address,
        (
          SELECT COUNT(*) 
          FROM household_warding hw 
          WHERE hw.fh_v_id = hh.fh_v_id
        ) AS household_members_count,
        hh.date_saved AS registration_date,
        hh.is_printed
      FROM 
        head_household hh
      JOIN 
        v_info v ON hh.fh_v_id = v.v_id
      LEFT JOIN 
        barangays b ON v.barangayId = b.id
      ${whereClause}
      GROUP BY 
        hh.id, hh.fh_v_id, v.v_fname, v.v_mname, v.v_lname, 
        b.barangay, b.municipality, hh.purok_st, hh.date_saved, hh.is_printed
      ORDER BY 
        ${sortBy} ${sortOrder}
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    
    const households = await sequelize.query(query, { type: QueryTypes.SELECT });
    
    // Get municipalities and barangays for filters
    const municipalities = await sequelize.query(
      `SELECT DISTINCT municipality FROM barangays ORDER BY municipality`,
      { type: QueryTypes.SELECT }
    );
    
    const barangays = await sequelize.query(
      `SELECT DISTINCT barangay, municipality FROM barangays ORDER BY municipality, barangay`,
      { type: QueryTypes.SELECT }
    );
    
    // Return the data with pagination metadata
    res.json({
      status: 'success',
      data: households,
      meta: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages
      },
      filterOptions: {
        municipalities,
        barangays
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching households report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch households report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 

// Get Ward Leaders statistics for pie chart
export const getWardLeadersStatistics = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters from the request query
    const { municipality, barangay } = req.query;
    
    // Build WHERE clauses based on filters - exactly match the Ward Leaders Report query
    let whereClause = "l.type = 1 AND hh.leader_v_id IS NOT NULL AND l.electionyear = 2025";
    
    if (municipality) {
      whereClause += ` AND b.municipality LIKE '%${municipality}%'`;
    }
    
    if (barangay) {
      whereClause += ` AND b.barangay LIKE '%${barangay}%'`;
    }
    
    // Get ward leader statistics - using latest entry based on dateadded
    const wardLeaderStats = await sequelize.query(
      `SELECT 
    (SELECT COUNT(DISTINCT l.v_id)
     FROM head_household hh
     JOIN leaders l ON hh.leader_v_id = l.v_id
     JOIN v_info v ON l.v_id = v.v_id
     LEFT JOIN barangays b ON v.barangayId = b.id
     INNER JOIN (
       SELECT v_id, MAX(dateadded) as latest_date
       FROM leaders
       WHERE type = 1
       GROUP BY v_id
     ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
     WHERE l.type = 1 
       AND hh.leader_v_id IS NOT NULL
       AND l.electionyear = 2025
       ${municipality ? ` AND b.municipality LIKE '%${municipality}%'` : ''}
       ${barangay ? ` AND b.barangay LIKE '%${barangay}%'` : ''}
       AND l.is_printed = 0
    ) AS 'not_printed',
    
    (SELECT COUNT(DISTINCT l.v_id)
     FROM head_household hh
     JOIN leaders l ON hh.leader_v_id = l.v_id
     JOIN v_info v ON l.v_id = v.v_id
     LEFT JOIN barangays b ON v.barangayId = b.id
     INNER JOIN (
       SELECT v_id, MAX(dateadded) as latest_date
       FROM leaders
       WHERE type = 1
       GROUP BY v_id
     ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
     WHERE l.type = 1 
       AND hh.leader_v_id IS NOT NULL
       AND l.electionyear = 2025
       ${municipality ? ` AND b.municipality LIKE '%${municipality}%'` : ''}
       ${barangay ? ` AND b.barangay LIKE '%${barangay}%'` : ''}
       AND l.is_printed = 1
    ) AS 'printed',
    
    (SELECT COUNT(DISTINCT l.v_id)
     FROM head_household hh
     JOIN leaders l ON hh.leader_v_id = l.v_id
     JOIN v_info v ON l.v_id = v.v_id
     LEFT JOIN barangays b ON v.barangayId = b.id
     INNER JOIN (
       SELECT v_id, MAX(dateadded) as latest_date
       FROM leaders
       WHERE type = 1
       GROUP BY v_id
     ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
     WHERE l.type = 1 
       AND hh.leader_v_id IS NOT NULL
       AND l.electionyear = 2025
       ${municipality ? ` AND b.municipality LIKE '%${municipality}%'` : ''}
       ${barangay ? ` AND b.barangay LIKE '%${barangay}%'` : ''}
    ) AS 'total'
`,
      { type: QueryTypes.SELECT }
    );
    
    // Return the data
    res.json({
      status: 'success',
      data: wardLeaderStats[0]
    });
    
  } catch (error: any) {
    console.error('Error fetching ward leaders statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ward leaders statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get print statistics by barangay for all print types
// Define the interface for print statistics by barangay
interface BarangayPrintStat {
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

export const getPrintStatisticsByBarangay = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters from the request query
    const { municipality } = req.query;

    // Build WHERE clauses based on filters
    let municipalityFilter = "";

    if (municipality && municipality !== 'all') {
      municipalityFilter = `WHERE b.municipality = '${municipality}'`;
    }

    // Get household print statistics by barangay
    const householdStatsByBarangay = await sequelize.query(
      `SELECT 
        b.barangay,
        SUM(CASE WHEN hh.is_printed = 1 THEN 1 ELSE 0 END) AS printed,
        SUM(CASE WHEN hh.is_printed = 0 OR hh.is_printed IS NULL THEN 1 ELSE 0 END) AS not_printed,
        COUNT(*) AS total
      FROM 
        head_household hh
      JOIN 
        v_info v ON hh.fh_v_id = v.v_id
      LEFT JOIN
        barangays b ON v.barangayId = b.id
      ${municipalityFilter}
      GROUP BY b.barangay
      ORDER BY b.barangay`,
      { type: QueryTypes.SELECT }
    );
    
    // Get ward leader print statistics by barangay
    const wardLeaderStatsByBarangay = await sequelize.query(
      `SELECT 
        b.barangay,
        SUM(CASE WHEN l.is_printed = 1 THEN 1 ELSE 0 END) AS printed,
        SUM(CASE WHEN l.is_printed = 0 OR l.is_printed IS NULL THEN 1 ELSE 0 END) AS not_printed,
        COUNT(*) AS total
      FROM 
        leaders l
      JOIN 
        v_info v ON l.v_id = v.v_id
      LEFT JOIN
        barangays b ON v.barangayId = b.id
      INNER JOIN (
        SELECT v_id, MAX(dateadded) as latest_date
        FROM leaders
        WHERE type = 1
        GROUP BY v_id
      ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
      WHERE l.type = 1 AND l.electionyear = 2025
      ${municipality && municipality !== 'all' ? `AND b.municipality = '${municipality}'` : ''}
      GROUP BY b.barangay
      ORDER BY b.barangay`,
      { type: QueryTypes.SELECT }
    );
    
    // Get barangay coordinator print statistics by barangay
    const coordinatorStatsByBarangay = await sequelize.query(
      `SELECT 
        b.barangay,
        SUM(CASE WHEN l.is_printed = 1 THEN 1 ELSE 0 END) AS printed,
        SUM(CASE WHEN l.is_printed = 0 OR l.is_printed IS NULL THEN 1 ELSE 0 END) AS not_printed,
        COUNT(*) AS total
      FROM 
        leaders l
      JOIN 
        v_info v ON l.v_id = v.v_id
      LEFT JOIN
        barangays b ON v.barangayId = b.id
      INNER JOIN (
        SELECT v_id, MAX(dateadded) as latest_date
        FROM leaders
        WHERE type = 2
        GROUP BY v_id
      ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
      WHERE l.type = 2 AND l.electionyear = 2025
      ${municipality && municipality !== 'all' ? `AND b.municipality = '${municipality}'` : ''}
      GROUP BY b.barangay
      ORDER BY b.barangay`,
      { type: QueryTypes.SELECT }
    );
    
    // Format data for frontend consumption
    const barangayStats: BarangayPrintStat[] = [];
    
    // Get unique list of all barangays from all three queries
    const allBarangays = new Set<string>();
    householdStatsByBarangay.forEach((stat: any) => allBarangays.add(stat.barangay));
    wardLeaderStatsByBarangay.forEach((stat: any) => allBarangays.add(stat.barangay));
    coordinatorStatsByBarangay.forEach((stat: any) => allBarangays.add(stat.barangay));
    
    // Create a map for each stat type for easier lookup
    const householdMap = new Map();
    householdStatsByBarangay.forEach((stat: any) => {
      householdMap.set(stat.barangay, {
        printed: Number(stat.printed) || 0,
        not_printed: Number(stat.not_printed) || 0,
        total: Number(stat.total) || 0
      });
    });
    
    const wardLeaderMap = new Map();
    wardLeaderStatsByBarangay.forEach((stat: any) => {
      wardLeaderMap.set(stat.barangay, {
        printed: Number(stat.printed) || 0,
        not_printed: Number(stat.not_printed) || 0,
        total: Number(stat.total) || 0
      });
    });
    
    const coordinatorMap = new Map();
    coordinatorStatsByBarangay.forEach((stat: any) => {
      coordinatorMap.set(stat.barangay, {
        printed: Number(stat.printed) || 0,
        not_printed: Number(stat.not_printed) || 0,
        total: Number(stat.total) || 0
      });
    });
    
    // Create a combined dataset with all barangays
    Array.from(allBarangays).forEach((barangay: any) => {
      const householdStat = householdMap.get(barangay) || { printed: 0, not_printed: 0, total: 0 };
      const wardLeaderStat = wardLeaderMap.get(barangay) || { printed: 0, not_printed: 0, total: 0 };
      const coordinatorStat = coordinatorMap.get(barangay) || { printed: 0, not_printed: 0, total: 0 };
      
      // Calculate percentages
      const householdPercentage = householdStat.total > 0 ? Math.round((householdStat.printed / householdStat.total) * 100) : 0;
      const wardLeaderPercentage = wardLeaderStat.total > 0 ? Math.round((wardLeaderStat.printed / wardLeaderStat.total) * 100) : 0;
      const coordinatorPercentage = coordinatorStat.total > 0 ? Math.round((coordinatorStat.printed / coordinatorStat.total) * 100) : 0;
      
      barangayStats.push({
        barangay,
        households: {
          ...householdStat,
          percentage: householdPercentage
        },
        wardLeaders: {
          ...wardLeaderStat,
          percentage: wardLeaderPercentage
        },
        coordinators: {
          ...coordinatorStat,
          percentage: coordinatorPercentage
        }
      });
    });
    
    // Sort by barangay name
    barangayStats.sort((a, b) => a.barangay.localeCompare(b.barangay));
    
    return res.json({
      status: 'success',
      data: barangayStats
    });
    
  } catch (error: any) {
    console.error('Error fetching print statistics by barangay:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch print statistics by barangay',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get print statistics for households and ward leaders
export const getPrintStatistics = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters from the request query
    const { municipality, barangay } = req.query;
    
    // Build WHERE clauses based on filters
    let whereClause = "";
    
    if (municipality) {
      whereClause += whereClause ? " AND " : " WHERE ";
      whereClause += `b.municipality LIKE '%${municipality}%'`;
    }
    
    if (barangay) {
      whereClause += whereClause ? " AND " : " WHERE ";
      whereClause += `b.barangay LIKE '%${barangay}%'`;
    }
    
    // Get household print statistics
    const householdStats = await sequelize.query(
      `SELECT 
        SUM(CASE WHEN hh.is_printed = 1 THEN 1 ELSE 0 END) AS printed,
        SUM(CASE WHEN hh.is_printed = 0 OR hh.is_printed IS NULL THEN 1 ELSE 0 END) AS not_printed,
        COUNT(*) AS total
      FROM 
        head_household hh
      JOIN 
        v_info v ON hh.fh_v_id = v.v_id
      LEFT JOIN
        barangays b ON v.barangayId = b.id
      ${whereClause}`,
      { type: QueryTypes.SELECT }
    );
    
    // Get ward leader print statistics - using exact same query structure and getting latest entry based on dateadded
    const wardLeaderStats = await sequelize.query(
      `SELECT 
    (SELECT COUNT(DISTINCT l.v_id)
     FROM head_household hh
     JOIN leaders l ON hh.leader_v_id = l.v_id
     JOIN v_info v ON l.v_id = v.v_id
     LEFT JOIN barangays b ON v.barangayId = b.id
     INNER JOIN (
       SELECT v_id, MAX(dateadded) as latest_date
       FROM leaders
       WHERE type = 1
       GROUP BY v_id
     ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
     WHERE l.type = 1 
       AND hh.leader_v_id IS NOT NULL
       AND l.electionyear = 2025
       ${municipality ? ` AND b.municipality LIKE '%${municipality}%'` : ''}
       ${barangay ? ` AND b.barangay LIKE '%${barangay}%'` : ''}
       AND l.is_printed = 0
    ) AS 'not_printed',
    
    (SELECT COUNT(DISTINCT l.v_id)
     FROM head_household hh
     JOIN leaders l ON hh.leader_v_id = l.v_id
     JOIN v_info v ON l.v_id = v.v_id
     LEFT JOIN barangays b ON v.barangayId = b.id
     INNER JOIN (
       SELECT v_id, MAX(dateadded) as latest_date
       FROM leaders
       WHERE type = 1
       GROUP BY v_id
     ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
     WHERE l.type = 1 
       AND hh.leader_v_id IS NOT NULL
       AND l.electionyear = 2025
       ${municipality ? ` AND b.municipality LIKE '%${municipality}%'` : ''}
       ${barangay ? ` AND b.barangay LIKE '%${barangay}%'` : ''}
       AND l.is_printed = 1
    ) AS 'printed',
    
    (SELECT COUNT(DISTINCT l.v_id)
     FROM head_household hh
     JOIN leaders l ON hh.leader_v_id = l.v_id
     JOIN v_info v ON l.v_id = v.v_id
     LEFT JOIN barangays b ON v.barangayId = b.id
     INNER JOIN (
       SELECT v_id, MAX(dateadded) as latest_date
       FROM leaders
       WHERE type = 1
       GROUP BY v_id
     ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
     WHERE l.type = 1 
       AND hh.leader_v_id IS NOT NULL
       AND l.electionyear = 2025
       ${municipality ? ` AND b.municipality LIKE '%${municipality}%'` : ''}
       ${barangay ? ` AND b.barangay LIKE '%${barangay}%'` : ''}
    ) AS 'total'`,
      { type: QueryTypes.SELECT }
    );
    
    // Get barangay coordinator print statistics - only count the latest entry for each v_id based on dateadded
    const coordinatorStats = await sequelize.query(
      `SELECT 
        SUM(CASE WHEN l.is_printed = 1 THEN 1 ELSE 0 END) AS printed,
        SUM(CASE WHEN l.is_printed = 0 OR l.is_printed IS NULL THEN 1 ELSE 0 END) AS not_printed,
        COUNT(*) AS total
      FROM 
        leaders l
      JOIN 
        v_info v ON l.v_id = v.v_id
      LEFT JOIN
        barangays b ON v.barangayId = b.id
      INNER JOIN (
        SELECT v_id, MAX(dateadded) as latest_date
        FROM leaders
        WHERE type = 2
        GROUP BY v_id
      ) latest ON l.v_id = latest.v_id AND l.dateadded = latest.latest_date
      WHERE 
        l.type = 2
        ${whereClause ? 'AND' + whereClause.substring(whereClause.indexOf('WHERE') + 5) : ''}`,
      { type: QueryTypes.SELECT }
    );
    
    // Get municipalities and barangays for filters
    const municipalities = await sequelize.query(
      `SELECT DISTINCT municipality FROM barangays ORDER BY municipality`,
      { type: QueryTypes.SELECT }
    );
    
    const barangays = await sequelize.query(
      `SELECT DISTINCT barangay, municipality FROM barangays ORDER BY municipality, barangay`,
      { type: QueryTypes.SELECT }
    );
    
    // Return the data
    res.json({
      status: 'success',
      data: {
        households: householdStats[0],
        wardLeaders: wardLeaderStats[0],
        coordinators: coordinatorStats[0]
      },
      filterOptions: {
        municipalities,
        barangays
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching print statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch print statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};