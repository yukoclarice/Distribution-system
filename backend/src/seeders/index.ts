import { sequelize } from '../config/database';
import { User } from '../models';

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Force sync all models (recreates tables)
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Seed users
    const users = await User.bulkCreate([
      {
        username: 'john_admin',
        password: 'password123',
        fname: 'John',
        mname: 'Robert',
        lname: 'Doe',
        contact_no: '555-123-4567',
        user_type: 'admin',
        status: 'active',
        login_ip: '192.168.1.1',
        last_login: new Date('2023-10-15')
      },
      {
        username: 'jane_user',
        password: 'password123',
        fname: 'Jane',
        mname: 'Marie',
        lname: 'Smith',
        contact_no: '555-987-6543',
        user_type: 'user',
        status: 'active',
        login_ip: '192.168.1.2',
        last_login: new Date('2023-10-20')
      },
      {
        username: 'mike_sales',
        password: 'password123',
        fname: 'Michael',
        mname: 'James',
        lname: 'Wilson',
        contact_no: '555-555-5555',
        user_type: 'user',
        status: 'inactive',
        login_ip: '192.168.1.3',
        last_login: new Date('2023-09-10')
      },
      {
        username: 'sara_support',
        password: 'password123',
        fname: 'Sara',
        lname: 'Johnson',
        contact_no: '555-444-3333',
        user_type: 'support',
        status: 'active',
        login_ip: '192.168.1.4',
        last_login: new Date('2023-10-22')
      },
      {
        username: 'david_manager',
        password: 'password123',
        fname: 'David',
        lname: 'Brown',
        contact_no: '555-222-1111',
        user_type: 'manager',
        status: 'active',
        login_ip: '192.168.1.5',
        last_login: new Date('2023-10-21')
      }
    ]);

    console.log(`Seeded ${users.length} users`);
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
};

// Run seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase; 