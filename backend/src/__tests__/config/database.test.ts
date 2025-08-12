import { DatabaseConnection, databaseConnection } from '../../config/database';

describe('Database Connection', () => {
  let dbConnection: DatabaseConnection;

  beforeEach(() => {
    dbConnection = DatabaseConnection.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DatabaseConnection.getInstance();
      const instance2 = DatabaseConnection.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Connection Status', () => {
    it('should return correct connection status', () => {
      expect(dbConnection.getConnectionStatus()).toBe(false);
    });
  });

  describe('Exported Instance', () => {
    it('should export a database connection instance', () => {
      expect(databaseConnection).toBeDefined();
      expect(databaseConnection).toBeInstanceOf(DatabaseConnection);
    });

    it('should be the same instance as getInstance', () => {
      const instance = DatabaseConnection.getInstance();
      expect(databaseConnection).toBe(instance);
    });
  });
});
