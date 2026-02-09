/**
 * Simple utility for generating random data for testing and debugging
 */

const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Margaret', 'Anthony', 'Betty', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Dorothy', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const domains = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'mail.com', 'aol.com', 'protonmail.com', 'example.com', 'test.com'
];

/**
 * Get a random element from an array
 */
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Get a random integer between min and max (inclusive)
 */
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a random first name
 */
export const getRandomFirstName = (): string => {
  return getRandomElement(firstNames);
};

/**
 * Generate a random last name
 */
export const getRandomLastName = (): string => {
  return getRandomElement(lastNames);
};

/**
 * Generate a random full name
 */
export const getRandomFullName = (): string => {
  return `${getRandomFirstName()} ${getRandomLastName()}`;
};

/**
 * Generate a random email based on a name
 */
export const getRandomEmail = (firstName?: string, lastName?: string): string => {
  const first = firstName || getRandomFirstName();
  const last = lastName || getRandomLastName();
  const domain = getRandomElement(domains);
  const number = getRandomInt(100, 999);
  
  return `${first.toLowerCase()}.${last.toLowerCase()}${number}@${domain}`;
};

/**
 * Generate a random US phone number
 */
export const getRandomPhone = (): string => {
  const areaCode = getRandomInt(100, 999);
  const prefix = getRandomInt(100, 999);
  const lineNumber = getRandomInt(1000, 9999);
  
  return `+1${areaCode}${prefix}${lineNumber}`;
}; 